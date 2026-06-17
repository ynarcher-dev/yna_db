-- =============================================================================
-- 0026_file_downloads.sql — 업로드 파일 메타데이터 + 다운로드 감사 로그
-- 출처: 15_system_schema.md 4·5장, 17_conventions.md 4장 (다운로드 규약).
-- 선행: 0001(startups/followups), 0002(current_user_role), 0010(managers),
--       0025(reports 버킷+공개정책 — 본 파일에서 비공개로 전환).
-- 설계(RPC + 비공개 버킷):
--   uploaded_files     : S3/Storage 파일 메타데이터(소유자·용도·경로·용량).
--   file_download_logs : 다운로드 감사 로그(누가·언제·무엇을·어떤 목적으로).
--   log_file_download(): SECURITY DEFINER RPC — 권한 검증 후 로그 INSERT(클라 직접 INSERT 차단).
--   reports 버킷       : public=false 전환 + 직원 SELECT 정책(createSignedUrl 발급 허용).
-- 비고: ip_address 는 PostgREST 경유로 실제 클라 IP 식별이 불가하여 NULL 로 둔다(user_agent 만 기록).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE / ON CONFLICT.
-- =============================================================================

-- 1) 업로드 파일 메타데이터 (15_system_schema.md 4장) -------------------------
CREATE TABLE IF NOT EXISTS public.uploaded_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    purpose VARCHAR(30) NOT NULL, -- followup_report, ai_source, profile_image, startup_logo, partner_doc
    -- AI 세션 연계용. ai_chat_sessions 는 AI 기능 단계에서 생성되므로, 그때 FK 를 추가한다(아래 6번 참고).
    session_id UUID,
    file_name VARCHAR(255) NOT NULL,
    s3_key TEXT NOT NULL UNIQUE, -- Storage 경로(사용자/세션별 prefix 포함)
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (purpose IN ('followup_report', 'ai_source', 'profile_image', 'startup_logo', 'partner_doc')),
    CHECK (file_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner ON public.uploaded_files (owner_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_expiry
  ON public.uploaded_files (expires_at) WHERE expires_at IS NOT NULL;

-- 2) 파일 다운로드 로그 (15_system_schema.md 5장) -----------------------------
CREATE TABLE IF NOT EXISTS public.file_download_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.uploaded_files(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    source_type VARCHAR(40) NOT NULL, -- startup_followup, partner_doc, fund_doc 등
    source_id UUID,                   -- 원천 업무 레코드 id
    section_key VARCHAR(80) NOT NULL, -- 화면 카드 섹션 식별자(예: startup_followups)
    download_purpose TEXT NOT NULL,
    batch_id UUID,                    -- zip/일괄 다운로드 묶음 식별
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (length(trim(download_purpose)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_file_download_logs_file
  ON public.file_download_logs (file_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_download_logs_source
  ON public.file_download_logs (source_type, source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_download_logs_actor
  ON public.file_download_logs (actor_id, created_at DESC);

-- 3) RLS ----------------------------------------------------------------------
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_download_logs ENABLE ROW LEVEL SECURITY;

-- 업로드 파일: 소유자/Admin 전체. 업무 파일(ai_source 제외)은 직원(manager)도 조회 가능.
-- (15_system_schema.md 7.3 IMPORTANT — ai_source 만 엄격히 소유자 한정)
DROP POLICY IF EXISTS uploaded_files_select_visible ON public.uploaded_files;
CREATE POLICY uploaded_files_select_visible
ON public.uploaded_files FOR SELECT TO authenticated
USING (
    owner_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'manager' AND purpose <> 'ai_source')
);

DROP POLICY IF EXISTS uploaded_files_insert_own ON public.uploaded_files;
CREATE POLICY uploaded_files_insert_own
ON public.uploaded_files FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- 다운로드 로그: 조회 가능 업무 파일 기준 표시. 기록(INSERT)은 RPC(정의자 권한)만.
DROP POLICY IF EXISTS file_download_logs_select_visible ON public.file_download_logs;
CREATE POLICY file_download_logs_select_visible
ON public.file_download_logs FOR SELECT TO authenticated
USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.uploaded_files f
        WHERE f.id = file_id
          AND (f.owner_id = auth.uid() OR public.current_user_role() = 'manager')
    )
);
-- INSERT/UPDATE/DELETE 클라이언트 정책 없음 (append-only, RPC 전용).

-- 4) 다운로드 로그 RPC (권한 검증 + 로그 기록을 같은 흐름에서) -----------------
-- 클라이언트는 이 RPC 로만 로그를 남긴다. 검증 통과 후 호출부가 createSignedUrl 로 다운로드.
DROP FUNCTION IF EXISTS public.log_file_download(UUID, VARCHAR, UUID, VARCHAR, TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.log_file_download(
    p_file_id UUID,
    p_source_type VARCHAR,
    p_source_id UUID,
    p_section_key VARCHAR,
    p_purpose TEXT,
    p_batch_id UUID DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT := public.current_user_role();
    v_owner UUID;
    v_purpose_kind VARCHAR(30);
    v_log_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다.' USING ERRCODE = '42501';
    END IF;
    IF length(trim(coalesce(p_purpose, ''))) = 0 THEN
        RAISE EXCEPTION '다운로드 목적은 비워둘 수 없습니다.' USING ERRCODE = '23514';
    END IF;

    SELECT owner_id, purpose INTO v_owner, v_purpose_kind
    FROM public.uploaded_files WHERE id = p_file_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION '대상 파일을 찾을 수 없습니다.' USING ERRCODE = 'P0002';
    END IF;

    -- 가시성 검증: Admin 전체 / 소유자 본인 / 업무 파일(ai_source 제외)은 Manager 허용.
    IF NOT (
        v_role = 'admin'
        OR v_owner = auth.uid()
        OR (v_role = 'manager' AND v_purpose_kind <> 'ai_source')
    ) THEN
        RAISE EXCEPTION '이 파일을 다운로드할 권한이 없습니다.' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.file_download_logs (
        file_id, actor_id, source_type, source_id, section_key,
        download_purpose, batch_id, user_agent
    ) VALUES (
        p_file_id, auth.uid(), p_source_type, p_source_id, p_section_key,
        trim(p_purpose), p_batch_id, p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_file_download(UUID, VARCHAR, UUID, VARCHAR, TEXT, UUID, TEXT)
  TO authenticated;

-- 5) reports 버킷 비공개 전환 + 직원 SELECT(서명 URL 발급) 정책 ---------------
-- 0025 의 공개 읽기를 폐기하고, 직원만 createSignedUrl 로 단기 GET URL 을 받게 한다.
UPDATE storage.buckets SET public = false WHERE id = 'reports';

DROP POLICY IF EXISTS reports_public_read ON storage.objects;

DROP POLICY IF EXISTS reports_staff_read ON storage.objects;
CREATE POLICY reports_staff_read ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'reports' AND public.current_user_role() IN ('admin', 'manager'));

-- 6) (예정) AI 기능 단계에서 ai_chat_sessions 생성 후 아래 FK 를 추가한다:
--   ALTER TABLE public.uploaded_files
--     ADD CONSTRAINT uploaded_files_session_id_fkey
--     FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;

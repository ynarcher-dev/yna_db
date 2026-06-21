-- =============================================================================
-- 0058_invest_archives.sql — 투자 자료실(게시판형) 테이블·RLS·조회수 RPC
-- 출처: docs/22_invest_archives.md (공통 서식·템플릿·시장분석 보고서 게시판 + 첨부 다운로드).
-- 선행: 0001(managers), 0002(역할 헬퍼 current_user_role), 0006(set_updated_at()),
--       0031(uploaded_files 폴리모픽 첨부 — entity_type='invest_archive' 로 재사용, 추가 불필요).
-- 권한(22.4): 읽기=전 직원 / 등록·수정=Admin·Manager(수정은 작성자 본인 한정 RLS) /
--   삭제(소프트)=Admin(전체) · Manager(본인 글만).
-- 설계: 신규 테이블이라 sections jsonb·메타 컬럼(created_by·updated_at)을 CREATE 에 포함.
--   조회수는 비작성자도 올릴 수 있어야 하므로 SECURITY DEFINER RPC 로 증가(RLS 우회).
-- 재실행 안전(idempotent): IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 투자 자료실 테이블 ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invest_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    category VARCHAR(50) DEFAULT 'template' NOT NULL, -- template, report, legal, etc
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL,
    sections JSONB NOT NULL DEFAULT '{"attachments":true}'::jsonb,
    created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (category IN ('template', 'report', 'legal', 'etc'))
);

CREATE INDEX IF NOT EXISTS idx_invest_archives_pinned
  ON public.invest_archives (is_pinned, created_at DESC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS invest_archives_set_updated_at ON public.invest_archives;
CREATE TRIGGER invest_archives_set_updated_at
BEFORE UPDATE ON public.invest_archives
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) RLS 활성화 + SELECT(전 직원) ----------------------------------------------
ALTER TABLE public.invest_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invest_archives_select_authenticated ON public.invest_archives;
CREATE POLICY invest_archives_select_authenticated
ON public.invest_archives FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- 3) 쓰기 — 등록=전 직원 / 수정·삭제=작성자 본인 또는 Admin ---------------------
DROP POLICY IF EXISTS invest_archives_insert_staff ON public.invest_archives;
CREATE POLICY invest_archives_insert_staff
ON public.invest_archives FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

-- 수정·소프트삭제 모두 UPDATE. Admin 은 전체, Manager 는 본인 글만(작성자=auth.uid()).
DROP POLICY IF EXISTS invest_archives_update_owner ON public.invest_archives;
CREATE POLICY invest_archives_update_owner
ON public.invest_archives FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND (public.current_user_role() = 'admin' OR created_by = auth.uid())
)
WITH CHECK (
    public.current_user_role() = 'admin' OR created_by = auth.uid()
);

-- 4) 조회수 증가 RPC — 상세 진입 시 1 증가(비작성자 포함). SECURITY DEFINER 로 RLS 우회.
CREATE OR REPLACE FUNCTION public.increment_archive_views(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.invest_archives
    SET views = views + 1
    WHERE id = p_id AND deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.increment_archive_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_archive_views(UUID) TO authenticated;

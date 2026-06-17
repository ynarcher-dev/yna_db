-- =============================================================================
-- 0025_startup_followups_rework.sql — 후속관리 개편(파일 제출 중심)
-- 출처: 발주자 요청 — 제출 기한 제거 / 복수 첨부파일 업로드 / 코멘트 / 파일 기반 제출.
-- 선행: 0001(startup_followups), 0002(current_user_role), 0017(write RLS).
-- 변경:
--   due_date  : 더 이상 사용 안 함 → NOT NULL 해제(컬럼은 호환 위해 유지).
--   files     : 복수 첨부파일 [{name, path, url}] jsonb.
--   comment   : 업로드 코멘트(text).
--   milestones: 더 이상 사용 안 함(컬럼은 유지, 화면에서 제거).
--   Storage 'reports' 버킷 + 정책(직원 업로드/수정/삭제, 공개 읽기).
-- 비고: 보고서 파일은 내부 자료이나 프로젝트 표준(공개 버킷+getPublicUrl)을 따른다.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS / ON CONFLICT.
-- =============================================================================

ALTER TABLE public.startup_followups ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE public.startup_followups
  ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.startup_followups ADD COLUMN IF NOT EXISTS comment TEXT;

-- 제출 자료 Storage 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS reports_public_read ON storage.objects;
CREATE POLICY reports_public_read ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'reports');

DROP POLICY IF EXISTS reports_staff_insert ON storage.objects;
CREATE POLICY reports_staff_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports' AND public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS reports_staff_update ON storage.objects;
CREATE POLICY reports_staff_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'reports' AND public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (bucket_id = 'reports' AND public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS reports_staff_delete ON storage.objects;
CREATE POLICY reports_staff_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'reports' AND public.current_user_role() IN ('admin', 'manager'));

-- =============================================================================
-- 0036_project_links_write.sql — 프로젝트 매칭 스타트업/협력사 조인 쓰기 RLS
-- 출처: docs/10_projects.md 10.3 (매핑 추가/해제), 10.4 (작성·수정 Admin·Manager).
-- 선행: 0001_schema.sql(project_startups·project_partners), 0002_rls.sql(RLS 활성화·역할 헬퍼),
--       0004_rls_select.sql(두 조인 SELECT 정책).
-- 권한: 조회=전 직원(0004), 매핑 추가/해제(INSERT/DELETE)=전 직원(관리자·심사역).
--   조인 테이블은 소프트삭제가 아니라 실제 DELETE 로 매핑을 해제한다.
-- 재실행 안전(idempotent): DROP POLICY IF EXISTS.
-- =============================================================================

-- project_startups -----------------------------------------------------------
DROP POLICY IF EXISTS project_startups_insert_staff ON public.project_startups;
CREATE POLICY project_startups_insert_staff
ON public.project_startups FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS project_startups_delete_staff ON public.project_startups;
CREATE POLICY project_startups_delete_staff
ON public.project_startups FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- project_partners -----------------------------------------------------------
DROP POLICY IF EXISTS project_partners_insert_staff ON public.project_partners;
CREATE POLICY project_partners_insert_staff
ON public.project_partners FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS project_partners_delete_staff ON public.project_partners;
CREATE POLICY project_partners_delete_staff
ON public.project_partners FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

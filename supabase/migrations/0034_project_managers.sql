-- =============================================================================
-- 0034_project_managers.sql — 프로젝트 담당자(다대다) 조인 테이블 신설
-- 출처: 발주자 확정(2026-06-17) "책임자 / 담당자 / 관리자" 모델.
--   책임자(created_by)는 1인, 담당자는 한 프로젝트에 여러 심사역을 배정할 수 있다.
--   (10_projects.md 의 단수 manager_id 를 대체하는 다대다 매핑. manager_id 컬럼은 미사용.)
-- 선행: 0001_schema.sql(projects·managers), 0002_rls.sql(역할 헬퍼 current_user_role).
-- 권한: 조회=전 직원, 배정 추가/해제(INSERT/DELETE)=전 직원(관리자·심사역). 수정 개념 없음(행 추가/삭제).
--   조인 테이블은 소프트삭제가 아니라 실제 DELETE 로 배정을 해제한다.
-- 재실행 안전(idempotent): CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, manager_id)
);

-- 프로젝트별 담당자 조회 가속용 인덱스
CREATE INDEX IF NOT EXISTS project_managers_project_id_idx
  ON public.project_managers (project_id);

ALTER TABLE public.project_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_managers_select_authenticated ON public.project_managers;
CREATE POLICY project_managers_select_authenticated
ON public.project_managers FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS project_managers_insert_staff ON public.project_managers;
CREATE POLICY project_managers_insert_staff
ON public.project_managers FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS project_managers_delete_staff ON public.project_managers;
CREATE POLICY project_managers_delete_staff
ON public.project_managers FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

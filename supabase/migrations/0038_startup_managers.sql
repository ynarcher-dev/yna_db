-- =============================================================================
-- 0038_startup_managers.sql — 스타트업 담당자(다대다) retrofit
-- 출처: 발주자 확정(2026-06-17) "책임자/담당자/관리자" 모델을 스타트업에도 적용.
--   기존 단수 startups.manager_id → startup_managers(다대다) 로 전환. 프로젝트(0034) 패턴 복제.
-- 선행: 0001(startups·managers), 0002(역할 헬퍼), 0003(view_department_stats·get_dashboard_summary).
-- 처리:
--   1) startup_managers 조인 신설 + RLS(조회=전직원, 배정 추가/해제=전직원).
--   2) 기존 manager_id 1행 백필(멱등). manager_id 컬럼은 즉시 제거하지 않고 남겨둔다(백필 소스·안전).
--   3) view_department_stats 를 startup_managers 기준으로 재정의(한 스타트업이 여러 담당자를
--      가질 수 있으므로 (부서,스타트업) DISTINCT 후 집계해 가치 중복합산을 방지).
--   4) get_dashboard_summary 의 activeProjects 에 'suspended'(중단) 도 제외(개편된 상태값 반영).
-- 재실행 안전(idempotent): CREATE TABLE IF NOT EXISTS / ON CONFLICT / CREATE OR REPLACE.
-- =============================================================================

-- 1) 담당자 조인 테이블 -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.startup_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (startup_id, manager_id)
);

CREATE INDEX IF NOT EXISTS startup_managers_startup_id_idx
  ON public.startup_managers (startup_id);
CREATE INDEX IF NOT EXISTS startup_managers_manager_id_idx
  ON public.startup_managers (manager_id);

ALTER TABLE public.startup_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS startup_managers_select_authenticated ON public.startup_managers;
CREATE POLICY startup_managers_select_authenticated
ON public.startup_managers FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS startup_managers_insert_staff ON public.startup_managers;
CREATE POLICY startup_managers_insert_staff
ON public.startup_managers FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS startup_managers_delete_staff ON public.startup_managers;
CREATE POLICY startup_managers_delete_staff
ON public.startup_managers FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- 2) 기존 단수 담당자 백필(멱등) ---------------------------------------------
INSERT INTO public.startup_managers (startup_id, manager_id)
SELECT id, manager_id
FROM public.startups
WHERE manager_id IS NOT NULL
ON CONFLICT (startup_id, manager_id) DO NOTHING;

-- 3) 부서별 통계 View 재정의(다대다 기준, 가치 중복합산 방지) -----------------
CREATE OR REPLACE VIEW public.view_department_stats AS
WITH dept_startups AS (
    -- (부서, 스타트업) 고유쌍: 한 스타트업에 같은 부서 담당자가 여럿이어도 1회만 집계
    SELECT DISTINCT mgr.department_id, s.id AS startup_id
    FROM public.managers mgr
    JOIN public.startup_managers sm ON sm.manager_id = mgr.id
    JOIN public.startups s ON s.id = sm.startup_id AND s.deleted_at IS NULL
    WHERE mgr.deleted_at IS NULL AND mgr.department_id IS NOT NULL
)
SELECT
    d.id AS department_id,
    d.name,
    (SELECT COUNT(*) FROM public.managers m2
       WHERE m2.department_id = d.id AND m2.deleted_at IS NULL) AS member_count,
    COUNT(DISTINCT ds.startup_id) AS startup_count,
    COALESCE(SUM(lm.valuation), 0) AS total_valuation,
    COALESCE(SUM(lm.revenue), 0) AS total_revenue
FROM public.departments d
LEFT JOIN dept_startups ds ON ds.department_id = d.id
LEFT JOIN public.view_startup_latest_metrics lm ON lm.startup_id = ds.startup_id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.name;

GRANT SELECT ON public.view_department_stats TO authenticated;

-- 4) 대시보드 요약 재정의(activeProjects 에 suspended 제외) --------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(current_period VARCHAR)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'totalManagers',            (SELECT count(*) FROM managers WHERE deleted_at IS NULL),
        'totalStartups',            (SELECT count(*) FROM startups WHERE deleted_at IS NULL),
        'totalPortfolioValuation',  (SELECT COALESCE(SUM(valuation),0) FROM view_startup_latest_metrics),
        'activePrograms',           (SELECT count(*) FROM programs
                                      WHERE deleted_at IS NULL AND CURRENT_DATE BETWEEN start_date AND end_date),
        'totalAum',                 (SELECT COALESCE(SUM(total_amount),0) FROM funds WHERE deleted_at IS NULL),
        'averageFundExhaustionRate',(SELECT COALESCE(ROUND(AVG(exhaustion_rate),2),0) FROM view_fund_exhaustion),
        'totalExperts',             (SELECT count(*) FROM experts WHERE deleted_at IS NULL),
        'averageMentoringRating',   (SELECT COALESCE(ROUND(AVG(rating),1),0) FROM expert_mentorings WHERE rating IS NOT NULL),
        'activeProjects',           (SELECT count(*) FROM projects
                                      WHERE deleted_at IS NULL AND stage NOT IN ('completed','canceled','suspended')),
        'reportSubmissionRate',     public.get_report_submission_rate(current_period),
        'totalDepartments',         (SELECT count(*) FROM departments WHERE deleted_at IS NULL),
        'totalPartners',            (SELECT count(*) FROM partners WHERE deleted_at IS NULL)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated;

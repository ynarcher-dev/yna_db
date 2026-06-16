-- =============================================================================
-- 0003_aggregations.sql — 집계 View · RPC + 일정 동기화 Trigger + GRANT
-- 출처: docs/16_aggregations.md (Phase 2 대시보드 사전작업)
-- 선행: 0001_schema.sql, 0002_rls.sql / 후속: 0004_rls_select.sql, seed.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 스타트업 최신 지표 View (가장 최근 record_date 기준)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_startup_latest_metrics AS
SELECT DISTINCT ON (m.startup_id)
    m.startup_id,
    m.record_date,
    m.valuation,
    m.revenue,
    m.employee_count
FROM public.startup_metrics m
ORDER BY m.startup_id, m.record_date DESC;

-- -----------------------------------------------------------------------------
-- 2. 전문가 평점 View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_expert_ratings AS
SELECT
    e.id AS expert_id,
    COUNT(em.id) AS mentoring_count,
    ROUND(AVG(em.rating), 1) AS average_rating
FROM public.experts e
LEFT JOIN public.expert_mentorings em ON em.expert_id = e.id AND em.rating IS NOT NULL
GROUP BY e.id;

-- -----------------------------------------------------------------------------
-- 3. 펀드 소진율 View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_fund_exhaustion AS
SELECT
    f.id AS fund_id,
    f.total_amount,
    f.balance,
    CASE WHEN f.total_amount > 0
         THEN ROUND((f.total_amount - f.balance) / f.total_amount * 100, 2)
         ELSE 0 END AS exhaustion_rate
FROM public.funds f
WHERE f.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 4. 부서별 성과 통계 View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_department_stats AS
SELECT
    d.id AS department_id,
    d.name,
    COUNT(DISTINCT mgr.id) AS member_count,
    COUNT(DISTINCT s.id) AS startup_count,
    COALESCE(SUM(lm.valuation), 0) AS total_valuation,
    COALESCE(SUM(lm.revenue), 0) AS total_revenue
FROM public.departments d
LEFT JOIN public.managers mgr ON mgr.department_id = d.id AND mgr.deleted_at IS NULL
LEFT JOIN public.startups s ON s.manager_id = mgr.id AND s.deleted_at IS NULL
LEFT JOIN public.view_startup_latest_metrics lm ON lm.startup_id = s.id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.name;

-- -----------------------------------------------------------------------------
-- 5. 분기 보고서 제출율 RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_report_submission_rate(target_period VARCHAR)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
    SELECT CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE is_submitted) * 100.0 / COUNT(*), 1)
    END
    FROM public.startup_followups
    WHERE reporting_period = target_period;
$$;

-- -----------------------------------------------------------------------------
-- 6. 대시보드 통합 요약 RPC (9개 도메인 카드 1회 호출)
-- -----------------------------------------------------------------------------
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
                                      WHERE deleted_at IS NULL AND stage NOT IN ('completed','canceled')),
        'reportSubmissionRate',     public.get_report_submission_rate(current_period),
        'totalDepartments',         (SELECT count(*) FROM departments WHERE deleted_at IS NULL),
        'totalPartners',            (SELECT count(*) FROM partners WHERE deleted_at IS NULL)
    );
$$;

-- -----------------------------------------------------------------------------
-- 7. 일정 동기화 (program_events → system_events)
--    주의: 16_aggregations.md 는 SECURITY INVOKER 로 기술하나, system_events 는
--    Admin 만 작성 가능한 테이블이라 Manager 가 program_events 를 만들면 INVOKER
--    트리거가 RLS 에 막혀 동기화가 실패한다. 교차 테이블 동기화이므로 SECURITY
--    DEFINER 로 두고 일반 권한을 회수해 안전하게 기록한다.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_program_event_to_system()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.system_events
        WHERE source_type = 'program' AND source_id = OLD.id;
        RETURN OLD;
    END IF;

    INSERT INTO public.system_events (title, event_type, event_date, source_type, source_id, description)
    VALUES (NEW.title, NEW.event_type, NEW.event_date, 'program', NEW.id, NEW.description)
    ON CONFLICT (source_type, source_id) DO UPDATE
        SET title = EXCLUDED.title,
            event_type = EXCLUDED.event_type,
            event_date = EXCLUDED.event_date,
            description = EXCLUDED.description;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_program_event_to_system() FROM PUBLIC;

DROP TRIGGER IF EXISTS program_events_sync_trigger ON public.program_events;
CREATE TRIGGER program_events_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.program_events
FOR EACH ROW EXECUTE FUNCTION public.sync_program_event_to_system();

-- -----------------------------------------------------------------------------
-- 8. View / RPC 실행 권한 (SECURITY INVOKER → 호출자 RLS 상속)
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.view_startup_latest_metrics TO authenticated;
GRANT SELECT ON public.view_expert_ratings TO authenticated;
GRANT SELECT ON public.view_fund_exhaustion TO authenticated;
GRANT SELECT ON public.view_department_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_submission_rate(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated;

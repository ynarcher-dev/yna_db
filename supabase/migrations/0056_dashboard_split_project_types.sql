-- 0056_dashboard_split_project_types.sql
-- 목적: M&A 관리와 신사업 관리는 상호 배타적(project_type) 도메인으로 분리 운영하므로
--       대시보드 합산 지표도 둘로 나눈다.
--   - get_dashboard_summary 의 'activeProjects'(M&A+신사업 합산) 제거
--   - 'activeMaProjects'(project_type='m_and_a') / 'activeNewBizProjects'(project_type='new_business') 신설
--   '기타'(other) 유형은 두 메뉴 어디에도 포함하지 않으므로 두 집계 모두에서 제외된다.
-- 비고: 테이블/컬럼 변경 없음. 0055 의 함수 정의를 그대로 두고 프로젝트 집계 항목만 교체.

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(current_period VARCHAR)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'totalManagers',            (SELECT count(*) FROM managers WHERE deleted_at IS NULL),
        'totalStartups',            (SELECT count(*) FROM startups WHERE deleted_at IS NULL),
        'totalPortfolioValuation',  (SELECT COALESCE(SUM(valuation),0) FROM view_startup_latest_metrics),
        'activeBusinesses',         (SELECT count(*) FROM businesses
                                      WHERE deleted_at IS NULL AND CURRENT_DATE BETWEEN start_date AND end_date),
        'totalAum',                 (SELECT COALESCE(SUM(total_amount),0) FROM funds WHERE deleted_at IS NULL),
        'averageFundExhaustionRate',(SELECT COALESCE(ROUND(AVG(exhaustion_rate),2),0) FROM view_fund_exhaustion),
        'totalExperts',             (SELECT count(*) FROM experts WHERE deleted_at IS NULL),
        'averageMentoringRating',   (SELECT COALESCE(ROUND(AVG(rating),1),0) FROM expert_mentorings WHERE rating IS NOT NULL),
        'activeMaProjects',         (SELECT count(*) FROM projects
                                      WHERE deleted_at IS NULL AND project_type = 'm_and_a'
                                        AND stage NOT IN ('completed','canceled','suspended')),
        'activeNewBizProjects',     (SELECT count(*) FROM projects
                                      WHERE deleted_at IS NULL AND project_type = 'new_business'
                                        AND stage NOT IN ('completed','canceled','suspended')),
        'reportSubmissionRate',     public.get_report_submission_rate(current_period),
        'totalDepartments',         (SELECT count(*) FROM departments WHERE deleted_at IS NULL),
        'totalPartners',            (SELECT count(*) FROM partners WHERE deleted_at IS NULL)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated;

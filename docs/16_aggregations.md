# 📊 16. 집계 View·RPC 및 이벤트 동기화 (16_aggregations.md)

본 문서는 [4_dashboard.md](4_dashboard.md), [9_experts.md](9_experts.md), [11_departments.md](11_departments.md) 등에서 "계산값"으로 요구되는 지표의 산출 방식을 DB View / RPC로 명확히 정의합니다. 화면은 원시 테이블을 직접 합산하지 않고 아래 View/RPC를 호출합니다.

---

## 1. 스타트업 최신 지표 View (view_startup_latest_metrics)

`startup_metrics`는 시계열 스냅샷이므로, "현재 기업가치/매출/고용"은 **가장 최근 `record_date`** 행을 기준으로 합니다.

```sql
CREATE OR REPLACE VIEW public.view_startup_latest_metrics AS
SELECT DISTINCT ON (m.startup_id)
    m.startup_id,
    m.record_date,
    m.valuation,
    m.revenue,
    m.employee_count
FROM public.startup_metrics m
ORDER BY m.startup_id, m.record_date DESC;
```

* 포트폴리오 합산 기업가치(`totalPortfolioValuation`), 부서별 자산 합계는 모두 이 View를 합산해 산출합니다.

---

## 2. 전문가 평점 View (view_expert_ratings)

[9_experts.md](9_experts.md)의 `averageMentoringRating`(별점)과 [3_smart_features.md](3_smart_features.md) 매칭 프롬프트의 `average_mentoring_rating`은 **컬럼이 아니라 집계값**입니다.

```sql
CREATE OR REPLACE VIEW public.view_expert_ratings AS
SELECT
    e.id AS expert_id,
    COUNT(em.id) AS mentoring_count,
    ROUND(AVG(em.rating), 1) AS average_rating -- 평가 없으면 NULL
FROM public.experts e
LEFT JOIN public.expert_mentorings em ON em.expert_id = e.id AND em.rating IS NOT NULL
GROUP BY e.id;
```

---

## 3. 펀드 소진율 View (view_fund_exhaustion)

```sql
CREATE OR REPLACE VIEW public.view_fund_exhaustion AS
SELECT
    f.id AS fund_id,
    f.total_amount,
    f.balance,
    CASE WHEN f.total_amount > 0
         THEN ROUND((f.total_amount - f.balance) / f.total_amount * 100, 2)
         ELSE 0 END AS exhaustion_rate -- 소진율(%)
FROM public.funds f
WHERE f.deleted_at IS NULL;
```

* 대시보드 `averageFundExhaustionRate` = 위 View `exhaustion_rate`의 평균.

---

## 4. 부서별 성과 통계 View (view_department_stats)

[11_departments.md](11_departments.md)의 본부 투자 성과 비교용.

```sql
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
```

---

## 5. 분기 보고서 제출율 (get_report_submission_rate RPC)

[4_dashboard.md](4_dashboard.md) `reportSubmissionRate` 및 [6_startups.md](6_startups.md) 제출률. 분모는 "해당 기간에 생성된 제출 대상 건수"입니다.

```sql
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
```

* `target_period` 예: `'2026-Q2'`. 현재 분기 문자열은 클라이언트가 산출해 전달하거나, 인자 생략 시 현재 분기를 계산하는 오버로드를 추가합니다.

---

## 6. 대시보드 통합 요약 RPC (get_dashboard_summary)

[4_dashboard.md](4_dashboard.md)의 `CeoDashboardSummary.metrics`를 한 번의 호출로 반환합니다. 9개 도메인 카드를 위해 화면에서 개별 카운트 쿼리를 난사하지 않습니다.

```sql
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
```

* **다가오는 일정(`upcomingEvents`)**: 아래 7번 `system_events`에서 `event_date >= CURRENT_DATE` 5건을 별도 조회합니다.
* **성능**: 초기엔 실시간 RPC로 충분합니다. 데이터가 커지면 5~10분 주기 갱신 Materialized View로 전환합니다.

---

## 7. 일정 동기화 (program_events → system_events)

[4_dashboard.md](4_dashboard.md) 4.3.2는 동일 일정을 양쪽에 수동 중복 입력하지 않도록 요구합니다. `program_events` 변경 시 `system_events`에 자동 반영하는 Trigger를 둡니다.

```sql
CREATE OR REPLACE FUNCTION public.sync_program_event_to_system()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
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

-- ON CONFLICT 대상 유니크 제약은 system_events 테이블 정의에 포함되어 있다
-- (0_db_schema.md: UNIQUE (source_type, source_id)). 기존 DB라면 아래로 보강한다.
-- ALTER TABLE public.system_events ADD CONSTRAINT uq_system_events_source UNIQUE (source_type, source_id);

CREATE TRIGGER program_events_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.program_events
FOR EACH ROW EXECUTE FUNCTION public.sync_program_event_to_system();
```

> [!NOTE]
> `system_events.event_type` CHECK는 `recruitment, demoday, networking, meeting, ir, event`만 허용합니다([0_db_schema.md](0_db_schema.md)). `program_events.event_type`도 이 집합 안에서 사용해야 동기화 시 제약 위반이 없습니다. 수동 입력 일정(협력 미팅, IR 등)은 `source_type = 'manual'`로 직접 INSERT합니다.

---

## 8. View 권한 (SECURITY INVOKER)

* 위 View/RPC는 모두 `SECURITY INVOKER`로 동작하여 호출자의 RLS가 그대로 적용됩니다. 단, `view_*` 집계 View는 기반 테이블의 SELECT 정책(authenticated 전체 조회)을 그대로 상속하므로 별도 GRANT만 부여합니다.

```sql
GRANT SELECT ON public.view_startup_latest_metrics TO authenticated;
GRANT SELECT ON public.view_expert_ratings TO authenticated;
GRANT SELECT ON public.view_fund_exhaustion TO authenticated;
GRANT SELECT ON public.view_department_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_submission_rate(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated;
```

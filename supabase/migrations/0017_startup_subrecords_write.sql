-- =============================================================================
-- 0017_startup_subrecords_write.sql — 스타트업 종속 테이블 작성 RLS
--   (startup_metrics 성장 지표 / startup_followups 후속 보고)
-- 출처: docs/6_startups.md 6.4 (지표·후속 보고 작성/수정 Admin·Manager).
-- 선행: 0002_rls.sql(RLS 활성화 + current_user_role()), 0004_rls_select.sql(두 테이블 SELECT).
-- 비고: 두 테이블은 deleted_at 이 없는 종속 이력이라 소프트삭제가 아닌 실제 DELETE 를 쓴다.
--       INSERT/UPDATE/DELETE 모두 직원(admin/manager)에게 허용(스타트업 운영 데이터 관리).
--       startups 본체와 달리 행 단위 추가/삭제가 일상적이므로 DELETE 도 직원에게 연다.
-- 재실행 안전(idempotent): DROP ... IF EXISTS 후 생성.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- startup_metrics (성장 지표)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS startup_metrics_insert_staff ON public.startup_metrics;
CREATE POLICY startup_metrics_insert_staff
ON public.startup_metrics FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS startup_metrics_update_staff ON public.startup_metrics;
CREATE POLICY startup_metrics_update_staff
ON public.startup_metrics FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS startup_metrics_delete_staff ON public.startup_metrics;
CREATE POLICY startup_metrics_delete_staff
ON public.startup_metrics FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- ---------------------------------------------------------------------------
-- startup_followups (후속 보고)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS startup_followups_insert_staff ON public.startup_followups;
CREATE POLICY startup_followups_insert_staff
ON public.startup_followups FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS startup_followups_update_staff ON public.startup_followups;
CREATE POLICY startup_followups_update_staff
ON public.startup_followups FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS startup_followups_delete_staff ON public.startup_followups;
CREATE POLICY startup_followups_delete_staff
ON public.startup_followups FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

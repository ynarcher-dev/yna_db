-- =============================================================================
-- 0004_rls_select.sql — 대시보드(Phase 2)가 읽는 나머지 테이블의 SELECT 정책
-- 출처: docs/2_policies.md 2.2 (읽기는 Admin/Manager 모두 허용)
-- 선행: 0002_rls.sql(전 테이블 RLS 활성화 + startups/funds/managers 정책)
-- 비고: INSERT/UPDATE(작성) 정책은 각 도메인 CRUD 단계(Phase 3·4)에서 도메인별로
--       추가한다. 본 파일은 읽기 전용 대시보드 동작에 필요한 SELECT 만 연다.
--       정책이 없으면 RLS 가 전부 차단하여 집계 카운트가 0/오류가 되므로 필수.
-- =============================================================================

-- (a) deleted_at 보유 마스터 테이블: 미삭제 행만 조회
CREATE POLICY departments_select_authenticated
ON public.departments FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY programs_select_authenticated
ON public.programs FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY experts_select_authenticated
ON public.experts FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY projects_select_authenticated
ON public.projects FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY partners_select_authenticated
ON public.partners FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- (b) deleted_at 없는 종속/이력/조인 테이블: 인증 사용자 전체 조회
CREATE POLICY startup_metrics_select_authenticated
ON public.startup_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY startup_followups_select_authenticated
ON public.startup_followups FOR SELECT TO authenticated USING (true);

CREATE POLICY program_startups_select_authenticated
ON public.program_startups FOR SELECT TO authenticated USING (true);

CREATE POLICY program_managers_select_authenticated
ON public.program_managers FOR SELECT TO authenticated USING (true);

CREATE POLICY program_events_select_authenticated
ON public.program_events FOR SELECT TO authenticated USING (true);

CREATE POLICY system_events_select_authenticated
ON public.system_events FOR SELECT TO authenticated USING (true);

CREATE POLICY capital_calls_select_authenticated
ON public.capital_calls FOR SELECT TO authenticated USING (true);

CREATE POLICY fund_investments_select_authenticated
ON public.fund_investments FOR SELECT TO authenticated USING (true);

CREATE POLICY expert_mentorings_select_authenticated
ON public.expert_mentorings FOR SELECT TO authenticated USING (true);

CREATE POLICY project_startups_select_authenticated
ON public.project_startups FOR SELECT TO authenticated USING (true);

CREATE POLICY project_partners_select_authenticated
ON public.project_partners FOR SELECT TO authenticated USING (true);

CREATE POLICY project_timelines_select_authenticated
ON public.project_timelines FOR SELECT TO authenticated USING (true);

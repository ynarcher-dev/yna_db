-- =============================================================================
-- 0044_program_subrecords_write.sql — 프로그램 하위레코드 쓰기 RLS
--   (program_managers·program_startups·program_events)
-- 출처: docs/7_programs.md 7.4 (작성·수정 Admin·Manager — 매핑·일정 등록 포함).
-- 선행: 0001(세 테이블), 0002(RLS 활성화·역할 헬퍼), 0004(세 테이블 SELECT 정책),
--       0003(program_events → system_events 동기화 트리거: SECURITY DEFINER 라 RLS 우회 기록).
-- 권한: 조회=전 직원(0004), 추가/변경/해제(INSERT/UPDATE/DELETE)=전 직원(관리자·심사역).
--   세 테이블 모두 deleted_at 없는 매핑/이력 → 실제 INSERT/UPDATE/DELETE.
-- 재실행 안전(idempotent): DROP POLICY IF EXISTS.
-- =============================================================================

-- program_managers (운영 심사역 매핑, role lead/operator) -----------------------
DROP POLICY IF EXISTS program_managers_insert_staff ON public.program_managers;
CREATE POLICY program_managers_insert_staff
ON public.program_managers FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_managers_update_staff ON public.program_managers;
CREATE POLICY program_managers_update_staff
ON public.program_managers FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_managers_delete_staff ON public.program_managers;
CREATE POLICY program_managers_delete_staff
ON public.program_managers FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- program_startups (참여 스타트업 매핑, status) --------------------------------
DROP POLICY IF EXISTS program_startups_insert_staff ON public.program_startups;
CREATE POLICY program_startups_insert_staff
ON public.program_startups FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_startups_update_staff ON public.program_startups;
CREATE POLICY program_startups_update_staff
ON public.program_startups FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_startups_delete_staff ON public.program_startups;
CREATE POLICY program_startups_delete_staff
ON public.program_startups FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- program_events (마일스톤 일정; system_events 동기화는 0003 DEFINER 트리거) -------
DROP POLICY IF EXISTS program_events_insert_staff ON public.program_events;
CREATE POLICY program_events_insert_staff
ON public.program_events FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_events_update_staff ON public.program_events;
CREATE POLICY program_events_update_staff
ON public.program_events FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_events_delete_staff ON public.program_events;
CREATE POLICY program_events_delete_staff
ON public.program_events FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

-- =============================================================================
-- 0040_fund_subrecords_write.sql — 펀드 하위레코드(capital_calls·fund_investments) 쓰기 RLS
-- 출처: docs/8_funds.md 8.4 (펀드 및 하위 자금 정보 작성·수정·삭제 Admin 전용).
-- 선행: 0001(capital_calls·fund_investments), 0002(RLS 활성화·역할 헬퍼), 0004(두 테이블 SELECT 정책).
-- 권한: 조회=전 직원(0004), 작성/수정/삭제=Admin 전용. 두 테이블은 deleted_at 없는 이력/조인이라
--   실제 INSERT/UPDATE/DELETE 로 관리한다(펀드 본체와 달리 소프트삭제 아님).
-- 재실행 안전(idempotent): DROP POLICY IF EXISTS.
-- =============================================================================

-- capital_calls --------------------------------------------------------------
DROP POLICY IF EXISTS capital_calls_insert_admin ON public.capital_calls;
CREATE POLICY capital_calls_insert_admin
ON public.capital_calls FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS capital_calls_update_admin ON public.capital_calls;
CREATE POLICY capital_calls_update_admin
ON public.capital_calls FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS capital_calls_delete_admin ON public.capital_calls;
CREATE POLICY capital_calls_delete_admin
ON public.capital_calls FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin');

-- fund_investments -----------------------------------------------------------
DROP POLICY IF EXISTS fund_investments_insert_admin ON public.fund_investments;
CREATE POLICY fund_investments_insert_admin
ON public.fund_investments FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS fund_investments_update_admin ON public.fund_investments;
CREATE POLICY fund_investments_update_admin
ON public.fund_investments FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS fund_investments_delete_admin ON public.fund_investments;
CREATE POLICY fund_investments_delete_admin
ON public.fund_investments FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin');

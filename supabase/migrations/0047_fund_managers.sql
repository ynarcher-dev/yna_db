-- =============================================================================
-- 0047_fund_managers.sql — 펀드 담당자(다대다) 조인 테이블 신설
-- 출처: 발주자 확정(2026-06-17) — 펀드도 담당자(n명)를 배정한다. 명칭은 전 도메인 "담당자"로 통일.
--   작성자(created_by)는 0048 트리거로 담당자에 자동 편입되며 해제 불가.
-- 선행: 0001(funds·managers), 0002(역할 헬퍼 current_user_role), 0039(funds created_by).
-- 권한: 조회=전 직원. 배정 추가/해제(INSERT/DELETE)=Admin 전용 — 펀드는 Admin 도메인(8_funds.md).
--   프로젝트(0034)·스타트업(0038) 패턴 복제하되 쓰기 주체만 admin 으로 좁힌다.
-- 재실행 안전(idempotent): CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fund_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fund_id UUID REFERENCES public.funds(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (fund_id, manager_id)
);

CREATE INDEX IF NOT EXISTS fund_managers_fund_id_idx
  ON public.fund_managers (fund_id);
CREATE INDEX IF NOT EXISTS fund_managers_manager_id_idx
  ON public.fund_managers (manager_id);

ALTER TABLE public.fund_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fund_managers_select_authenticated ON public.fund_managers;
CREATE POLICY fund_managers_select_authenticated
ON public.fund_managers FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS fund_managers_insert_admin ON public.fund_managers;
CREATE POLICY fund_managers_insert_admin
ON public.fund_managers FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS fund_managers_delete_admin ON public.fund_managers;
CREATE POLICY fund_managers_delete_admin
ON public.fund_managers FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin');

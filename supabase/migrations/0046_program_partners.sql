-- =============================================================================
-- 0046_program_partners.sql — 프로그램-협력사(기관) 연계 조인 테이블 + RLS
-- 출처: docs/7_businesses.md·12_partners.md (프로그램에 협력 기관 연동, 다대다).
-- 선행: 0001_schema.sql(programs·partners), 0002_rls.sql(역할 헬퍼 current_user_role).
-- 패턴: project_partners(0001 #18 + 0036 쓰기 RLS)·program_startups 를 그대로 복제.
-- 권한: 조회=전 직원, 매핑 추가/해제(INSERT/DELETE)=전 직원(관리자·심사역).
--   조인 테이블은 소프트삭제가 아니라 실제 DELETE 로 매핑을 해제한다(상태값 없음).
-- 재실행 안전(idempotent): CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.program_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (program_id, partner_id)
);

ALTER TABLE public.program_partners ENABLE ROW LEVEL SECURITY;

-- 조회: 전 직원 (program_startups/project_partners SELECT 정책과 동일)
DROP POLICY IF EXISTS program_partners_select_authenticated ON public.program_partners;
CREATE POLICY program_partners_select_authenticated
ON public.program_partners FOR SELECT TO authenticated USING (true);

-- 매핑 추가/해제: 전 직원(관리자·심사역)
DROP POLICY IF EXISTS program_partners_insert_staff ON public.program_partners;
CREATE POLICY program_partners_insert_staff
ON public.program_partners FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS program_partners_delete_staff ON public.program_partners;
CREATE POLICY program_partners_delete_staff
ON public.program_partners FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

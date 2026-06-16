-- =============================================================================
-- 0002_rls.sql — Row Level Security 활성화 + 역할 헬퍼 + CRUD 정책(대표 패턴)
-- 출처: docs/0_db_schema.md 3장
-- =============================================================================
-- 주의: 아래 CRUD 정책은 0_db_schema.md 3.3 의 "대표 패턴"이다.
--       실제 운영 마이그레이션에는 docs/2_policies.md 2.2 권한 매트릭스에 따라
--       모든 테이블의 정책을 빠짐없이 작성해야 한다. (2번 문서 개발 시 확장)
--       정책이 없는 RLS 테이블은 기본적으로 접근이 거부되며,
--       service_role 을 프론트엔드에 노출해 이를 우회해서는 안 된다.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 전체 테이블 RLS 활성화
-- -----------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_mentorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_timelines ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3.2 역할 확인 헬퍼 (재귀 RLS 회피용 SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.managers
    WHERE id = auth.uid()
      AND deleted_at IS NULL
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3.3 CRUD별 정책 예시
-- -----------------------------------------------------------------------------

-- (a) Manager가 작성·수정 가능한 테이블: SELECT/INSERT/UPDATE 분리, DELETE 미제공
CREATE POLICY startups_select_authenticated
ON public.startups FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY startups_insert_staff
ON public.startups FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        public.current_user_role() = 'manager'
        AND deleted_at IS NULL
    )
);

CREATE POLICY startups_update_staff
ON public.startups FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        public.current_user_role() = 'manager'
        AND deleted_at IS NULL
    )
);
-- 클라이언트 DELETE 정책은 만들지 않는다. Admin의 일반 삭제도 UPDATE로 deleted_at을 기록한다.

-- (b) Manager는 조회만, 변경은 Admin만 가능한 테이블 (펀드·부서 등)
CREATE POLICY funds_select_authenticated
ON public.funds FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY funds_insert_admin
ON public.funds FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY funds_update_admin
ON public.funds FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');
-- 펀드 역시 클라이언트 DELETE 정책을 만들지 않는다.

-- (c) 심사역: 전체 조회 허용, 직접 UPDATE는 Admin만.
--     Manager 본인 프로필 수정은 허용 컬럼만 갱신하는 SECURITY DEFINER RPC로 제공한다
--     (RPC 내부에서 auth.uid() = 대상 ID 검증). RPC 정의는 5_managers.md 개발 시 추가.
CREATE POLICY managers_select_authenticated
ON public.managers FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY managers_update_admin
ON public.managers FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- project_timelines 는 사용자의 직접 INSERT를 허용하지 않으며,
-- 권한이 회수된 감사 Trigger 함수(log_project_stage_change)만 기록한다.

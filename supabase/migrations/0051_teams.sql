-- =============================================================================
-- 0051_teams.sql — 소속 계층 개편 2/3: 팀(teams) 테이블 신설 — 소속 관리의 '단위'
-- 출처: 발주자 확정(2026-06-17) — "회사 > 그룹 > 팀" 완전 계층. **관리 단위 = 팀**.
--   · 팀 한 건이 곧 하나의 '부서'로 동작한다(소속 관리 목록의 한 행 = 팀).
--   · 팀은 그룹(departments)에 속하고, 그룹은 회사(departments.company)에 속한다.
--   · operating_start / operating_end 로 팀 운영 기간을 기록(종료 비면 운영중).
--   · 심사역(소속 멤버)은 team_id 로 팀에 배정된다(0052).
--   · 작성/수정/삭제(소프트)는 Admin 전용(PATTERNS.md 8장, 기존 소속=Admin 전용 계승).
-- 선행: 0001(managers), 0006(공통 set_updated_at() 트리거 함수), 0009(부서 RLS 패턴),
--       0050(departments.company + (회사,그룹명) UNIQUE).
-- 재실행 안전(idempotent): CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY/TRIGGER IF EXISTS.
-- =============================================================================

-- 1) 팀 테이블 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- 소속 그룹 (departments). 그룹 삭제 시 팀도 함께 정리되도록 CASCADE.
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    -- 팀명은 선택값. 비면(NULL) 회사+그룹 단위의 소속으로, 화면에서 팀명을 노출하지 않는다.
    name VARCHAR(100),
    -- 운영 기간 (선택). 종료일이 없으면 '운영중'.
    operating_start DATE,
    operating_end DATE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 운영 종료일은 시작일 이후여야 함(둘 중 하나가 비면 통과)
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_operating_period_check;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_operating_period_check
  CHECK (operating_end IS NULL OR operating_start IS NULL OR operating_end >= operating_start);

-- 그룹별 팀 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON public.teams (department_id);

-- 같은 그룹 내 팀명 중복 방지(미삭제 + 팀명 있는 행 한정). 팀명이 NULL(팀 미지정)인 행은
-- 제약 없이 여러 개 허용한다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_department_name
  ON public.teams (department_id, name) WHERE deleted_at IS NULL AND name IS NOT NULL;

-- 2) updated_at 자동 갱신 트리거 (공통 함수 재사용) ---------------------------
DROP TRIGGER IF EXISTS teams_set_updated_at ON public.teams;
CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS: 조회=전 직원(미삭제), 작성/수정=Admin 전용 (부서와 동일) ------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teams_select_authenticated ON public.teams;
CREATE POLICY teams_select_authenticated
ON public.teams FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS teams_insert_admin ON public.teams;
CREATE POLICY teams_insert_admin
ON public.teams FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() = 'admin'
    AND deleted_at IS NULL
);

DROP POLICY IF EXISTS teams_update_admin ON public.teams;
CREATE POLICY teams_update_admin
ON public.teams FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'admin'
)
WITH CHECK (
    public.current_user_role() = 'admin'
);
-- 클라이언트 DELETE 정책 없음(영구 삭제 차단). 삭제는 deleted_at 기록 UPDATE(Admin).

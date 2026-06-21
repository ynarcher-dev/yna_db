-- =============================================================================
-- 0062_manager_participation.sql — 담당자 참여율(투입 비중) 구조화
-- 출처: 발주자 확정(2026-06-21), 설계 [20_roadmap.md] Phase 6.
--   사업·프로젝트(M&A·신사업)의 담당자별 '참여율(%)' + '투입 기간'을 기록한다.
--   추후 (이익 × 참여율)로 월 단위 인당 생산량을 산출하기 위한 기반.
-- 핵심 규칙: 한 번 부여(locked=true)하면 '관리자(admin)'를 제외하고는 수정·해제 불가.
--   작성자가 임의로 투입 비중을 조정해 생산량을 조작하는 것을 RLS 로 차단한다.
-- 대상: business_managers, project_managers (스타트업·펀드 담당자는 제외).
-- 선행: 0034(project_managers), 0044(program_managers write), 0055(리네임).
-- 재실행 안전(idempotent): ADD COLUMN IF NOT EXISTS + EXCEPTION 가드 + DROP POLICY IF EXISTS.
-- =============================================================================

-- 1) 컬럼 추가 (참여율 0~100, 투입 기간, 잠금) -------------------------------------
ALTER TABLE public.business_managers ADD COLUMN IF NOT EXISTS participation_rate SMALLINT;
ALTER TABLE public.business_managers ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE public.business_managers ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE public.business_managers ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.project_managers ADD COLUMN IF NOT EXISTS participation_rate SMALLINT;
ALTER TABLE public.project_managers ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE public.project_managers ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE public.project_managers ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

-- 2) 값 제약 (참여율 0~100, 기간 시작<=종료) ---------------------------------------
DO $$ BEGIN ALTER TABLE public.business_managers ADD CONSTRAINT business_managers_participation_rate_check CHECK (participation_rate IS NULL OR (participation_rate BETWEEN 0 AND 100)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.business_managers ADD CONSTRAINT business_managers_period_check CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.project_managers  ADD CONSTRAINT project_managers_participation_rate_check  CHECK (participation_rate IS NULL OR (participation_rate BETWEEN 0 AND 100)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.project_managers  ADD CONSTRAINT project_managers_period_check  CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) 잠금 인지 RLS — 잠긴 행(locked=true)은 관리자만 수정/해제 가능 -------------------
--    USING 은 '기존 행'을 평가한다: 심사역(manager)은 아직 잠기지 않은 행만 갱신/삭제할 수 있어
--    (a) 최초 부여(unlocked→locked)는 허용되고 (b) 부여 후에는 불가, 관리자는 항상 가능.

-- 3-1) business_managers UPDATE (기존 역할 변경 정책을 잠금 인지로 재정의)
DROP POLICY IF EXISTS business_managers_update_staff ON public.business_managers;
CREATE POLICY business_managers_update_staff
ON public.business_managers FOR UPDATE TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'manager' AND NOT locked)
)
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

-- 3-2) business_managers DELETE (잠긴 배정은 관리자만 해제)
DROP POLICY IF EXISTS business_managers_delete_staff ON public.business_managers;
CREATE POLICY business_managers_delete_staff
ON public.business_managers FOR DELETE TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'manager' AND NOT locked)
);

-- 3-3) project_managers UPDATE (신설 — 0034 엔 수정 정책이 없었다)
DROP POLICY IF EXISTS project_managers_update_staff ON public.project_managers;
CREATE POLICY project_managers_update_staff
ON public.project_managers FOR UPDATE TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'manager' AND NOT locked)
)
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

-- 3-4) project_managers DELETE (잠금 인지로 재정의)
DROP POLICY IF EXISTS project_managers_delete_staff ON public.project_managers;
CREATE POLICY project_managers_delete_staff
ON public.project_managers FOR DELETE TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'manager' AND NOT locked)
);

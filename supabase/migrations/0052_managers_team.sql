-- =============================================================================
-- 0052_managers_team.sql — 소속 계층 개편 3/3: 심사역 소속을 '팀'으로 연결
-- 출처: 발주자 확정(2026-06-17) — 심사역(담당자)의 소속은 '팀 단위'.
--   기존 managers.department_id(그룹) 는 그대로 유지하되, 새 team_id(팀) 를 추가하고
--   team_id 가 바뀌면 그 팀의 그룹으로 department_id 를 자동 동기화한다.
--   → 그룹 기준 집계(view_department_stats)·목록 소속 필터가 무변경으로 동작.
-- 발주자 재확정(2026-06-17): **'기본팀' 자동 생성/편입은 하지 않는다.** 팀이 없는 심사역은
--   team_id 를 비워 두고(=소속 팀 없음), 화면에서도 팀명을 노출하지 않는다. 팀 배정은
--   추후 관리자가 팀을 만들고 '소속 멤버' 패널에서 직접 한다.
-- 선행: 0001(managers.department_id), 0050(departments.company), 0051(teams).
-- 재실행 안전(idempotent): IF NOT EXISTS / CREATE OR REPLACE.
-- =============================================================================

-- 1) managers.team_id 추가 (소속 팀, 선택) -----------------------------------
ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_managers_team_id ON public.managers (team_id);

-- 2) team_id → department_id 동기화 트리거 ------------------------------------
--    팀을 지정/변경하면 그 팀의 그룹(department_id)을 자동으로 맞춘다(팀 비우면 그룹도 비움).
--    team_id 를 건드리지 않는 수정(이름·약력 등)·계정 발급(department_id 직접 지정)은
--    그대로 두어 기존 흐름과 충돌하지 않게 한다.
CREATE OR REPLACE FUNCTION public.sync_manager_department()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.team_id IS NOT NULL THEN
      NEW.department_id := (SELECT department_id FROM public.teams WHERE id = NEW.team_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
      -- 팀이 NULL 이면 서브쿼리도 NULL → 그룹도 함께 비워진다.
      NEW.department_id := (SELECT department_id FROM public.teams WHERE id = NEW.team_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS managers_sync_department ON public.managers;
CREATE TRIGGER managers_sync_department
BEFORE INSERT OR UPDATE ON public.managers
FOR EACH ROW EXECUTE FUNCTION public.sync_manager_department();

-- 비고: 기존 심사역의 team_id 는 비워 둔다(소속 팀 없음). '기본팀' 같은 가짜 팀을 만들지
--   않으며, 팀이 없는 동안 화면에서는 팀명이 노출되지 않는다(심사역 소속 컬럼·상세 모두
--   teamName 이 비면 생략). 기존 department_id(그룹) 는 그대로 두어 그룹 표기/필터는 유지된다.
--   추후 관리자가 팀 등록 후 '소속 멤버' 패널에서 심사역을 팀에 배정하면 그때 team_id 가 채워지고
--   트리거가 department_id 를 그 팀의 그룹으로 동기화한다.

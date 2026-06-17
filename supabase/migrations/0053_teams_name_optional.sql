-- =============================================================================
-- 0053_teams_name_optional.sql — 팀명(teams.name)을 선택값으로 (이미 적용된 DB 보정)
-- 출처: 발주자 요청(2026-06-17) — 팀이 없는 경우 팀명을 비울 수 있어야 한다.
--   0051 은 CREATE TABLE IF NOT EXISTS 라, 이미 teams 가 생성된 DB 에는 0051 의
--   nullable 수정이 반영되지 않는다(팀 수정 시 name=null → not-null 위반 400). 여기서 ALTER.
-- 선행: 0051(teams).
-- 재실행 안전(idempotent): DROP NOT NULL(이미 nullable 이면 무해), DROP/CREATE INDEX IF (NOT) EXISTS.
-- =============================================================================

-- 1) 팀명을 nullable 로 (비면 회사+그룹 단위 소속, 화면에서 팀명 미노출) ---------
ALTER TABLE public.teams ALTER COLUMN name DROP NOT NULL;

-- 2) 유일성 인덱스 재정의: 미삭제 + 팀명이 있는 행만 (NULL 팀명은 다수 허용) -----
DROP INDEX IF EXISTS public.uq_teams_department_name;
CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_department_name
  ON public.teams (department_id, name) WHERE deleted_at IS NULL AND name IS NOT NULL;

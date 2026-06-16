-- =============================================================================
-- 0016_startups_management_status.sql — 스타트업 '관리 현황' 컬럼 추가
-- 출처: 발주자 요청 (발굴기업/보육기업/투자기업/기타[자유 텍스트]).
-- 선행: 0001_schema.sql(startups 테이블).
-- 설계:
--   management_status     : 고정 분류 (sourced/incubated/invested/other), NOT NULL 기본 'sourced'.
--   management_status_etc : '기타(other)' 선택 시 자유 텍스트. 그 외 상태에선 NULL.
--   기존 행은 기본값(발굴기업)으로 backfill 된다. CHECK 로 허용값을 제한한다.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 관리 현황 분류 컬럼 (+ 허용값 CHECK)
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS management_status VARCHAR(20) NOT NULL DEFAULT 'sourced';

ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_management_status_check;
ALTER TABLE public.startups
  ADD CONSTRAINT startups_management_status_check
  CHECK (management_status IN ('sourced', 'incubated', 'invested', 'other'));

-- 2) 기타 자유 텍스트 컬럼 ('other' 일 때만 사용)
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS management_status_etc VARCHAR(50);

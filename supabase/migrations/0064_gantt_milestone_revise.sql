-- =============================================================================
-- 0064_gantt_milestone_revise.sql — 간트 마일스톤 개선(발주자 피드백 2026-06-21)
-- 0063 적용 이후 운영 피드백 반영:
--   1) 진행률(progress 0~100) → 진행 '상태'(status: 대기/진행중/완료/지연)로 단순화.
--   2) 간트 행 순서 수동 변경(드래그) 지원을 위한 sort_order 추가.
--   3) 일정 '유형(event_type)' 입력 폐지 — 컬럼은 system_events 동기화 위해 유지하되 기본값 부여.
-- 대상: business_events, project_events. 재실행 안전(idempotent).
-- =============================================================================

-- 1) business_events ----------------------------------------------------------
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
DO $$ BEGIN ALTER TABLE public.business_events ADD CONSTRAINT business_events_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- 유형 입력 폐지: 신규 행이 비울 수 있도록 기본값 부여(동기화 CHECK 만족).
ALTER TABLE public.business_events ALTER COLUMN event_type SET DEFAULT 'event';
-- 진행률 컬럼 및 제약 제거(상태로 대체).
ALTER TABLE public.business_events DROP CONSTRAINT IF EXISTS business_events_progress_check;
ALTER TABLE public.business_events DROP COLUMN IF EXISTS progress;
-- 기존 행 정렬 초기화(시작일·등록순).
WITH ordered AS (
    SELECT id, row_number() OVER (PARTITION BY business_id ORDER BY start_date, created_at) AS rn
    FROM public.business_events
)
UPDATE public.business_events b SET sort_order = o.rn FROM ordered o WHERE b.id = o.id;

-- 2) project_events -----------------------------------------------------------
ALTER TABLE public.project_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE public.project_events ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
DO $$ BEGIN ALTER TABLE public.project_events ADD CONSTRAINT project_events_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.project_events ALTER COLUMN event_type SET DEFAULT 'meeting';
-- 진행률 컬럼 제거(table-level 익명 CHECK 는 컬럼과 함께 자동 삭제됨).
ALTER TABLE public.project_events DROP COLUMN IF EXISTS progress;
WITH ordered AS (
    SELECT id, row_number() OVER (PARTITION BY project_id ORDER BY start_date, created_at) AS rn
    FROM public.project_events
)
UPDATE public.project_events p SET sort_order = o.rn FROM ordered o WHERE p.id = o.id;

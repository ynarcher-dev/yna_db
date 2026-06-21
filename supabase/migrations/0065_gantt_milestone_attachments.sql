-- =============================================================================
-- 0065_gantt_milestone_attachments.sql — 간트 마일스톤 보강(발주자 피드백 2026-06-21)
-- 0063/0064 적용 이후 추가 요건 반영:
--   1) 담당자 다중 지정: manager_id(단일) → manager_ids(uuid[]) 로 확장(단일 컬럼은 하위호환 유지).
--   2) 테스크 관련 링크(URL) 복수 보관: urls(text[]).
--   3) 첨부파일이 '어느 테스크(일정)에 종속되는지' 식별: uploaded_files.event_id.
-- 대상: business_events, project_events, uploaded_files. 재실행 안전(idempotent).
-- =============================================================================

-- 1) business_events ----------------------------------------------------------
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS manager_ids UUID[];
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS urls TEXT[];
-- 기존 단일 담당자 → 배열로 이관(미이관 행만).
UPDATE public.business_events
   SET manager_ids = ARRAY[manager_id]
 WHERE manager_id IS NOT NULL AND manager_ids IS NULL;

-- 2) project_events -----------------------------------------------------------
ALTER TABLE public.project_events ADD COLUMN IF NOT EXISTS manager_ids UUID[];
ALTER TABLE public.project_events ADD COLUMN IF NOT EXISTS urls TEXT[];
UPDATE public.project_events
   SET manager_ids = ARRAY[manager_id]
 WHERE manager_id IS NOT NULL AND manager_ids IS NULL;

-- 3) uploaded_files: 첨부 ↔ 테스크(일정) 연결 ---------------------------------
--    드로어에서 올린 파일은 entity_type='business'/'project' 의 첨부 카드에 그대로 노출되며,
--    event_id 로 '어느 테스크 소속'인지 식별한다(NULL = 일반 첨부).
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS event_id UUID;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_event
  ON public.uploaded_files (event_id)
  WHERE event_id IS NOT NULL;

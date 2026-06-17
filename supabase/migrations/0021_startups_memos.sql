-- =============================================================================
-- 0021_startups_memos.sql — 스타트업 시계열 메모/회의록
-- 출처: 발주자 요청 — 협력사(interaction_log)와 같은 시계열 메모(회의록·메모 용도).
-- 선행: 0001(startups), 0002(startups update RLS).
-- 설계: 협력사 패턴과 동일하게 jsonb 배열 [{date, content}] 로 저장(통째 갱신).
--   memos_updated_at: 메모 섹션 최종 수정 시각(앱에서 기록, nullable).
-- 비고: 기존 startups UPDATE RLS(Admin·Manager) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS memos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS memos_updated_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- 0022_startups_business_status.sql — 성장 지표 내 '비즈니스 현황'(시계열 텍스트)
-- 출처: 발주자 요청 — 성장 지표 영역(재무·매출 위)에 메모/회의록처럼 시계열 텍스트 기록.
-- 선행: 0001(startups), 0002(startups update RLS).
-- 설계: 메모(memos)와 동일하게 jsonb 배열 [{date, content}] 로 저장(통째 갱신).
-- 비고: 기존 startups UPDATE RLS(Admin·Manager) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS business_status JSONB NOT NULL DEFAULT '[]'::jsonb;

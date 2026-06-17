-- =============================================================================
-- 0023_startups_diagnosis.sql — 기업진단(임시 수동 입력 + 최종 수정일)
-- 출처: 발주자 요청 — 기업진단 카드에 '최종 수정'·'수정' 추가.
-- 선행: 0001(startups), 0002(startups update RLS).
-- 설계: 추후 외부 서비스 연동 전까지 직원이 수동으로 진단 내용을 기록할 수 있게 text 컬럼.
--   diagnosis_updated_at: 최종 수정 시각(앱에서 기록, nullable). 내용 없으면 화면은 '준비중'.
-- 비고: 기존 startups UPDATE RLS(Admin·Manager) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS diagnosis_updated_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- 0024_startup_metrics_investor.sql — 성장 지표 '투자 현황'에 투자자 정보
-- 출처: 발주자 요청 — 기업가치(Pre)/투자자(자사·외부 구분)/라운드(드롭다운).
-- 선행: 0001(startup_metrics), 0018(funding_amount·funding_round), 0017(write RLS).
-- 추가:
--   investor      : 투자자명(텍스트).
--   investor_type : 'internal'(자사) / 'external'(외부) 구분. NULL 허용.
-- 비고: '자사' 투자 시 투자 재원(펀드) 연동은 펀드 도메인 개발 후 별도 처리.
--   기업가치(valuation)는 Pre-money 의미로 화면에서 '기업 가치(Pre)'로 표기(컬럼 변경 없음).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

ALTER TABLE public.startup_metrics ADD COLUMN IF NOT EXISTS investor VARCHAR(100);
ALTER TABLE public.startup_metrics ADD COLUMN IF NOT EXISTS investor_type VARCHAR(20);

ALTER TABLE public.startup_metrics DROP CONSTRAINT IF EXISTS startup_metrics_investor_type_check;
ALTER TABLE public.startup_metrics
  ADD CONSTRAINT startup_metrics_investor_type_check
  CHECK (investor_type IS NULL OR investor_type IN ('internal', 'external'));

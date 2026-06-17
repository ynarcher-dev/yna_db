-- =============================================================================
-- 0042_startup_metrics_fund.sql — 성장 지표 '투자 현황'의 자사(internal) 투자 ↔ 펀드 연동
-- 출처: 발주자 요청 — 0024 에서 보류했던 "자사 투자 시 투자 재원(펀드) 연동"을 펀드 도메인 완성 후 연결.
-- 선행: 0001(startup_metrics·funds), 0024(investor·investor_type), 0039(funds write).
-- 추가: fund_id — 자사(internal) 투자 시 재원 펀드 참조(FK → funds). 외부/미지정이면 NULL.
--   펀드가 삭제(소프트)되어도 지표는 남아야 하므로 ON DELETE SET NULL.
-- 비고: 펀드 SELECT 는 전 직원 허용(0002/0004)이라 지표 화면에서 펀드명 임베드 가능.
--   기존 startup_metrics write RLS(0017, 직원)로 fund_id 갱신도 함께 허용된다.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS startup_metrics_fund_id_idx
  ON public.startup_metrics (fund_id) WHERE fund_id IS NOT NULL;

-- =============================================================================
-- 0018_startup_metrics_extend.sql — 성장 지표 컬럼 확장 (재무현황 + 투자현황)
-- 출처: 발주자 요청 — 성장 지표를 재무현황/고용/투자현황으로 분리.
-- 선행: 0001_schema.sql(startup_metrics), 0017_startup_subrecords_write.sql(write RLS).
-- 추가 컬럼:
--   [재무현황] operating_profit(영업이익) · net_income(당기순이익) · assets(자산)
--             · liabilities(부채) · equity(자본). 이익·자본은 음수 가능 → CHECK 없음.
--             매출액(revenue)은 기존 컬럼 재사용(CHECK revenue>=0 유지).
--   [투자현황] funding_amount(투자유치액, >=0) · funding_round(투자 라운드 텍스트).
--             기업가치(valuation)는 기존 컬럼 재사용.
--   [고용] employee_count 기존 컬럼 재사용.
-- 한 행 = 한 회계연도 스냅샷(record_date). 화면은 record_date 기준 최신순으로 표시.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- [재무현황] 손익 (음수 허용)
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS operating_profit NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS net_income NUMERIC(15, 2) NOT NULL DEFAULT 0;

-- [재무현황] 재무상태 (자산/부채는 0 이상, 자본은 자본잠식 대비 음수 허용)
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS assets NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS equity NUMERIC(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.startup_metrics DROP CONSTRAINT IF EXISTS startup_metrics_assets_check;
ALTER TABLE public.startup_metrics ADD CONSTRAINT startup_metrics_assets_check CHECK (assets >= 0);
ALTER TABLE public.startup_metrics DROP CONSTRAINT IF EXISTS startup_metrics_liabilities_check;
ALTER TABLE public.startup_metrics
  ADD CONSTRAINT startup_metrics_liabilities_check CHECK (liabilities >= 0);

-- [투자현황] 투자유치액 + 라운드
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS funding_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.startup_metrics DROP CONSTRAINT IF EXISTS startup_metrics_funding_amount_check;
ALTER TABLE public.startup_metrics
  ADD CONSTRAINT startup_metrics_funding_amount_check CHECK (funding_amount >= 0);

ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS funding_round VARCHAR(30);

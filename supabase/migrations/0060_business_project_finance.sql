-- =============================================================================
-- 0060_business_project_finance.sql — 사업·프로젝트에 매출/이익 추가
-- 출처: 발주자 확정(2026-06-21) — 사업관리·M&A관리·신사업관리 목록에 매출/이익을 구조화.
--   각 사업/프로젝트가 벌어들이는 매출(revenue)과 실제 회사로 들어오는 이익(profit)을
--   레코드당 단일 금액으로 저장한다(기간별 누적 아님). 손실 표현을 위해 이익은 음수 허용.
-- 선행: 0001(programs/projects 스키마), 0055(programs→businesses 리네임), 0059(status).
-- 재실행 안전(idempotent): ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- 매출(revenue): 0 이상. 이익(profit): 손실(음수) 허용이라 CHECK 없음. 기본값 0. ----------
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS revenue NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profit  NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.projects   ADD COLUMN IF NOT EXISTS revenue NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.projects   ADD COLUMN IF NOT EXISTS profit  NUMERIC(15, 2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.businesses ADD CONSTRAINT businesses_revenue_check CHECK (revenue >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.projects   ADD CONSTRAINT projects_revenue_check   CHECK (revenue >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

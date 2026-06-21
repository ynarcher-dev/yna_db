-- =============================================================================
-- 0061_business_classification.sql — 사업 '구분' 추가 + 운영예산·모집마감일 제거
-- 출처: 발주자 확정(2026-06-21).
--   · classification(구분): 공공(public)/민간(private)/매출(sales) 뱃지. NOT NULL.
--   · budget(운영예산)·recruitment_deadline(모집마감일): 미사용 확정 → 컬럼 완전 제거.
-- 선행: 0001(programs 스키마), 0055(리네임), 0059(status), 0060(revenue/profit).
-- 비고: DROP COLUMN 은 해당 컬럼의 CHECK/DEFAULT 도 함께 제거한다(budget>=0,
--   recruitment_deadline<=start_date). forward-only 원칙상 이전 마이그레이션은 보존.
-- 재실행 안전(idempotent): ADD/DROP ... IF [NOT] EXISTS + EXCEPTION 가드.
-- =============================================================================

-- 1) 구분(classification) 추가 (기본값 공공) ---------------------------------------
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS classification VARCHAR(20) NOT NULL DEFAULT 'public';

DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_classification_check
    CHECK (classification IN ('public', 'private', 'sales'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) 운영예산·모집마감일 컬럼 제거 ------------------------------------------------
ALTER TABLE public.businesses DROP COLUMN IF EXISTS budget;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS recruitment_deadline;

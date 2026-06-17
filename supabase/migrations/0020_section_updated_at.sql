-- =============================================================================
-- 0020_section_updated_at.sql — 상세 섹션별 '최종 수정일' 추적
-- 출처: 발주자 요청 — 각 카드(비즈니스·성장지표·주주구성·후속보고)에 최종 수정일 노출.
-- 선행: 0001(테이블), 0006(set_updated_at() 함수), 0017(metrics/followups write), 0019(business/team).
-- 설계:
--   startup_metrics / startup_followups : updated_at 컬럼 + BEFORE UPDATE 트리거 → 섹션 최종 수정일 = MAX(updated_at).
--   startups.business_profile_updated_at : 비즈니스·팀 역량 저장 시각(앱에서 기록).
--   startups.shareholders_updated_at     : 주주 구성 저장 시각(앱에서 기록).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) startup_metrics.updated_at + 트리거 (+ 기존행 backfill)
ALTER TABLE public.startup_metrics
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.startup_metrics SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS startup_metrics_set_updated_at ON public.startup_metrics;
CREATE TRIGGER startup_metrics_set_updated_at
BEFORE UPDATE ON public.startup_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) startup_followups.updated_at + 트리거 (+ 기존행 backfill)
ALTER TABLE public.startup_followups
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.startup_followups SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS startup_followups_set_updated_at ON public.startup_followups;
CREATE TRIGGER startup_followups_set_updated_at
BEFORE UPDATE ON public.startup_followups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) startups: 비즈니스·팀 / 주주 구성 섹션 최종 수정 시각 (앱에서 기록, nullable)
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS business_profile_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS shareholders_updated_at TIMESTAMP WITH TIME ZONE;

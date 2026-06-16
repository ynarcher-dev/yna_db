-- =============================================================================
-- 0006_partners_adjustments.sql — 협력사 보정 (재실행 안전 / idempotent)
--   1) 기업/기관명 중복 허용 (동일 기관 복수 등록 가능)
--   2) 최종반영일(updated_at) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
--   3) 작성자(created_by) 컬럼 + 등록 시 auth.uid() 자동 기록 (2_policies.md 2.4 감사)
-- 선행: 0001_schema.sql / set_updated_at() 는 이후 모든 도메인에서 재사용한다.
-- =============================================================================

-- 1) name UNIQUE 제약 제거 (협력사는 동명 기관/지사 등 복수 등록 허용)
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_name_key;

-- 2) updated_at(최종반영일) 컬럼
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
-- 수정 이력이 없는 기존 행은 최종반영일을 등록일과 동일하게 맞춘다.
UPDATE public.partners SET updated_at = created_at WHERE updated_at <> created_at;

-- 공통 트리거 함수: UPDATE 시 updated_at 갱신
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partners_set_updated_at ON public.partners;
CREATE TRIGGER partners_set_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) created_by(작성자) 컬럼 — 등록 시 auth.uid() 자동 기록 (FK → managers)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

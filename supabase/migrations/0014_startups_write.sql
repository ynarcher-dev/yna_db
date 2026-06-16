-- =============================================================================
-- 0014_startups_write.sql — 스타트업 메타 컬럼(updated_at·created_by) + UPDATE 트리거
-- 출처: docs/6_startups.md 6.4 (작성/수정 Admin·Manager / 삭제 Admin)
-- 선행: 0001_schema.sql(startups 테이블), 0002_rls.sql(startups SELECT/INSERT/UPDATE 정책),
--       0006_partners_adjustments.sql(공통 set_updated_at() 트리거 함수 정의).
-- 비고: startups 의 작성/수정/조회 RLS 는 이미 0002 에 존재하므로 여기서는 만들지 않는다.
--       협력사(0005/0006)·전문가(0008)와 동일한 메타 컬럼·트리거 패턴을 그대로 복제한다(PATTERNS.md).
--       클라이언트 DELETE 정책 없음(영구삭제 차단). 소프트 삭제는 deleted_at UPDATE 이며
--       Manager 는 WITH CHECK 로 차단되어 Admin 만 비활성화 가능(0002 정책 그대로).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS 사용.
-- =============================================================================

-- 1) updated_at(최종반영일) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
-- 수정 이력이 없는 기존 행은 최종반영일을 등록일과 동일하게 맞춘다.
UPDATE public.startups SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS startups_set_updated_at ON public.startups;
CREATE TRIGGER startups_set_updated_at
BEFORE UPDATE ON public.startups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(작성자) 컬럼 — 등록 시 auth.uid() 자동 기록 (FK → managers)
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

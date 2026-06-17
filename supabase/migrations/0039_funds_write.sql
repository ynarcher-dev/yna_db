-- =============================================================================
-- 0039_funds_write.sql — 펀드 메타 컬럼(updated_at·created_by) + UPDATE 트리거
-- 출처: docs/8_funds.md 8.4 (작성·수정·삭제 Admin 전용 / 읽기 Admin·Manager).
-- 선행: 0001_schema.sql(funds), 0002_rls.sql(funds SELECT/INSERT/UPDATE = Admin 전용 정책),
--       0006_partners_adjustments.sql(공통 set_updated_at()).
-- 비고: funds 의 조회/작성/수정 RLS 는 이미 0002 에 존재(Admin 전용)하므로 여기서는 만들지 않는다.
--       펀드는 부서·심사역과 같은 Admin 전용 도메인 → 삭제(소프트)도 Admin 만(0002 update_admin).
--       클라이언트 DELETE 정책 없음(영구삭제 차단). 메타 컬럼·트리거 패턴은 스타트업(0014) 복제.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) updated_at(최종반영일) + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.funds
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.funds SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS funds_set_updated_at ON public.funds;
CREATE TRIGGER funds_set_updated_at
BEFORE UPDATE ON public.funds
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(책임자=등록 Admin) — 등록 시 auth.uid() 자동 기록 (FK → managers)
ALTER TABLE public.funds
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- =============================================================================
-- 0043_programs_write.sql — 프로그램 메타 컬럼(updated_at·created_by) + INSERT/UPDATE RLS
-- 출처: docs/7_programs.md 7.4 (작성·수정 Admin·Manager / 삭제) + 발주자 확정 "책임자/담당자/관리자".
--   삭제(소프트) = 책임자(created_by) + 관리자 — 프로젝트(0033)와 동일 모델로 통일.
-- 선행: 0001(programs), 0002(programs RLS 활성화·역할 헬퍼), 0004(programs SELECT 정책),
--       0006(set_updated_at()).
-- 비고: SELECT 정책은 0004 에 존재. 메타 컬럼·트리거는 스타트업(0014)·프로젝트(0033) 패턴 복제.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) updated_at + 트리거 + backfill
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.programs SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS programs_set_updated_at ON public.programs;
CREATE TRIGGER programs_set_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(책임자) — 등록 시 auth.uid() 자동 기록 (FK → managers)
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- 3) INSERT 정책 — 전 직원(관리자·심사역)
DROP POLICY IF EXISTS programs_insert_staff ON public.programs;
CREATE POLICY programs_insert_staff
ON public.programs FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

-- 4) UPDATE 정책 — 수정은 전 직원 공통, 소프트삭제는 책임자 + 관리자만(프로젝트 0033 패턴).
DROP POLICY IF EXISTS programs_update_staff ON public.programs;
CREATE POLICY programs_update_staff
ON public.programs FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        public.current_user_role() = 'manager'
        AND (deleted_at IS NULL OR created_by = auth.uid())
    )
);

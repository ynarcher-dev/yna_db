-- =============================================================================
-- 0008_experts_write.sql — 전문가 보정 + 작성(INSERT/UPDATE) RLS 정책
-- 출처: docs/9_experts.md 9.4 (전문가: Admin/Manager 작성·수정 / 삭제는 Admin)
-- 선행: 0001_schema.sql, 0002_rls.sql(RLS 활성화), 0004_rls_select.sql(experts SELECT),
--       0006_partners_adjustments.sql(공통 set_updated_at() 트리거 함수 정의).
-- 비고: 협력사(0005/0006)와 동일한 메타 컬럼·정책 패턴을 그대로 복제한다(PATTERNS.md).
--       클라이언트 DELETE 정책은 만들지 않는다(영구 삭제 차단). 소프트 삭제는
--       deleted_at 기록 UPDATE 이며 Manager 는 WITH CHECK 로 차단되어 Admin 만 비활성화.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS 사용.
-- =============================================================================

-- 1) updated_at(최종반영일) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
-- 수정 이력이 없는 기존 행은 최종반영일을 등록일과 동일하게 맞춘다.
UPDATE public.experts SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS experts_set_updated_at ON public.experts;
CREATE TRIGGER experts_set_updated_at
BEFORE UPDATE ON public.experts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(작성자) 컬럼 — 등록 시 auth.uid() 자동 기록 (FK → managers)
ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- 3) 작성 RLS: 등록(Admin/Manager) — 생성 시 활성 상태여야 함
DROP POLICY IF EXISTS experts_insert_staff ON public.experts;
CREATE POLICY experts_insert_staff
ON public.experts FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

-- 4) 작성 RLS: 수정(Admin/Manager) — Manager 는 deleted_at(소프트 삭제) 설정 불가
DROP POLICY IF EXISTS experts_update_staff ON public.experts;
CREATE POLICY experts_update_staff
ON public.experts FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'manager' AND deleted_at IS NULL)
);

-- =============================================================================
-- 0009_departments_write.sql — 소속(부서) 보정 + 작성(INSERT/UPDATE) RLS 정책
-- 출처: docs/11_departments.md 11.4 (부서: 작성·수정·삭제 모두 Admin 전용 / Manager 불가)
-- 선행: 0001_schema.sql, 0002_rls.sql(RLS 활성화), 0004_rls_select.sql(departments SELECT),
--       0006_partners_adjustments.sql(공통 set_updated_at() 트리거 함수 정의).
-- 비고: 협력사/전문가와 동일한 메타 컬럼 패턴을 복제하되 작성 권한만 Admin 전용으로 좁힌다.
--       클라이언트 DELETE 정책은 만들지 않는다(영구 삭제 차단). 소프트 삭제는
--       deleted_at 기록 UPDATE 이며 Admin 만 수행 가능.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS 사용.
-- =============================================================================

-- 1) updated_at(최종반영일) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
-- 수정 이력이 없는 기존 행은 최종반영일을 등록일과 동일하게 맞춘다.
UPDATE public.departments SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS departments_set_updated_at ON public.departments;
CREATE TRIGGER departments_set_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(작성자) 컬럼 — 등록 시 auth.uid() 자동 기록 (FK → managers)
--    주의: departments→managers FK 가 leader_id 와 created_by 두 개가 되므로,
--    프론트 임베드는 제약명(departments_created_by_fkey)으로 명시 지정한다.
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- 3) 작성 RLS: 등록(Admin 전용) — 생성 시 활성 상태여야 함
DROP POLICY IF EXISTS departments_insert_admin ON public.departments;
CREATE POLICY departments_insert_admin
ON public.departments FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() = 'admin'
    AND deleted_at IS NULL
);

-- 4) 작성 RLS: 수정/소프트삭제(Admin 전용)
DROP POLICY IF EXISTS departments_update_admin ON public.departments;
CREATE POLICY departments_update_admin
ON public.departments FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'admin'
)
WITH CHECK (
    public.current_user_role() = 'admin'
);

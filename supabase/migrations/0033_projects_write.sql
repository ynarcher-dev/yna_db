-- =============================================================================
-- 0033_projects_write.sql — 프로젝트 메타 컬럼(updated_at·created_by) + INSERT/UPDATE RLS
-- 출처: docs/10_projects.md 10.4 (읽기·작성·수정 Admin·Manager / 삭제 Admin)
--   + 발주자 확정(2026-06-17): "책임자 / 담당자 / 관리자" 모델.
--   - 책임자 = created_by(게시글 등록 1인). 담당자 = project_managers 다대다(0034 예정).
--   - 수정 = 전 직원 공통(현행). 삭제(소프트) = 책임자 + 관리자.
-- 선행: 0001_schema.sql(projects 테이블·stage 감사 트리거), 0002_rls.sql(projects RLS 활성화),
--       0004_rls_select.sql(projects SELECT 정책), 0006_partners_adjustments.sql(set_updated_at()).
-- 비고: SELECT 정책은 0004 에 이미 존재하므로 만들지 않는다. 스타트업(0014) 메타 패턴 복제.
--       클라이언트 DELETE 정책 없음(영구삭제 차단). 삭제는 deleted_at UPDATE(소프트)이며,
--       Manager 는 본인이 책임자(created_by = auth.uid())인 경우에만 deleted_at 설정 가능.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) updated_at(최종반영일) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.projects SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(책임자) 컬럼 — 등록 시 auth.uid() 자동 기록 (FK → managers)
--    projects↔managers 관계가 2개(manager_id·created_by)이므로 임베드 시 제약명 명시 필수
--    (author:managers!projects_created_by_fkey).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- 3) INSERT 정책 — 전 직원(관리자·심사역)
DROP POLICY IF EXISTS projects_insert_staff ON public.projects;
CREATE POLICY projects_insert_staff
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

-- 4) UPDATE 정책 — 수정은 전 직원 공통, 소프트삭제(deleted_at 설정)는 책임자 + 관리자만.
--    WITH CHECK: 관리자는 무엇이든, 심사역은 결과가 미삭제(일반 수정)이거나
--    본인이 책임자(created_by = auth.uid())일 때만(=책임자만 삭제 가능) 허용.
DROP POLICY IF EXISTS projects_update_staff ON public.projects;
CREATE POLICY projects_update_staff
ON public.projects FOR UPDATE TO authenticated
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

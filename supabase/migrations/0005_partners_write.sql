-- =============================================================================
-- 0005_partners_write.sql — 협력사 작성(INSERT/UPDATE) RLS 정책
-- 출처: docs/2_policies.md 2.2 (협력사: Admin/Manager 작성·수정 / 삭제는 Admin)
-- 선행: 0002_rls.sql(RLS 활성화), 0004_rls_select.sql(partners SELECT 정책)
-- 비고: 클라이언트 DELETE 정책은 만들지 않는다(영구 삭제 차단).
--       소프트 삭제는 deleted_at 을 기록하는 UPDATE 이며, Manager 는 WITH CHECK 로
--       deleted_at 설정이 차단되어 Admin 만 비활성화할 수 있다.
-- =============================================================================

-- 등록: Admin/Manager 모두 가능 (생성 시 활성 상태여야 함)
CREATE POLICY partners_insert_staff
ON public.partners FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

-- 수정: Admin/Manager 가능하되, Manager 는 deleted_at 을 설정(소프트 삭제)할 수 없다.
CREATE POLICY partners_update_staff
ON public.partners FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'manager' AND deleted_at IS NULL)
);

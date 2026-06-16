-- =============================================================================
-- 0012_experts_profile_image.sql — 전문가 프로필 이미지 + 아바타 스토리지 정책 확장
-- 출처: docs/9_experts.md (심사역과 사람-프로필 골격 공유), 상세 페이지 정렬 결정.
-- 선행: 0001_schema.sql, 0002_rls.sql(current_user_role()), 0011_managers_profile_extras.sql(avatars 버킷).
-- 변경:
--   1) experts.profile_image_url 컬럼 추가(심사역과 동일한 사람-프로필 카드 사용).
--   2) avatars 버킷 쓰기 정책을 '본인 폴더 또는 Admin' → '직원(admin/manager) 전체'로 확장.
--      전문가는 로그인 계정이 없어 이미지 업로드를 직원이 대리 수행하므로 Manager 도 허용해야 한다.
--      (이 시스템의 모든 로그인 계정은 managers 의 admin/manager 이며, public read 는 유지.)
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 전문가 프로필 이미지 컬럼
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2) avatars 쓰기 정책 확장 (직원 전체). 읽기(avatars_public_read)는 0011 그대로 유지.
DROP POLICY IF EXISTS avatars_staff_insert ON storage.objects;
CREATE POLICY avatars_staff_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND public.current_user_role() IN ('admin', 'manager')
);

DROP POLICY IF EXISTS avatars_staff_update ON storage.objects;
CREATE POLICY avatars_staff_update ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars'
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    bucket_id = 'avatars'
    AND public.current_user_role() IN ('admin', 'manager')
);

DROP POLICY IF EXISTS avatars_staff_delete ON storage.objects;
CREATE POLICY avatars_staff_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars'
    AND public.current_user_role() IN ('admin', 'manager')
);

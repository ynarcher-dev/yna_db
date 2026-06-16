-- =============================================================================
-- 0015_startup_logo_storage.sql — 스타트업 로고 업로드용 Storage 버킷(logos) + 정책
-- 출처: docs/6_startups.md 6.2 (startups.logo_url = 로고 이미지 S3 경로).
-- 선행: 0002_rls.sql(current_user_role()), 0011_managers_profile_extras.sql(avatars 패턴 참고).
-- 비고: 사람 프로필(avatars)과 분리된 전용 버킷. 경로 규약 {startupId}/{ts}.{ext}.
--       읽기는 공개(public, getPublicUrl 표시). 쓰기는 직원(admin/manager) 전체 —
--       스타트업 등록/수정 권한과 동일(0002 startups_insert/update_staff).
-- 재실행 안전(idempotent): ON CONFLICT / DROP ... IF EXISTS.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 읽기: 공개
DROP POLICY IF EXISTS logos_public_read ON storage.objects;
CREATE POLICY logos_public_read ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'logos');

-- 업로드: 직원(admin/manager)
DROP POLICY IF EXISTS logos_staff_insert ON storage.objects;
CREATE POLICY logos_staff_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'logos'
    AND public.current_user_role() IN ('admin', 'manager')
);

-- 갱신(upsert): 직원(admin/manager)
DROP POLICY IF EXISTS logos_staff_update ON storage.objects;
CREATE POLICY logos_staff_update ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'logos'
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    bucket_id = 'logos'
    AND public.current_user_role() IN ('admin', 'manager')
);

-- 삭제: 직원(admin/manager)
DROP POLICY IF EXISTS logos_staff_delete ON storage.objects;
CREATE POLICY logos_staff_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'logos'
    AND public.current_user_role() IN ('admin', 'manager')
);

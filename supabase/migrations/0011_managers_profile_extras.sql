-- =============================================================================
-- 0011_managers_profile_extras.sql — 심사역 인삿말 컬럼 + 본인수정 RPC 확장 + 아바타 스토리지
-- 출처: docs/5_managers.md 5.3 (프로필 이미지 업로더·약력), 향후 회사 홈페이지용 인삿말.
-- 선행: 0001_schema.sql, 0002_rls.sql(current_user_role()), 0010_managers_write.sql(RPC v1).
-- 변경:
--   1) managers.greeting(인삿말) 컬럼 추가 — 홈페이지 노출용으로 미리 열어둠.
--   2) update_my_profile RPC 에 p_greeting 추가(시그니처 변경 → DROP 후 재생성).
--      약력 jsonb 기본값에 certifications(자격증) 키 포함.
--   3) 프로필 이미지 업로드용 Storage 버킷(avatars) + 정책. 경로 규약: {managerId}/{ts}.{ext}
--      읽기는 공개(public), 쓰기는 본인 폴더 또는 Admin.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS / ON CONFLICT.
-- =============================================================================

-- 1) 인삿말 컬럼
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS greeting TEXT;

-- 2) 본인 프로필 수정 RPC v2 (greeting 추가). 기존 시그니처들을 먼저 제거한다.
DROP FUNCTION IF EXISTS public.update_my_profile(text, text, text[], jsonb, text);
DROP FUNCTION IF EXISTS public.update_my_profile(text, text, text[], jsonb, text, text);

CREATE OR REPLACE FUNCTION public.update_my_profile(
    p_name              text,
    p_phone             text,
    p_specialties       text[],
    p_biography         jsonb,
    p_profile_image_url text,
    p_greeting          text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.managers
    SET name              = COALESCE(NULLIF(btrim(p_name), ''), name),
        phone             = NULLIF(btrim(p_phone), ''),
        specialties       = COALESCE(p_specialties, '{}'::text[]),
        biography         = COALESCE(p_biography, '{"education": [], "career": [], "certifications": []}'::jsonb),
        profile_image_url = NULLIF(btrim(p_profile_image_url), ''),
        greeting          = NULLIF(btrim(p_greeting), '')
    WHERE id = auth.uid()
      AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text[], jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text[], jsonb, text, text) TO authenticated;

-- 3) 아바타 Storage 버킷 + 정책
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 읽기: 공개(getPublicUrl 로 표시)
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- 업로드: 본인 폴더({auth.uid()}/...) 또는 Admin
DROP POLICY IF EXISTS avatars_staff_insert ON storage.objects;
CREATE POLICY avatars_staff_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.current_user_role() = 'admin'
    )
);

-- 갱신(upsert): 본인 폴더 또는 Admin
DROP POLICY IF EXISTS avatars_staff_update ON storage.objects;
CREATE POLICY avatars_staff_update ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.current_user_role() = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'avatars'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.current_user_role() = 'admin'
    )
);

-- 삭제: 본인 폴더 또는 Admin
DROP POLICY IF EXISTS avatars_staff_delete ON storage.objects;
CREATE POLICY avatars_staff_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.current_user_role() = 'admin'
    )
);

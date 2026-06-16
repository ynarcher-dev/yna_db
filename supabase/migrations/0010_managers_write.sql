-- =============================================================================
-- 0010_managers_write.sql — 심사역 보정 + 본인 프로필 수정 RPC
-- 출처: docs/5_managers.md 5.4, docs/14_auth.md 14.5 (본인 프로필/약력만 본인 수정,
--       전체 수정·소프트삭제는 Admin), docs/2_policies.md 2.2.
-- 선행: 0001_schema.sql, 0002_rls.sql(managers SELECT + managers_update_admin 정책,
--       current_user_role()), 0006_partners_adjustments.sql(공통 set_updated_at()).
-- 비고: 심사역 '등록'은 Edge Function admin-create-user(계정 발급)로 별도 처리하므로
--       클라이언트 INSERT 정책은 만들지 않는다. 본인 수정은 허용 컬럼만 갱신하는
--       SECURITY DEFINER RPC(update_my_profile)로 제공한다(role/position/department/email 제외).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS / OR REPLACE 사용.
-- =============================================================================

-- 1) updated_at(최종반영일) 컬럼 + UPDATE 자동 갱신 트리거 + 기존행 backfill(=등록일)
ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());
UPDATE public.managers SET updated_at = created_at WHERE updated_at <> created_at;

DROP TRIGGER IF EXISTS managers_set_updated_at ON public.managers;
CREATE TRIGGER managers_set_updated_at
BEFORE UPDATE ON public.managers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) created_by(작성자=계정 발급한 Admin) 컬럼 — 향후 Edge Function 이 기록 (자기참조 FK)
ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid();

-- 3) Admin 전체 수정/소프트삭제 정책 재확인 (0002 에서 생성됨 — idempotent 보강)
DROP POLICY IF EXISTS managers_update_admin ON public.managers;
CREATE POLICY managers_update_admin
ON public.managers FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- 4) 본인 프로필 수정 RPC (SECURITY DEFINER)
--    auth.uid() 본인 행의 '허용 컬럼만' 갱신한다. role/position/department_id/email 은
--    본인이 바꿀 수 없다(직급·소속·권한은 Admin/Edge Function 영역). updated_at 은 트리거로 갱신.
CREATE OR REPLACE FUNCTION public.update_my_profile(
    p_name              text,
    p_phone             text,
    p_specialties       text[],
    p_biography         jsonb,
    p_profile_image_url text
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
        biography         = COALESCE(p_biography, '{"education": [], "career": []}'::jsonb),
        profile_image_url = NULLIF(btrim(p_profile_image_url), '')
    WHERE id = auth.uid()
      AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text[], jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text[], jsonb, text) TO authenticated;

-- =============================================================================
-- 0030_managers_sections.sql — 심사역 상세 카드 섹션 표시/숨김 토글
-- 출처: 발주자 요청 — 카드 섹션 표시/숨김을 전 도메인 공통 규약으로 적용(17_conventions 7장).
-- 선행: 0001(managers), 0010/0011(managers write·RPC).
-- 설계: 섹션키→boolean 맵을 jsonb 한 컬럼으로 보관(통째 갱신). 누락 키는 앱에서 '표시'로 간주.
--   default: 전체 표시 → 기존 행은 모든 섹션이 그대로 노출된다.
-- 권한: 표시 설정은 Admin 전용. Admin 전체 수정(managers_update_admin, 직접 UPDATE)이 sections 를
--   갱신한다. 본인 수정 RPC(update_my_profile)는 허용 컬럼만 다루므로 sections 미포함 → RPC 변경 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT
    '{"biography":true,"intro":true}'::jsonb;

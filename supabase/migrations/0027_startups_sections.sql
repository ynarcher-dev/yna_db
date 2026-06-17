-- =============================================================================
-- 0027_startups_sections.sql — 상세 카드 섹션 표시/숨김 토글
-- 출처: 발주자 요청 — 등록/기본 수정에서 카드 섹션을 활성/비활성하고,
--   비활성 섹션은 상세 화면에서 숨긴다.
-- 선행: 0001(startups), 0002(startups update RLS).
-- 설계: 섹션키→boolean 맵을 jsonb 한 컬럼으로 보관(통째 갱신). 누락 키는 앱에서 '표시'로 간주.
--   default: 전체 표시 → 기존 행은 모든 섹션이 그대로 노출된다.
-- 비고: 기존 startups UPDATE RLS(Admin·Manager) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT
    '{"businessTeam":true,"metrics":true,"shareholders":true,"diagnosis":true,"newsroom":true,"followups":true,"memo":true}'::jsonb;

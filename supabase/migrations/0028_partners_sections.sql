-- =============================================================================
-- 0028_partners_sections.sql — 협력사 상세 카드 섹션 표시/숨김 토글
-- 출처: 발주자 요청 — 카드 섹션 표시/숨김을 전 도메인 공통 규약으로 적용(17_conventions 7장).
-- 선행: 0001(partners), 0005(partners write RLS).
-- 설계: 섹션키→boolean 맵을 jsonb 한 컬럼으로 보관(통째 갱신). 누락 키는 앱에서 '표시'로 간주.
--   default: 전체 표시 → 기존 행은 모든 섹션이 그대로 노출된다.
-- 비고: 기존 partners UPDATE RLS(Admin·Manager) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT
    '{"interactionLog":true}'::jsonb;

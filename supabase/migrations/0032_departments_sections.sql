-- =============================================================================
-- 0032_departments_sections.sql — 소속(부서) 상세 카드 섹션 표시/숨김 토글
-- 출처: 발주자 요청 — 전 도메인 공통 '첨부파일' 카드 도입에 따라, 소속도 섹션 토글 인프라를 갖춘다.
--   (소속은 그동안 토글 대상 보조 섹션이 없어 sections 컬럼이 없었음 → 첨부파일 카드 추가로 신설)
-- 선행: 0001(departments), 0009(departments write RLS — Admin 전용).
-- 설계: 섹션키→boolean 맵 jsonb. 누락 키는 앱에서 '표시'로 간주. default 전체 표시.
-- 비고: 기존 departments UPDATE RLS(Admin 전용) 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{"attachments":true}'::jsonb;

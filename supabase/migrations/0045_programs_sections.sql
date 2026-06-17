-- =============================================================================
-- 0045_programs_sections.sql — 프로그램 상세 카드 섹션 표시/숨김 토글
-- 출처: 전 도메인 공통 규약(17_conventions 7장 · PATTERNS 15장). 등록·기본수정 폼 토글 →
--   상세는 활성 섹션만 노출. 프로그램 보조 섹션 = 운영 심사역·참여 스타트업·마일스톤 캘린더·첨부파일.
-- 선행: 0001(programs), 0043(programs write RLS — 책임자/관리자).
-- 설계: 섹션키→boolean 맵 jsonb. 누락 키는 앱에서 '표시'로 간주. default 전체 표시.
-- 비고: 기존 programs UPDATE RLS(0043) 사용 → 별도 정책 불필요. 개요 카드는 항상 표시.
--   첨부파일 entity_type='program' 는 uploaded_files.entity_type(VARCHAR·CHECK없음) → 추가 마이그레이션 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL
  DEFAULT '{"managers":true,"startups":true,"calendar":true,"attachments":true}'::jsonb;

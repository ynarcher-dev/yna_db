-- =============================================================================
-- 0037_projects_sections.sql — 프로젝트 상세 카드 섹션 표시/숨김 토글
-- 출처: 전 도메인 공통 규약(17_conventions 7장 · PATTERNS 15장). 등록·기본수정 폼 토글 →
--   상세는 활성 섹션만 노출. 프로젝트 보조 섹션 = 담당자·매칭 스타트업·대기업/협력사·첨부파일.
-- 선행: 0001(projects), 0033(projects write RLS — 책임자/관리자).
-- 설계: 섹션키→boolean 맵 jsonb. 누락 키는 앱에서 '표시'로 간주. default 전체 표시.
-- 비고: 기존 projects UPDATE RLS(0033) 사용 → 별도 정책 불필요. 기본 개요 카드는 항상 표시.
--   첨부파일 entity_type='project' 는 uploaded_files.entity_type(VARCHAR, CHECK 없음)이라 추가 마이그레이션 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL
  DEFAULT '{"managers":true,"startups":true,"partners":true,"attachments":true}'::jsonb;

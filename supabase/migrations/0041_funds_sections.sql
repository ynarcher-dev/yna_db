-- =============================================================================
-- 0041_funds_sections.sql — 펀드 상세 카드 섹션 표시/숨김 토글
-- 출처: 전 도메인 공통 규약(17_conventions 7장 · PATTERNS 15장). 등록·기본수정 폼 토글 →
--   상세는 활성 섹션만 노출. 펀드 보조 섹션 = LP 구성·Capital Call·피투자 포트폴리오·첨부파일.
-- 선행: 0001(funds), 0039(funds write — Admin 전용 메타/RLS는 0002·0039).
-- 설계: 섹션키→boolean 맵 jsonb. 누락 키는 앱에서 '표시'로 간주. default 전체 표시.
-- 비고: 기존 funds UPDATE RLS(0002 Admin 전용) 사용 → 별도 정책 불필요. 재무 정보 카드는 항상 표시.
--   첨부파일 entity_type='fund' 는 uploaded_files.entity_type(VARCHAR·CHECK없음) → 추가 마이그레이션 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.funds
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL
  DEFAULT '{"lp":true,"capitalCalls":true,"investments":true,"attachments":true}'::jsonb;

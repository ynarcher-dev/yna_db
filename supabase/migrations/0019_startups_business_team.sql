-- =============================================================================
-- 0019_startups_business_team.sql — 스타트업 '비즈니스 & 팀 역량' 컬럼
-- 출처: 발주자 요청 — 성장 지표 위에 비즈니스/팀 역량 설명 박스.
-- 선행: 0001_schema.sql(startups), 0002_rls.sql(startups update RLS 존재).
-- 설계: 정성 정보라 jsonb 2개로 유연하게 저장(약력 패턴과 동일 취지).
--   business_profile: { oneLiner, businessModel, targetMarket, competitiveEdge }
--   team_profile:     { founderStrength, members:[{name,role,background}], capabilities:[] }
-- 비고: 기존 startups UPDATE RLS(작성/수정 Admin·Manager)를 그대로 사용 → 별도 정책 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS business_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS team_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

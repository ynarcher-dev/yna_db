-- =============================================================================
-- 0013_experts_bio_greeting.sql — 전문가 약력(biography) + 소개(greeting) 컬럼
-- 출처: docs/9_experts.md (심사역과 사람-프로필 골격 공유), 상세 페이지 정렬 결정.
-- 선행: 0001_schema.sql, 0008_experts_write.sql(experts INSERT/UPDATE RLS).
-- 비고: 전문가 작성/수정은 직원(admin/manager) 직접 INSERT/UPDATE(0008)이므로 RPC 변경 불필요.
--       biography 는 심사역과 동일한 jsonb 구조({education, career, certifications}).
--       greeting 은 화면에서 '소개'로 표기(향후 회사 홈페이지 노출용).
-- 재실행 안전(idempotent): IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS greeting TEXT;

ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS biography JSONB
  NOT NULL DEFAULT '{"education": [], "career": [], "certifications": []}'::jsonb;

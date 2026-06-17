-- =============================================================================
-- 0050_departments_company.sql — 소속 계층 개편 1/3: 그룹(departments)에 '회사' 추가
-- 출처: 발주자 확정(2026-06-17) — 소속을 "회사 > 그룹 > 팀" 3단계로 개편.
--   · 회사: 와이앤아처 / 와이앤아처벤처스 / 와이앤아처인베스트먼트 (고정 3종)
--   · 그룹: 기존 departments 테이블을 그대로 사용(화면 라벨만 "그룹"). 한 회사에 속한다.
--   · 팀: 0051 에서 신설(그룹의 하위), 심사역 소속은 팀(0052).
-- 컨벤션(PATTERNS.md 14장): DB 테이블/컬럼명은 영문 그대로 두고 화면 표기만 바꾼다 →
--   테이블명 departments 유지, company 컬럼만 추가.
-- 선행: 0001(departments), 0009(updated_at/created_by/RLS).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP CONSTRAINT IF EXISTS / 조건부 UPDATE.
-- =============================================================================

-- 1) company 컬럼 추가 (그룹이 소속된 회사) ----------------------------------
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS company VARCHAR(50);

-- 2) 기존 그룹은 대표 회사(와이앤아처)로 백필 ---------------------------------
UPDATE public.departments SET company = '와이앤아처' WHERE company IS NULL;

-- 3) 허용 회사 3종 CHECK 제약 + 기본값 + NOT NULL ----------------------------
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_company_check;
ALTER TABLE public.departments
  ADD CONSTRAINT departments_company_check
  CHECK (company IN ('와이앤아처', '와이앤아처벤처스', '와이앤아처인베스트먼트'));

ALTER TABLE public.departments ALTER COLUMN company SET DEFAULT '와이앤아처';
ALTER TABLE public.departments ALTER COLUMN company SET NOT NULL;

-- 4) 그룹 유일성: 전역 이름 UNIQUE → (회사, 그룹명) UNIQUE 로 변경 -------------
--    회사가 다르면 같은 그룹명을 쓸 수 있어야 한다(0001 의 departments_name_key 폐기).
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_company_name_key;
ALTER TABLE public.departments
  ADD CONSTRAINT departments_company_name_key UNIQUE (company, name);

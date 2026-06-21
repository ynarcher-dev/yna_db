-- =============================================================================
-- 0059_business_status.sql — businesses.status(사업 진행 상태) 추가
-- 출처: 발주자 확정(2026-06-21) — 사업관리·M&A관리·신사업관리 목록 뷰를 동일 구조로 통일.
--   세 목록 모두 [No.·명칭·기간·상태·담당자·작성자·등록일·수정일] 컬럼을 공유한다.
--   사업(businesses)에는 진행 상태 컬럼이 없었으므로 프로젝트(projects.stage)와 동일한
--   5단계 enum(대기/진행중/완료/중단/취소)을 status 컬럼으로 추가한다.
-- 선행: 0001(programs 스키마), 0055(programs→businesses 리네임).
-- 재실행 안전(idempotent): ADD COLUMN IF NOT EXISTS + EXCEPTION 가드.
-- =============================================================================

-- 1) status 컬럼 추가 (기본값 'pending' — 프로젝트 등록 기본값과 동일) --------------
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- 2) 허용값 CHECK 제약 (projects.stage 와 동일한 5단계) --------------------------
DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'suspended', 'canceled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) 기존 행 초기값 1회 백필 (기간 기준) — 이후로는 폼에서 수동 관리 -----------------
--    end_date < 오늘 → 완료, start_date > 오늘 → 대기, 그 외(기간 내) → 진행중.
--    컬럼 추가 직후 모든 행이 'pending' 이므로 그 행에 한해 갱신한다(재실행 영향 최소).
UPDATE public.businesses SET status =
  CASE
    WHEN end_date   < CURRENT_DATE THEN 'completed'
    WHEN start_date > CURRENT_DATE THEN 'pending'
    ELSE 'in_progress'
  END
WHERE status = 'pending';

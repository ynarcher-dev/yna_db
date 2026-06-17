-- =============================================================================
-- 0035_projects_type_stage_revision.sql — 프로젝트 유형·진행상태 개편
-- 출처: 발주자 요청(2026-06-17).
--   - 유형(project_type): m_and_a·open_innovation → m_and_a·new_business·other(기타).
--     '기타'는 자유 텍스트(project_type_etc)를 동반하고 유형 배지 자리에 표시한다.
--   - 진행상태(stage): 딜 파이프라인(sourcing~contract) 폐기 →
--     pending(대기)·in_progress(진행중)·completed(완료)·suspended(중단)·canceled(취소).
--     칸반 보드는 사용하지 않으며 stage 는 단순 상태값이다(컬럼명 stage 유지).
-- 선행: 0001_schema.sql(projects 인라인 CHECK), 0033_projects_write.sql.
-- 비고: 0001 의 인라인 CHECK 는 자동명(projects_project_type_check / projects_stage_check).
--   기존 데이터가 있다면 새 허용값으로 매핑 후 제약을 교체한다(브랜드 신규 도메인이라 보통 빈 테이블).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 기타 유형 자유 텍스트 컬럼
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type_etc VARCHAR(50);

-- 2) 기존 CHECK 제거(인라인 자동명) 후 데이터 매핑
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_stage_check;

-- 구 유형 open_innovation → 신사업(new_business) 로 이관
UPDATE public.projects SET project_type = 'new_business' WHERE project_type = 'open_innovation';
-- 구 단계값(완료·취소 제외)은 모두 대기(pending) 로 수렴
UPDATE public.projects
  SET stage = 'pending'
  WHERE stage NOT IN ('pending', 'in_progress', 'completed', 'suspended', 'canceled');

-- 3) 기본 진행상태 변경(구 'sourcing' → 'pending')
ALTER TABLE public.projects ALTER COLUMN stage SET DEFAULT 'pending';

-- 4) 새 CHECK 제약 추가(동일 이름으로 재생성 → 재실행 안전)
ALTER TABLE public.projects
  ADD CONSTRAINT projects_project_type_check
  CHECK (project_type IN ('m_and_a', 'new_business', 'other'));

ALTER TABLE public.projects
  ADD CONSTRAINT projects_stage_check
  CHECK (stage IN ('pending', 'in_progress', 'completed', 'suspended', 'canceled'));

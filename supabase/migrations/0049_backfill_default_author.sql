-- =============================================================================
-- 0049_backfill_default_author.sql — created_by 가 NULL 인 레거시/시드 레코드의 작성자 백필
-- 출처: 발주자 확정(2026-06-17) — "모든 담당자 목록에 작성자가 디폴트로 들어가 있어야 한다."
--   시드/레거시 레코드는 created_by 가 NULL 이라 작성자를 식별할 수 없으므로,
--   가장 먼저 등록된 Admin 한 명을 디폴트 작성자로 채운다(발주자 선택 "전부 대표 Admin 한 명으로").
-- 선행: 0033·0014·0043·0039(각 부모 created_by 컬럼), 0034·0038·0001·0047(조인 테이블),
--       0048(작성자 자동 편입/해제 차단 트리거 — UPDATE 는 트리거를 안 타므로 여기서 조인도 백필).
-- 비고: created_by 는 AFTER INSERT 트리거만 있으므로, UPDATE 로 채운 작성자는 아래에서 조인에
--   직접 INSERT 한다. Admin 이 한 명도 없으면 서브쿼리가 NULL → 변경 없음(안전).
-- 재실행 안전(idempotent): WHERE created_by IS NULL / ON CONFLICT DO NOTHING.
-- =============================================================================

-- 1) NULL created_by → 가장 먼저 등록된 Admin 으로 백필 ------------------------
--    네 도메인 모두 동일한 한 명(created_at, id 오름차순 1명)을 사용한다.
UPDATE public.projects
SET created_by = (
  SELECT id FROM public.managers
  WHERE role = 'admin' AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC LIMIT 1
)
WHERE created_by IS NULL;

UPDATE public.startups
SET created_by = (
  SELECT id FROM public.managers
  WHERE role = 'admin' AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC LIMIT 1
)
WHERE created_by IS NULL;

UPDATE public.programs
SET created_by = (
  SELECT id FROM public.managers
  WHERE role = 'admin' AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC LIMIT 1
)
WHERE created_by IS NULL;

UPDATE public.funds
SET created_by = (
  SELECT id FROM public.managers
  WHERE role = 'admin' AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC LIMIT 1
)
WHERE created_by IS NULL;

-- 2) 채워진 작성자를 담당자 조인에 편입(멱등) — 0048 step3 와 동일 패턴 ---------
INSERT INTO public.project_managers (project_id, manager_id)
SELECT id, created_by FROM public.projects WHERE created_by IS NOT NULL
ON CONFLICT (project_id, manager_id) DO NOTHING;

INSERT INTO public.startup_managers (startup_id, manager_id)
SELECT id, created_by FROM public.startups WHERE created_by IS NOT NULL
ON CONFLICT (startup_id, manager_id) DO NOTHING;

INSERT INTO public.program_managers (program_id, manager_id, role)
SELECT id, created_by, 'lead' FROM public.programs WHERE created_by IS NOT NULL
ON CONFLICT (program_id, manager_id) DO NOTHING;

INSERT INTO public.fund_managers (fund_id, manager_id)
SELECT id, created_by FROM public.funds WHERE created_by IS NOT NULL
ON CONFLICT (fund_id, manager_id) DO NOTHING;

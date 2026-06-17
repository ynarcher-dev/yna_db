-- =============================================================================
-- 0048_author_as_manager.sql — 작성자(created_by)의 담당자 필수 편입 + 해제 차단
-- 출처: 발주자 확정(2026-06-17) — "작성자는 반드시 담당자 리스트에 포함되며 연동 해제 불가.
--   나머지 담당자는 자유롭게 추가/해제." 4개 도메인(프로젝트·스타트업·프로그램·펀드) 공통.
-- 선행: 0034(project_managers), 0038(startup_managers), 0001(program_managers),
--       0047(fund_managers), 그리고 각 부모의 created_by 컬럼(0033·0014·0043·0039).
-- 처리:
--   1) sync_author_manager(): 부모 레코드 INSERT 시 작성자를 담당자 조인에 자동 편입.
--      (프로그램은 작성자를 운영총괄 role='lead' 로 편입. 나머지는 역할 없음.)
--   2) prevent_author_manager_unlink(): 담당자 조인에서 작성자 행 DELETE 차단.
--   3) 기존 데이터 백필(멱등) — 모든 기존 레코드의 작성자를 담당자에 편입.
-- 비고: 부모/심사역은 전부 소프트삭제(deleted_at)라 실제 DELETE 가 앱에서 발생하지 않으므로,
--   해제 차단 트리거가 CASCADE 삭제를 막는 일은 정상 흐름에서 없다. (DB 직접 하드삭제 시에만
--   영향 — 그 경우 담당자 행을 먼저 제거해야 한다.)
-- 재실행 안전(idempotent): CREATE OR REPLACE / DROP TRIGGER IF EXISTS / ON CONFLICT DO NOTHING.
-- =============================================================================

-- 1) 작성자 자동 편입 (AFTER INSERT on 부모) ----------------------------------
--    SECURITY DEFINER: 조인 테이블 RLS(INSERT 정책)와 무관하게 항상 편입되도록 한다.
CREATE OR REPLACE FUNCTION public.sync_author_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'projects' THEN
    INSERT INTO public.project_managers (project_id, manager_id)
    VALUES (NEW.id, NEW.created_by)
    ON CONFLICT (project_id, manager_id) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'startups' THEN
    INSERT INTO public.startup_managers (startup_id, manager_id)
    VALUES (NEW.id, NEW.created_by)
    ON CONFLICT (startup_id, manager_id) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'programs' THEN
    -- 작성자는 운영총괄(lead)로 편입
    INSERT INTO public.program_managers (program_id, manager_id, role)
    VALUES (NEW.id, NEW.created_by, 'lead')
    ON CONFLICT (program_id, manager_id) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'funds' THEN
    INSERT INTO public.fund_managers (fund_id, manager_id)
    VALUES (NEW.id, NEW.created_by)
    ON CONFLICT (fund_id, manager_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_sync_author_manager ON public.projects;
CREATE TRIGGER projects_sync_author_manager
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.sync_author_manager();

DROP TRIGGER IF EXISTS startups_sync_author_manager ON public.startups;
CREATE TRIGGER startups_sync_author_manager
AFTER INSERT ON public.startups
FOR EACH ROW EXECUTE FUNCTION public.sync_author_manager();

DROP TRIGGER IF EXISTS programs_sync_author_manager ON public.programs;
CREATE TRIGGER programs_sync_author_manager
AFTER INSERT ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.sync_author_manager();

DROP TRIGGER IF EXISTS funds_sync_author_manager ON public.funds;
CREATE TRIGGER funds_sync_author_manager
AFTER INSERT ON public.funds
FOR EACH ROW EXECUTE FUNCTION public.sync_author_manager();

-- 2) 작성자 행 해제(DELETE) 차단 (BEFORE DELETE on 조인) -----------------------
--    분기마다 자신의 테이블에만 존재하는 FK 컬럼(OLD.*)을 참조하며, TG_TABLE_NAME 으로
--    실행 경로를 한정하므로 타 테이블 컬럼 접근은 일어나지 않는다.
CREATE OR REPLACE FUNCTION public.prevent_author_manager_unlink()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_author UUID;
BEGIN
  IF TG_TABLE_NAME = 'project_managers' THEN
    SELECT created_by INTO v_author FROM public.projects WHERE id = OLD.project_id;
  ELSIF TG_TABLE_NAME = 'startup_managers' THEN
    SELECT created_by INTO v_author FROM public.startups WHERE id = OLD.startup_id;
  ELSIF TG_TABLE_NAME = 'program_managers' THEN
    SELECT created_by INTO v_author FROM public.programs WHERE id = OLD.program_id;
  ELSIF TG_TABLE_NAME = 'fund_managers' THEN
    SELECT created_by INTO v_author FROM public.funds WHERE id = OLD.fund_id;
  END IF;

  IF v_author IS NOT NULL AND v_author = OLD.manager_id THEN
    RAISE EXCEPTION '작성자는 담당자에서 해제할 수 없습니다.';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS project_managers_block_author_unlink ON public.project_managers;
CREATE TRIGGER project_managers_block_author_unlink
BEFORE DELETE ON public.project_managers
FOR EACH ROW EXECUTE FUNCTION public.prevent_author_manager_unlink();

DROP TRIGGER IF EXISTS startup_managers_block_author_unlink ON public.startup_managers;
CREATE TRIGGER startup_managers_block_author_unlink
BEFORE DELETE ON public.startup_managers
FOR EACH ROW EXECUTE FUNCTION public.prevent_author_manager_unlink();

DROP TRIGGER IF EXISTS program_managers_block_author_unlink ON public.program_managers;
CREATE TRIGGER program_managers_block_author_unlink
BEFORE DELETE ON public.program_managers
FOR EACH ROW EXECUTE FUNCTION public.prevent_author_manager_unlink();

DROP TRIGGER IF EXISTS fund_managers_block_author_unlink ON public.fund_managers;
CREATE TRIGGER fund_managers_block_author_unlink
BEFORE DELETE ON public.fund_managers
FOR EACH ROW EXECUTE FUNCTION public.prevent_author_manager_unlink();

-- 3) 기존 데이터 백필(멱등) ---------------------------------------------------
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

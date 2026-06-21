-- =============================================================================
-- 0055_rename_programs_to_business.sql — "프로그램 관리" → "사업 관리" 전면 리네임
-- 출처: 발주자 확정(2026-06-21) — 도메인 명칭을 프로그램→사업(business)으로 통일.
-- 범위: 물리 테이블·컬럼·정책·트리거·함수 식별자 + 저장된 데이터 값(source_type/
--   entity_type='program', 대시보드 집계키 activePrograms)까지 완전 일관 마이그레이션.
-- 선행: 0001(스키마), 0003(sync 트리거·get_dashboard_summary), 0004(SELECT 정책),
--   0043~0046(write/sections/partners), 0038(get_dashboard_summary 재정의).
-- 비고: 과거 마이그레이션(0001~0054)은 forward-only 원칙으로 보존한다. 자동 생성된
--   제약/인덱스 내부명(*_pkey·*_fkey·*_key)은 기능에 영향이 없어 레거시명을 유지한다.
-- 재실행 안전(idempotent): to_regclass/information_schema 가드 + EXCEPTION 처리.
-- =============================================================================

-- 1) 테이블 리네임 (정책·트리거·FK 는 테이블을 따라 이동, 명칭은 유지) ----------------
DO $$ BEGIN
  IF to_regclass('public.programs')         IS NOT NULL THEN ALTER TABLE public.programs         RENAME TO businesses;         END IF;
  IF to_regclass('public.program_startups') IS NOT NULL THEN ALTER TABLE public.program_startups RENAME TO business_startups; END IF;
  IF to_regclass('public.program_managers') IS NOT NULL THEN ALTER TABLE public.program_managers RENAME TO business_managers; END IF;
  IF to_regclass('public.program_events')   IS NOT NULL THEN ALTER TABLE public.program_events   RENAME TO business_events;   END IF;
  IF to_regclass('public.program_partners') IS NOT NULL THEN ALTER TABLE public.program_partners RENAME TO business_partners; END IF;
END $$;

-- 2) 조인 테이블 외래키 컬럼 program_id → business_id ------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_startups' AND column_name='program_id')
    THEN ALTER TABLE public.business_startups RENAME COLUMN program_id TO business_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_managers' AND column_name='program_id')
    THEN ALTER TABLE public.business_managers RENAME COLUMN program_id TO business_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_events'   AND column_name='program_id')
    THEN ALTER TABLE public.business_events   RENAME COLUMN program_id TO business_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_partners' AND column_name='program_id')
    THEN ALTER TABLE public.business_partners RENAME COLUMN program_id TO business_id; END IF;
END $$;

-- 3) RLS 정책 명칭 리네임 (이미 리네임됐으면 undefined_object / duplicate_object 무시) ------------------
DO $$ BEGIN ALTER POLICY programs_select_authenticated ON public.businesses RENAME TO businesses_select_authenticated; EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY programs_insert_staff         ON public.businesses RENAME TO businesses_insert_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY programs_update_staff         ON public.businesses RENAME TO businesses_update_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER POLICY program_startups_select_authenticated ON public.business_startups RENAME TO business_startups_select_authenticated; EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_startups_insert_staff         ON public.business_startups RENAME TO business_startups_insert_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_startups_update_staff         ON public.business_startups RENAME TO business_startups_update_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_startups_delete_staff         ON public.business_startups RENAME TO business_startups_delete_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER POLICY program_managers_select_authenticated ON public.business_managers RENAME TO business_managers_select_authenticated; EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_managers_insert_staff         ON public.business_managers RENAME TO business_managers_insert_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_managers_update_staff         ON public.business_managers RENAME TO business_managers_update_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_managers_delete_staff         ON public.business_managers RENAME TO business_managers_delete_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER POLICY program_events_select_authenticated ON public.business_events RENAME TO business_events_select_authenticated; EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_events_insert_staff         ON public.business_events RENAME TO business_events_insert_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_events_update_staff         ON public.business_events RENAME TO business_events_update_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_events_delete_staff         ON public.business_events RENAME TO business_events_delete_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER POLICY program_partners_select_authenticated ON public.business_partners RENAME TO business_partners_select_authenticated; EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_partners_insert_staff         ON public.business_partners RENAME TO business_partners_insert_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER POLICY program_partners_delete_staff         ON public.business_partners RENAME TO business_partners_delete_staff;         EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL; END $$;


-- 4) updated_at 트리거 리네임 (set_updated_at() 함수는 공용이라 유지) ----------------
DROP TRIGGER IF EXISTS programs_set_updated_at   ON public.businesses;
DROP TRIGGER IF EXISTS businesses_set_updated_at ON public.businesses;
CREATE TRIGGER businesses_set_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) 일정 동기화 함수/트리거 리네임 (business_events → system_events) ----------------
--    source_type 데이터 값도 'program' → 'business' 로 통일한다.
CREATE OR REPLACE FUNCTION public.sync_business_event_to_system()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.system_events
        WHERE source_type = 'business' AND source_id = OLD.id;
        RETURN OLD;
    END IF;

    INSERT INTO public.system_events (title, event_type, event_date, source_type, source_id, description)
    VALUES (NEW.title, NEW.event_type, NEW.event_date, 'business', NEW.id, NEW.description)
    ON CONFLICT (source_type, source_id) DO UPDATE
        SET title = EXCLUDED.title,
            event_type = EXCLUDED.event_type,
            event_date = EXCLUDED.event_date,
            description = EXCLUDED.description;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_business_event_to_system() FROM PUBLIC;

DROP TRIGGER IF EXISTS program_events_sync_trigger  ON public.business_events;
DROP TRIGGER IF EXISTS business_events_sync_trigger ON public.business_events;
CREATE TRIGGER business_events_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.business_events
FOR EACH ROW EXECUTE FUNCTION public.sync_business_event_to_system();

DROP FUNCTION IF EXISTS public.sync_program_event_to_system();

-- 6) 대시보드 요약 RPC 재정의 (activePrograms → activeBusinesses, FROM businesses) ---
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(current_period VARCHAR)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'totalManagers',            (SELECT count(*) FROM managers WHERE deleted_at IS NULL),
        'totalStartups',            (SELECT count(*) FROM startups WHERE deleted_at IS NULL),
        'totalPortfolioValuation',  (SELECT COALESCE(SUM(valuation),0) FROM view_startup_latest_metrics),
        'activeBusinesses',         (SELECT count(*) FROM businesses
                                      WHERE deleted_at IS NULL AND CURRENT_DATE BETWEEN start_date AND end_date),
        'totalAum',                 (SELECT COALESCE(SUM(total_amount),0) FROM funds WHERE deleted_at IS NULL),
        'averageFundExhaustionRate',(SELECT COALESCE(ROUND(AVG(exhaustion_rate),2),0) FROM view_fund_exhaustion),
        'totalExperts',             (SELECT count(*) FROM experts WHERE deleted_at IS NULL),
        'averageMentoringRating',   (SELECT COALESCE(ROUND(AVG(rating),1),0) FROM expert_mentorings WHERE rating IS NOT NULL),
        'activeProjects',           (SELECT count(*) FROM projects
                                      WHERE deleted_at IS NULL AND stage NOT IN ('completed','canceled','suspended')),
        'reportSubmissionRate',     public.get_report_submission_rate(current_period),
        'totalDepartments',         (SELECT count(*) FROM departments WHERE deleted_at IS NULL),
        'totalPartners',            (SELECT count(*) FROM partners WHERE deleted_at IS NULL)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated;

-- 7) 저장된 데이터 값 마이그레이션 (식별자가 아닌 컬럼 값) ---------------------------
UPDATE public.system_events  SET source_type = 'business' WHERE source_type = 'program';
UPDATE public.uploaded_files SET entity_type = 'business' WHERE entity_type = 'program';

-- 8) 외래키 제약조건 이름 변경 (programs_created_by_fkey → businesses_created_by_fkey)
DO $$ BEGIN
  ALTER TABLE public.businesses RENAME CONSTRAINT programs_created_by_fkey TO businesses_created_by_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;


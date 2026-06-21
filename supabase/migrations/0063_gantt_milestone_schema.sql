-- =============================================================================
-- 0063_gantt_milestone_schema.sql — 간트차트 마일스톤 스키마 (사업·프로젝트)
-- 출처: 설계 [23_gantt_milestone.md]. 월간 캘린더를 간트차트 형태로 확장한다.
--   1) business_events 확장: 시작/종료일·담당자·진행률·선후관계 메타.
--   2) project_events 신설: 프로젝트(M&A·신사업·기타) 도메인 일정 + 간트.
--   3) project_events → system_events 동기화 트리거(대시보드 다가오는 일정).
--   4) 일정 쓰기 RLS: 배정된 담당자(소속 매니저) + admin 만 등록/수정/삭제.
-- 선행: 0001(business_events·system_events·projects), 0055(program→business 리네임),
--       0034(project_managers), 0062(참여율).
-- 재실행 안전(idempotent): ADD COLUMN IF NOT EXISTS + EXCEPTION 가드 + DROP ... IF EXISTS.
-- =============================================================================

-- 1) business_events 확장 ------------------------------------------------------
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL;
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS progress SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE public.business_events ADD COLUMN IF NOT EXISTS dependencies UUID[];

-- 기존 event_date 데이터를 start_date/end_date 로 안전 이관(단일 일정 → 당일 테스크).
UPDATE public.business_events SET start_date = event_date WHERE start_date IS NULL;
UPDATE public.business_events SET end_date   = start_date WHERE end_date   IS NULL;

-- event_date 는 deprecated(하위 호환 유지) — 신규 행이 비울 수 있도록 NOT NULL 해제.
ALTER TABLE public.business_events ALTER COLUMN event_date DROP NOT NULL;

-- 값 제약: 진행률 0~100, 시작<=종료.
DO $$ BEGIN ALTER TABLE public.business_events ADD CONSTRAINT business_events_progress_check CHECK (progress BETWEEN 0 AND 100); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.business_events ADD CONSTRAINT business_events_period_check CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 동기화 함수 재정의 — event_date(deprecated) 대신 start_date 기준으로 system_events 갱신.
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
    VALUES (NEW.title, NEW.event_type, COALESCE(NEW.start_date, NEW.event_date), 'business', NEW.id, NEW.description)
    ON CONFLICT (source_type, source_id) DO UPDATE
        SET title       = EXCLUDED.title,
            event_type  = EXCLUDED.event_type,
            event_date  = EXCLUDED.event_date,
            description = EXCLUDED.description;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_business_event_to_system() FROM PUBLIC;

-- 2) project_events 신설 -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    progress SMALLINT NOT NULL DEFAULT 0,
    dependencies UUID[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (event_type IN ('meeting', 'contract', 'report', 'milestone', 'other')),
    CHECK (progress BETWEEN 0 AND 100),
    CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS project_events_project_id_idx ON public.project_events(project_id);

-- updated_at 자동 갱신(공통 트리거).
DROP TRIGGER IF EXISTS project_events_set_updated_at ON public.project_events;
CREATE TRIGGER project_events_set_updated_at
BEFORE UPDATE ON public.project_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) project_events → system_events 동기화 -------------------------------------
--    system_events.event_type CHECK 가 사업 6종만 허용하므로, 프로젝트 일정 유형도
--    함께 허용하도록 제약을 확장한다(익명 CHECK 를 동적으로 교체).
DO $$
DECLARE c_name text;
BEGIN
    SELECT conname INTO c_name
    FROM pg_constraint
    WHERE conrelid = 'public.system_events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%event_type%';
    IF c_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.system_events DROP CONSTRAINT %I', c_name);
    END IF;
END $$;

DO $$ BEGIN
    ALTER TABLE public.system_events ADD CONSTRAINT system_events_event_type_check
        CHECK (event_type IN (
            'recruitment', 'demoday', 'networking', 'meeting', 'ir', 'event',
            'contract', 'report', 'milestone', 'other'
        ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 교차 테이블 동기화이므로 SECURITY DEFINER(매니저도 system_events 기록 가능하게).
CREATE OR REPLACE FUNCTION public.sync_project_event_to_system()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.system_events
        WHERE source_type = 'project' AND source_id = OLD.id;
        RETURN OLD;
    END IF;

    INSERT INTO public.system_events (title, event_type, event_date, source_type, source_id, description)
    VALUES (NEW.title, NEW.event_type, NEW.start_date, 'project', NEW.id, NEW.description)
    ON CONFLICT (source_type, source_id) DO UPDATE
        SET title       = EXCLUDED.title,
            event_type  = EXCLUDED.event_type,
            event_date  = EXCLUDED.event_date,
            description = EXCLUDED.description;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_project_event_to_system() FROM PUBLIC;

DROP TRIGGER IF EXISTS project_events_sync_trigger ON public.project_events;
CREATE TRIGGER project_events_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.project_events
FOR EACH ROW EXECUTE FUNCTION public.sync_project_event_to_system();

-- 4) RLS — 일정 쓰기는 '배정된 담당자(소속 매니저) + admin' 만 ----------------------
--    소속 판별 헬퍼(SECURITY DEFINER): 조인 테이블 RLS 재귀를 피하고 auth.uid() 로 직접 확인.
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.business_managers
        WHERE business_id = p_business_id AND manager_id = auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.is_business_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_managers
        WHERE project_id = p_project_id AND manager_id = auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.is_project_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- 4-1) business_events 쓰기 정책을 '소속 담당자 + admin' 으로 재정의(0044/0055 의 단순 manager 허용 폐기).
DROP POLICY IF EXISTS business_events_insert_staff ON public.business_events;
CREATE POLICY business_events_insert_staff
ON public.business_events FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin' OR public.is_business_member(business_id));

DROP POLICY IF EXISTS business_events_update_staff ON public.business_events;
CREATE POLICY business_events_update_staff
ON public.business_events FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin' OR public.is_business_member(business_id))
WITH CHECK (public.current_user_role() = 'admin' OR public.is_business_member(business_id));

DROP POLICY IF EXISTS business_events_delete_staff ON public.business_events;
CREATE POLICY business_events_delete_staff
ON public.business_events FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin' OR public.is_business_member(business_id));

-- 4-2) project_events RLS (읽기는 인증 전체, 쓰기는 소속 담당자 + admin).
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_events_select_authenticated ON public.project_events;
CREATE POLICY project_events_select_authenticated
ON public.project_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS project_events_insert_staff ON public.project_events;
CREATE POLICY project_events_insert_staff
ON public.project_events FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin' OR public.is_project_member(project_id));

DROP POLICY IF EXISTS project_events_update_staff ON public.project_events;
CREATE POLICY project_events_update_staff
ON public.project_events FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin' OR public.is_project_member(project_id))
WITH CHECK (public.current_user_role() = 'admin' OR public.is_project_member(project_id));

DROP POLICY IF EXISTS project_events_delete_staff ON public.project_events;
CREATE POLICY project_events_delete_staff
ON public.project_events FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin' OR public.is_project_member(project_id));

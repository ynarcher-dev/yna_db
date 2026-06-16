-- =============================================================================
-- 0001_schema.sql — 마스터 테이블 DDL + 프로젝트 단계 Trigger
-- 출처: docs/0_db_schema.md 2장 (Supabase SQL Editor 에서 순서대로 실행)
-- 후속: 0002_rls.sql → 15_system_schema.md → 16_aggregations.md → seed.sql
-- =============================================================================

-- 시스템 역할은 인사 직급(position)과 분리한다.
CREATE TYPE public.app_role AS ENUM ('admin', 'manager');

-- 1. 소속 본부 테이블 (departments)
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    established_at DATE,
    description TEXT,
    leader_id UUID, -- 임시 허용 (Manager 생성 후 FK 연결)
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 심사역 테이블 (managers)
CREATE TABLE public.managers (
    id UUID PRIMARY KEY, -- auth.users.id 와 1:1 매핑
    name VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    role public.app_role DEFAULT 'manager' NOT NULL,
    profile_image_url TEXT,
    specialties TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    biography JSONB DEFAULT '{"education": [], "career": []}'::JSONB NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- departments.leader_id 제약조건 설정 (순환 참조 대응)
ALTER TABLE public.departments
ADD CONSTRAINT fk_departments_leader FOREIGN KEY (leader_id) REFERENCES public.managers(id) ON DELETE SET NULL;

-- 3. 스타트업 테이블 (startups)
CREATE TABLE public.startups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ceo_name VARCHAR(50) NOT NULL,
    logo_url TEXT,
    brand_color VARCHAR(7) DEFAULT '#515151',
    description TEXT,
    investment_stage VARCHAR(30) NOT NULL,
    shareholders JSONB DEFAULT '[]'::JSONB NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT startups_brand_color_check CHECK (brand_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 4. 스타트업 시계열 성장 지표 테이블 (startup_metrics)
CREATE TABLE public.startup_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    record_date DATE NOT NULL, -- 기록 기준일 (예: 분기별 스냅샷)
    valuation NUMERIC(15, 2) DEFAULT 0 NOT NULL, -- 기업 가치 (원화)
    revenue NUMERIC(15, 2) DEFAULT 0 NOT NULL, -- 최근 분기/연 매출 (원화)
    employee_count INTEGER DEFAULT 0 NOT NULL, -- 고용 인원수
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (startup_id, record_date),
    CHECK (valuation >= 0),
    CHECK (revenue >= 0),
    CHECK (employee_count >= 0)
);

-- 5. 스타트업 후속 관리 및 보고서 제출 이력 (startup_followups)
CREATE TABLE public.startup_followups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(150) NOT NULL,
    report_type VARCHAR(30) NOT NULL, -- regular_quarterly, annual, risk_report 등
    reporting_period VARCHAR(20) NOT NULL, -- 예: 2026-Q2, 2026
    due_date DATE NOT NULL,
    file_url TEXT, -- 제출 파일 S3 경로
    is_submitted BOOLEAN DEFAULT false NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    milestones JSONB DEFAULT '[]'::JSONB NOT NULL, -- 마일스톤 달성 여부 리스트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (startup_id, report_type, reporting_period),
    CHECK (
        (is_submitted = false AND submitted_at IS NULL)
        OR (is_submitted = true AND submitted_at IS NOT NULL)
    )
);

-- 6. 프로그램 테이블 (programs)
CREATE TABLE public.programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generation INTEGER DEFAULT 1 NOT NULL,
    budget NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    recruitment_deadline DATE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (start_date <= end_date),
    CHECK (recruitment_deadline IS NULL OR recruitment_deadline <= start_date),
    CHECK (budget >= 0)
);

-- 7. 프로그램 참여 매핑 조인 테이블 (program_startups)
CREATE TABLE public.program_startups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(30) DEFAULT 'applied' NOT NULL, -- applied, screening, selected, completed, dropped
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (program_id, startup_id),
    CHECK (status IN ('applied', 'screening', 'selected', 'completed', 'dropped'))
);

-- 8. 프로그램 운영 심사역 매핑 테이블 (program_managers)
CREATE TABLE public.program_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE RESTRICT NOT NULL,
    role VARCHAR(30) DEFAULT 'operator' NOT NULL, -- lead, operator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (program_id, manager_id),
    CHECK (role IN ('lead', 'operator'))
);

-- 9. 프로그램 세부 일정 테이블 (program_events)
CREATE TABLE public.program_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(150) NOT NULL,
    event_type VARCHAR(30) NOT NULL, -- recruitment, demoday, networking, event
    event_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- system_events 동기화(16_aggregations.md) 시 제약 위반을 막기 위해 같은 허용 집합으로 제한한다.
    CHECK (event_type IN ('recruitment', 'demoday', 'networking', 'meeting', 'ir', 'event'))
);

-- 대시보드 공통 일정. 프로그램 외 협력 미팅, IR, 사내 일정을 함께 표현한다.
CREATE TABLE public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    event_date DATE NOT NULL,
    source_type VARCHAR(30), -- program, partner, startup, project, manual
    source_id UUID,
    description TEXT,
    created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (event_type IN ('recruitment', 'demoday', 'networking', 'meeting', 'ir', 'event')),
    -- program_events → system_events 동기화 트리거(16_aggregations.md 7장)의 ON CONFLICT 대상.
    -- 수동 일정은 source_id가 NULL이며, NULL은 UNIQUE에서 서로 충돌하지 않는다.
    UNIQUE (source_type, source_id)
);

-- 10. 펀드 테이블 (funds)
CREATE TABLE public.funds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    total_amount NUMERIC(15, 2) NOT NULL,
    investing_period VARCHAR(100) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL,
    lp_composition JSONB DEFAULT '[]'::JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (total_amount >= 0),
    CHECK (balance >= 0 AND balance <= total_amount)
);

-- 11. 캐피탈 콜 히스토리 테이블 (capital_calls)
CREATE TABLE public.capital_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fund_id UUID REFERENCES public.funds(id) ON DELETE CASCADE NOT NULL,
    call_round INTEGER NOT NULL, -- 캐피탈 콜 차수 (예: 1, 2, 3)
    requested_amount NUMERIC(15, 2) NOT NULL, -- 요청액
    requested_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (fund_id, call_round),
    CHECK (call_round > 0),
    CHECK (requested_amount > 0),
    CHECK (
        (is_completed = false AND completed_date IS NULL)
        OR (is_completed = true AND completed_date IS NOT NULL)
    )
);

-- 12. 펀드 투자 집행 이력 조인 테이블 (fund_investments)
CREATE TABLE public.fund_investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fund_id UUID REFERENCES public.funds(id) ON DELETE RESTRICT NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE RESTRICT NOT NULL,
    investment_amount NUMERIC(15, 2) NOT NULL, -- 실제 출자액
    share_percentage NUMERIC(5, 2) NOT NULL, -- 취득 지분율 (%)
    investment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (fund_id, startup_id),
    CHECK (investment_amount > 0),
    CHECK (share_percentage >= 0 AND share_percentage <= 100)
);

-- 13. 외부 전문가 테이블 (experts)
CREATE TABLE public.experts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    company VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    expert_type VARCHAR(30) NOT NULL, -- mentor, auditor, advisor
    specialties TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (expert_type IN ('mentor', 'auditor', 'advisor'))
);

-- 14. 멘토링/자문 이력 테이블 (expert_mentorings)
CREATE TABLE public.expert_mentorings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL, -- 입회/담당 심사역
    mentoring_date DATE NOT NULL,
    subject VARCHAR(200) NOT NULL,
    feedback TEXT,
    rating NUMERIC(2, 1) CHECK (rating >= 1.0 AND rating <= 5.0), -- 만족도 별점 (1.0~5.0)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. 프로젝트 테이블 (projects)
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    project_type VARCHAR(30) NOT NULL, -- m_and_a, open_innovation
    stage VARCHAR(30) DEFAULT 'sourcing' NOT NULL, -- sourcing, register, review, meeting, proposal, contract, completed, canceled
    priority VARCHAR(10) DEFAULT 'medium' NOT NULL, -- high, medium, low
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (project_type IN ('m_and_a', 'open_innovation')),
    CHECK (stage IN ('sourcing', 'register', 'review', 'meeting', 'proposal', 'contract', 'completed', 'canceled')),
    CHECK (priority IN ('high', 'medium', 'low')),
    CHECK (end_date IS NULL OR start_date <= end_date)
);

-- 16. 협력사 테이블 (partners)
CREATE TABLE public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    partner_type VARCHAR(30) NOT NULL, -- government, university, vc, corporation, partner
    contact_person VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    interaction_log JSONB DEFAULT '[]'::JSONB NOT NULL, -- 교류 협력 이력 로그 리스트
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (partner_type IN ('government', 'university', 'vc', 'corporation', 'partner'))
);

-- 17. 프로젝트-스타트업 연계 조인 테이블 (project_startups)
CREATE TABLE public.project_startups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, startup_id)
);

-- 18. 프로젝트-협력사 연계 조인 테이블 (project_partners)
CREATE TABLE public.project_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, partner_id)
);

-- 19. 프로젝트 타임라인 로그 테이블 (project_timelines)
CREATE TABLE public.project_timelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    changed_date DATE DEFAULT CURRENT_DATE NOT NULL,
    from_stage VARCHAR(30) NOT NULL,
    to_stage VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (from_stage <> to_stage)
);

-- 프로젝트 단계 변경과 타임라인 기록을 하나의 트랜잭션으로 보장한다.
CREATE OR REPLACE FUNCTION public.log_project_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.stage IS DISTINCT FROM OLD.stage THEN
        INSERT INTO public.project_timelines (
            project_id, changed_date, from_stage, to_stage, changed_by
        )
        VALUES (
            NEW.id, CURRENT_DATE, OLD.stage, NEW.stage, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_project_stage_change() FROM PUBLIC;

CREATE TRIGGER projects_stage_audit_trigger
AFTER UPDATE OF stage ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_project_stage_change();

-- =============================================================================
-- 0057_matching_programs.sql — 매칭 프로그램 + 매칭 신청/연계 테이블·RLS
-- 출처: docs/21_matching_programs.md (TIPS·LIPS 등 지원사업 매칭 현황 + 스타트업 신청/선정 이력).
-- 선행: 0001(managers·startups), 0002(역할 헬퍼 current_user_role), 0006(set_updated_at()).
-- 권한(21.4): 읽기=전 직원 / 프로그램 등록·수정=Admin·Manager, 삭제(소프트)=Admin /
--   매칭 신청 등록·상태변경·해제=Admin·Manager.
-- 설계: 신규 테이블이라 sections jsonb·메타 컬럼(created_by·updated_at)을 CREATE 에 포함.
--   첨부파일 entity_type='matching_program' 은 uploaded_files.entity_type(VARCHAR, CHECK 없음)이라 추가 불필요.
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 매칭 프로그램 (parent) -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matching_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    agency VARCHAR(100),
    year INTEGER NOT NULL,
    budget NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'active' NOT NULL, -- active, closed
    description TEXT,
    sections JSONB NOT NULL DEFAULT '{"applications":true,"attachments":true}'::jsonb,
    created_by UUID REFERENCES public.managers(id) ON DELETE SET NULL DEFAULT auth.uid(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (budget >= 0),
    CHECK (status IN ('active', 'closed'))
);

DROP TRIGGER IF EXISTS matching_programs_set_updated_at ON public.matching_programs;
CREATE TRIGGER matching_programs_set_updated_at
BEFORE UPDATE ON public.matching_programs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) 매칭 신청/연계 (join: program × startup × manager) -------------------------
CREATE TABLE IF NOT EXISTS public.matching_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.matching_programs(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL, -- 추천/담당 심사역
    status VARCHAR(30) DEFAULT 'applied' NOT NULL, -- applied, recommended, selected, rejected
    apply_date DATE NOT NULL,
    selection_date DATE,
    matching_amount NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (program_id, startup_id),
    CHECK (status IN ('applied', 'recommended', 'selected', 'rejected')),
    CHECK (selection_date IS NULL OR selection_date >= apply_date),
    CHECK (matching_amount IS NULL OR matching_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_matching_applications_program
  ON public.matching_applications (program_id);

DROP TRIGGER IF EXISTS matching_applications_set_updated_at ON public.matching_applications;
CREATE TRIGGER matching_applications_set_updated_at
BEFORE UPDATE ON public.matching_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS 활성화 ----------------------------------------------------------------
ALTER TABLE public.matching_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_applications ENABLE ROW LEVEL SECURITY;

-- 4) SELECT 정책 — 읽기는 전 직원 ----------------------------------------------
DROP POLICY IF EXISTS matching_programs_select_authenticated ON public.matching_programs;
CREATE POLICY matching_programs_select_authenticated
ON public.matching_programs FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS matching_applications_select_authenticated ON public.matching_applications;
CREATE POLICY matching_applications_select_authenticated
ON public.matching_applications FOR SELECT TO authenticated USING (true);

-- 5) matching_programs 쓰기 — 등록·수정=전 직원, 소프트삭제=Admin 만 ----------
DROP POLICY IF EXISTS matching_programs_insert_staff ON public.matching_programs;
CREATE POLICY matching_programs_insert_staff
ON public.matching_programs FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'manager')
    AND deleted_at IS NULL
);

DROP POLICY IF EXISTS matching_programs_update_staff ON public.matching_programs;
CREATE POLICY matching_programs_update_staff
ON public.matching_programs FOR UPDATE TO authenticated
USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    -- Manager 는 deleted_at 설정 불가(비활성화=Admin 전용). 그 외 수정은 전 직원.
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'manager' AND deleted_at IS NULL)
);

-- 6) matching_applications 쓰기 — 추가/수정/상태변경/해제=전 직원 -------------
DROP POLICY IF EXISTS matching_applications_insert_staff ON public.matching_applications;
CREATE POLICY matching_applications_insert_staff
ON public.matching_applications FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS matching_applications_update_staff ON public.matching_applications;
CREATE POLICY matching_applications_update_staff
ON public.matching_applications FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS matching_applications_delete_staff ON public.matching_applications;
CREATE POLICY matching_applications_delete_staff
ON public.matching_applications FOR DELETE TO authenticated
USING (public.current_user_role() IN ('admin', 'manager'));

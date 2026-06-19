-- =============================================================================
-- 0054_remove_author_as_manager.sql — 작성자(created_by) 담당자 필수 편입 규칙 폐지
-- 출처: 발주자 변경 요청(2026-06-18) — "담당자 선택 시 작성자가 필수로 들어가지 않게 한다."
--   0048(작성자 자동 편입 + 해제 차단)을 4개 도메인(프로젝트·스타트업·프로그램·펀드) 전부 되돌린다.
-- 선행: 0048_author_as_manager(트리거/함수 생성), 0049_backfill_default_author(작성자 백필).
-- 처리:
--   1) 부모 INSERT 시 작성자 자동 편입 트리거(*_sync_author_manager) 4개 제거 + 함수 제거.
--   2) 작성자 담당자 행 해제 차단 트리거(*_block_author_unlink) 4개 제거 + 함수 제거.
--   3) 이미 자동 편입된 기존 작성자=담당자 행을 4개 조인 테이블에서 일괄 삭제.
--      (의도적으로 추가한 작성자 행과 구분 불가 → 발주자 확정대로 함께 삭제.)
-- 비고: 해제 차단 트리거를 step1~2 에서 먼저 제거한 뒤 step3 에서 삭제해야 한다
--   (차단 트리거가 살아있으면 작성자 행 DELETE 가 예외로 막힌다).
-- 재실행 안전(idempotent): DROP TRIGGER/FUNCTION IF EXISTS / DELETE 는 멱등.
-- =============================================================================

-- 1) 작성자 자동 편입 트리거 + 함수 제거 ---------------------------------------
DROP TRIGGER IF EXISTS projects_sync_author_manager ON public.projects;
DROP TRIGGER IF EXISTS startups_sync_author_manager ON public.startups;
DROP TRIGGER IF EXISTS programs_sync_author_manager ON public.programs;
DROP TRIGGER IF EXISTS funds_sync_author_manager ON public.funds;
DROP FUNCTION IF EXISTS public.sync_author_manager();

-- 2) 작성자 행 해제 차단 트리거 + 함수 제거 -----------------------------------
DROP TRIGGER IF EXISTS project_managers_block_author_unlink ON public.project_managers;
DROP TRIGGER IF EXISTS startup_managers_block_author_unlink ON public.startup_managers;
DROP TRIGGER IF EXISTS program_managers_block_author_unlink ON public.program_managers;
DROP TRIGGER IF EXISTS fund_managers_block_author_unlink ON public.fund_managers;
DROP FUNCTION IF EXISTS public.prevent_author_manager_unlink();

-- 3) 기존 작성자=담당자 행 일괄 삭제 (차단 트리거 제거 후) ----------------------
DELETE FROM public.project_managers pm
USING public.projects p
WHERE pm.project_id = p.id AND pm.manager_id = p.created_by;

DELETE FROM public.startup_managers sm
USING public.startups s
WHERE sm.startup_id = s.id AND sm.manager_id = s.created_by;

DELETE FROM public.program_managers pm
USING public.programs p
WHERE pm.program_id = p.id AND pm.manager_id = p.created_by;

DELETE FROM public.fund_managers fm
USING public.funds f
WHERE fm.fund_id = f.id AND fm.manager_id = f.created_by;

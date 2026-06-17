-- =============================================================================
-- 0031_entity_attachments.sql — 전 도메인 공통 '첨부파일' 카드(엔티티 파일 업로드)
-- 출처: 발주자 요청 — 모든 게시글 상세에 동일한 파일 업로드 카드 섹션. 개별/전체 다운로드.
--   용량 제한 없음(추후 S3 연동). 기존 다운로드 인프라(uploaded_files·log_file_download·reports버킷) 재사용.
-- 선행: 0026(uploaded_files·file_download_logs·log_file_download·reports 비공개 전환).
-- 설계: 새 테이블 대신 uploaded_files 를 폴리모픽으로 확장.
--   entity_type/entity_id : 어느 도메인 레코드의 첨부인지(startup/partner/expert/manager/department/…).
--   purpose='attachment'  : 첨부 카드 파일(기존 followup_report 등과 구분). purpose CHECK 확장.
--   삭제 정책            : 첨부 행은 직원(admin/manager)이 삭제 가능(기존엔 DELETE 정책 없음).
-- 비고: Storage 는 비공개 'reports' 버킷 재사용(직원 INSERT/SELECT/DELETE 정책은 0025/0026 존재).
--   SELECT/INSERT 정책도 기존 것을 그대로 사용(attachment 는 ai_source 가 아니므로 직원 조회 가능).
-- 재실행 안전(idempotent): IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- 1) 폴리모픽 연결 컬럼 ---------------------------------------------------------
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS entity_type VARCHAR(40);
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_uploaded_files_entity
  ON public.uploaded_files (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- 2) purpose 에 'attachment' 추가 (0026 의 단일컬럼 CHECK 이름 = uploaded_files_purpose_check) --
ALTER TABLE public.uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_purpose_check;
ALTER TABLE public.uploaded_files
  ADD CONSTRAINT uploaded_files_purpose_check
  CHECK (purpose IN (
    'followup_report', 'ai_source', 'profile_image', 'startup_logo', 'partner_doc', 'attachment'
  ));

-- 3) 첨부 행 삭제 정책(직원) ----------------------------------------------------
-- 기존 uploaded_files 에는 DELETE 정책이 없다(업로드는 소유자 INSERT, 영구). 첨부 카드는
-- 직원이 파일을 내릴 수 있어야 하므로 purpose='attachment' 한정으로 admin/manager DELETE 허용.
DROP POLICY IF EXISTS uploaded_files_delete_attachment ON public.uploaded_files;
CREATE POLICY uploaded_files_delete_attachment
ON public.uploaded_files FOR DELETE TO authenticated
USING (
    purpose = 'attachment'
    AND public.current_user_role() IN ('admin', 'manager')
);

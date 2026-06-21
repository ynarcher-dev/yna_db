import type { FilePurpose } from './database';

/**
 * 업로드 파일 메타데이터 (15_system_schema.md 4장 uploaded_files).
 * 비공개 Storage 에 올라간 모든 업무 파일의 접근 권한·다운로드 로그 기준점.
 */
export interface UploadedFile {
  id: string;
  ownerId: string | null;
  purpose: FilePurpose;
  /** AI 업로드 시 연계 세션 */
  sessionId: string | null;
  fileName: string;
  /** Storage 경로(사용자/세션별 prefix 포함). 서명 URL 재생성에 사용 */
  s3Key: string;
  contentType: string;
  fileSize: number;
  /** AI 임시파일 보존 만료(NULL=영구) */
  expiresAt: string | null;
  createdAt: string;
}

export interface UploadedFileRow {
  id: string;
  owner_id: string | null;
  purpose: FilePurpose;
  session_id: string | null;
  file_name: string;
  s3_key: string;
  content_type: string;
  file_size: number;
  expires_at: string | null;
  created_at: string;
}

export function mapUploadedFileRow(row: UploadedFileRow): UploadedFile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    purpose: row.purpose,
    sessionId: row.session_id,
    fileName: row.file_name,
    s3Key: row.s3_key,
    contentType: row.content_type,
    fileSize: row.file_size,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

/**
 * 첨부파일 카드(전 도메인 공통)가 다루는 엔티티 종류.
 * uploaded_files.entity_type 에 저장되며, 다운로드 로그 section_key=`${type}_attachments` 로 쓰인다.
 */
export type AttachmentEntityType =
  | 'startup'
  | 'partner'
  | 'expert'
  | 'manager'
  | 'department'
  | 'project'
  | 'fund'
  | 'business'
  | 'matching_program'
  | 'invest_archive';

/** 한 레코드에 붙은 첨부파일 1건 (uploaded_files purpose='attachment' 행). */
export interface EntityFile {
  /** uploaded_files.id — 다운로드 로그(file_download_logs.file_id) 연결용 */
  fileId: string;
  /** 원본 파일명 */
  name: string;
  /** Storage 경로(서명 URL 재발급용) */
  path: string;
  /** 바이트 단위 용량 */
  size: number;
  contentType: string;
  /** 업로더(managers.id). 없으면 null */
  ownerId: string | null;
  /** 종속 테스크(business_events·project_events.id). 일반 첨부는 null */
  eventId: string | null;
  createdAt: string;
}

export interface EntityFileRow {
  id: string;
  file_name: string;
  s3_key: string;
  file_size: number;
  content_type: string;
  owner_id: string | null;
  event_id: string | null;
  created_at: string;
}

export function mapEntityFileRow(row: EntityFileRow): EntityFile {
  return {
    fileId: row.id,
    name: row.file_name,
    path: row.s3_key,
    size: row.file_size,
    contentType: row.content_type,
    ownerId: row.owner_id,
    eventId: row.event_id ?? null,
    createdAt: row.created_at,
  };
}

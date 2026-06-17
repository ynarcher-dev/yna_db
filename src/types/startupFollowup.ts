import type { ReportType } from './database';

/**
 * 후속관리 첨부파일 1건 (startup_followups.files 항목).
 * 비공개 버킷 전환(0026) 이후 공개 URL 은 보관하지 않고, 다운로드 시점에
 * createSignedUrl 로 단기 URL 을 재발급한다. fileId 는 uploaded_files 행과 연결돼
 * 다운로드 로그(file_download_logs)의 file_id 로 사용된다.
 */
export interface FollowupFile {
  /** 원본 파일명 */
  name: string;
  /** Storage 경로 (서명 URL 재발급용) */
  path: string;
  /** uploaded_files.id (다운로드 로그 연계). 레거시 데이터는 없을 수 있음 */
  fileId?: string;
}

/** 스타트업 후속관리(보고/제출 이력) (6_startups.md startup_followups). */
export interface StartupFollowup {
  id: string;
  startupId: string;
  title: string;
  reportType: ReportType;
  /** 보고 대상 기간 (예: 2026-Q2, 2026) */
  reportingPeriod: string;
  /** 첨부 제출 파일(복수) */
  files: FollowupFile[];
  /** 업로드 코멘트. 없으면 빈 문자열 */
  comment: string;
  /** 제출 완료 여부(토글). 파일 업로드=제출 대기, 토글 ON=제출 완료 */
  isSubmitted: boolean;
  /** 제출(완료) 일시. 미완료면 빈 문자열 */
  submittedAt: string;
  createdAt: string;
  /** 최종 수정 시각 */
  updatedAt: string;
}

export interface StartupFollowupRow {
  id: string;
  startup_id: string;
  title: string;
  report_type: ReportType;
  reporting_period: string;
  files: FollowupFile[] | null;
  comment: string | null;
  is_submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapStartupFollowupRow(row: StartupFollowupRow): StartupFollowup {
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    reportType: row.report_type,
    reportingPeriod: row.reporting_period,
    files: row.files ?? [],
    comment: row.comment ?? '',
    isSubmitted: row.is_submitted,
    submittedAt: row.submitted_at ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

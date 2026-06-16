import type { ReportType } from './database';

/** 후속 보고 마일스톤 1건 (startup_followups.milestones 항목). */
export interface Milestone {
  title: string;
  done: boolean;
}

/** 스타트업 후속 보고/제출 이력 (6_startups.md startup_followups). */
export interface StartupFollowup {
  id: string;
  startupId: string;
  title: string;
  reportType: ReportType;
  /** 보고 대상 기간 (예: 2026-Q2, 2026) */
  reportingPeriod: string;
  /** 제출 기한 (YYYY-MM-DD) */
  dueDate: string;
  /** 제출 파일 URL. 없으면 빈 문자열 */
  fileUrl: string;
  isSubmitted: boolean;
  /** 제출 일시. 미제출이면 빈 문자열 */
  submittedAt: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface StartupFollowupRow {
  id: string;
  startup_id: string;
  title: string;
  report_type: ReportType;
  reporting_period: string;
  due_date: string;
  file_url: string | null;
  is_submitted: boolean;
  submitted_at: string | null;
  milestones: Milestone[] | null;
  created_at: string;
}

export function mapStartupFollowupRow(row: StartupFollowupRow): StartupFollowup {
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    reportType: row.report_type,
    reportingPeriod: row.reporting_period,
    dueDate: row.due_date,
    fileUrl: row.file_url ?? '',
    isSubmitted: row.is_submitted,
    submittedAt: row.submitted_at ?? '',
    milestones: row.milestones ?? [],
    createdAt: row.created_at,
  };
}

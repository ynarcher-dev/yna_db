import type { ProgramStartupStatus } from './database';

/** 프로그램 참여 스타트업 1건 (program_startups 조인, 7_programs.md). */
export interface ProgramStartup {
  /** 조인 행 id (상태변경/해제 시 사용) */
  id: string;
  startupId: string;
  startupName: string;
  /** 보육 상태 (지원/심사중/선정/수료/중도탈락) */
  status: ProgramStartupStatus;
  createdAt: string;
}

export interface ProgramStartupRow {
  id: string;
  startup_id: string;
  status: ProgramStartupStatus;
  created_at: string;
  startup: { name: string } | null;
}

export function mapProgramStartupRow(row: ProgramStartupRow): ProgramStartup {
  return {
    id: row.id,
    startupId: row.startup_id,
    startupName: row.startup?.name ?? '',
    status: row.status,
    createdAt: row.created_at,
  };
}

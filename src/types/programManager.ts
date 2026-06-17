import type { ProgramManagerRole } from './database';

/** 프로그램 운영 심사역 1명 (program_managers 조인, 7_programs.md). 역할 lead/operator. */
export interface ProgramManager {
  /** 조인 행 id (해제/역할변경 시 사용) */
  id: string;
  managerId: string;
  managerName: string;
  role: ProgramManagerRole;
  createdAt: string;
}

export interface ProgramManagerRow {
  id: string;
  manager_id: string;
  role: ProgramManagerRole;
  created_at: string;
  manager: { name: string } | null;
}

export function mapProgramManagerRow(row: ProgramManagerRow): ProgramManager {
  return {
    id: row.id,
    managerId: row.manager_id,
    managerName: row.manager?.name ?? '',
    role: row.role,
    createdAt: row.created_at,
  };
}

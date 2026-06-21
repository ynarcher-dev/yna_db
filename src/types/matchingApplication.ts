import type { MatchingApplicationStatus } from '@/types/database';

/**
 * 매칭 신청/연계 1건 (matching_applications 조인 행 + 스타트업·심사역 임베드 이름).
 * 한 프로그램에 신청/추천된 스타트업과 담당 심사역, 진행 상태·일자·매칭 지원금을 표현한다.
 */
export interface MatchingApplication {
  /** 매칭 이력(조인 행) id */
  id: string;
  programId: string;
  startupId: string;
  /** 스타트업명 (임베드). 삭제 시 빈 문자열 */
  startupName: string;
  managerId: string;
  /** 담당 심사역 이름 (임베드). 없거나 삭제 시 빈 문자열 */
  managerName: string;
  status: MatchingApplicationStatus;
  /** 신청일 (YYYY-MM-DD) */
  applyDate: string;
  /** 선정일 (선정 시). 없으면 빈 문자열 */
  selectionDate: string;
  /** 최종 매칭 지원금 규모 (원). 없으면 0 */
  matchingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MatchingApplicationRow {
  id: string;
  program_id: string;
  startup_id: string;
  manager_id: string | null;
  status: MatchingApplicationStatus;
  apply_date: string;
  selection_date: string | null;
  matching_amount: number | string | null;
  created_at: string;
  updated_at: string;
  startup: { name: string } | null;
  manager: { name: string } | null;
}

export function mapMatchingApplicationRow(row: MatchingApplicationRow): MatchingApplication {
  return {
    id: row.id,
    programId: row.program_id,
    startupId: row.startup_id,
    startupName: row.startup?.name ?? '',
    managerId: row.manager_id ?? '',
    managerName: row.manager?.name ?? '',
    status: row.status,
    applyDate: row.apply_date,
    selectionDate: row.selection_date ?? '',
    matchingAmount: Number(row.matching_amount) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

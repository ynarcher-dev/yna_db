/** Capital Call 1차수 (capital_calls 행, 8_funds.md). */
export interface CapitalCall {
  id: string;
  /** 캐피탈 콜 차수 (1, 2, 3 …) */
  callRound: number;
  /** 요청액 (원) */
  requestedAmount: number;
  /** 요청일 (YYYY-MM-DD) */
  requestedDate: string;
  /** 납입 완료 여부 */
  isCompleted: boolean;
  /** 납입 완료일 (YYYY-MM-DD). 미완료면 빈 문자열 */
  completedDate: string;
  createdAt: string;
}

export interface CapitalCallRow {
  id: string;
  fund_id: string;
  call_round: number;
  requested_amount: number | string;
  requested_date: string;
  is_completed: boolean;
  completed_date: string | null;
  created_at: string;
}

export function mapCapitalCallRow(row: CapitalCallRow): CapitalCall {
  return {
    id: row.id,
    callRound: row.call_round,
    requestedAmount: Number(row.requested_amount) || 0,
    requestedDate: row.requested_date,
    isCompleted: row.is_completed,
    completedDate: row.completed_date ?? '',
    createdAt: row.created_at,
  };
}

/** 펀드 투자 집행 1건 (fund_investments 조인, 8_funds.md). */
export interface FundInvestment {
  id: string;
  startupId: string;
  /** 피투자 스타트업 이름 (임베드). 없으면 빈 문자열 */
  startupName: string;
  /** 실제 출자액 (원) */
  investmentAmount: number;
  /** 취득 지분율 (%) */
  sharePercentage: number;
  /** 투자일 (YYYY-MM-DD) */
  investmentDate: string;
  createdAt: string;
}

export interface FundInvestmentRow {
  id: string;
  fund_id: string;
  startup_id: string;
  investment_amount: number | string;
  share_percentage: number | string;
  investment_date: string;
  created_at: string;
  startup: { name: string } | null;
}

export function mapFundInvestmentRow(row: FundInvestmentRow): FundInvestment {
  return {
    id: row.id,
    startupId: row.startup_id,
    startupName: row.startup?.name ?? '',
    investmentAmount: Number(row.investment_amount) || 0,
    sharePercentage: Number(row.share_percentage) || 0,
    investmentDate: row.investment_date,
    createdAt: row.created_at,
  };
}

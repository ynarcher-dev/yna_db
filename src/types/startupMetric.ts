/** 스타트업 성장 지표 (연도별 스냅샷, 6_startups.md startup_metrics). */
export interface StartupMetric {
  id: string;
  startupId: string;
  /** 기록 기준일 (YYYY-MM-DD, 회계연도 말일 등) */
  recordDate: string;
  // [재무현황]
  /** 매출액 (원화) */
  revenue: number;
  /** 영업이익 (원화, 음수 가능) */
  operatingProfit: number;
  /** 당기순이익 (원화, 음수 가능) */
  netIncome: number;
  /** 자산 (원화) */
  assets: number;
  /** 부채 (원화) */
  liabilities: number;
  /** 자본 (원화, 자본잠식 시 음수 가능) */
  equity: number;
  // [고용]
  /** 고용 인원수 */
  employeeCount: number;
  // [투자현황]
  /** 기업 가치 (원화) */
  valuation: number;
  /** 투자유치액 (원화) */
  fundingAmount: number;
  /** 투자 라운드 (예: Seed, Series A). 없으면 빈 문자열 */
  fundingRound: string;
  /** 투자자명. 없으면 빈 문자열 */
  investor: string;
  /** 투자자 구분 (internal=자사 / external=외부). 없으면 빈 문자열 */
  investorType: '' | 'internal' | 'external';
  /** 자사(internal) 투자 재원 펀드 id. 없으면 빈 문자열 */
  fundId: string;
  /** 재원 펀드명 (funds 임베드). 없으면 빈 문자열 */
  fundName: string;
  /** 비고. 없으면 빈 문자열 */
  remarks: string;
  createdAt: string;
  /** 최종 수정 시각 */
  updatedAt: string;
}

export interface StartupMetricRow {
  id: string;
  startup_id: string;
  record_date: string;
  revenue: number | string;
  operating_profit: number | string;
  net_income: number | string;
  assets: number | string;
  liabilities: number | string;
  equity: number | string;
  employee_count: number;
  valuation: number | string;
  funding_amount: number | string;
  funding_round: string | null;
  investor: string | null;
  investor_type: string | null;
  fund_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  fund: { name: string } | null;
}

export function mapStartupMetricRow(row: StartupMetricRow): StartupMetric {
  return {
    id: row.id,
    startupId: row.startup_id,
    recordDate: row.record_date,
    revenue: Number(row.revenue),
    operatingProfit: Number(row.operating_profit),
    netIncome: Number(row.net_income),
    assets: Number(row.assets),
    liabilities: Number(row.liabilities),
    equity: Number(row.equity),
    employeeCount: row.employee_count,
    valuation: Number(row.valuation),
    fundingAmount: Number(row.funding_amount),
    fundingRound: row.funding_round ?? '',
    investor: row.investor ?? '',
    investorType: (row.investor_type as '' | 'internal' | 'external') ?? '',
    fundId: row.fund_id ?? '',
    fundName: row.fund?.name ?? '',
    remarks: row.remarks ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

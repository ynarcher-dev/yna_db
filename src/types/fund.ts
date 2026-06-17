import { normalizeFundSections, type FundSections } from '@/lib/fundSections';

/** LP(출자자) 1구좌 (funds.lp_composition 항목). DB jsonb 키는 snake_case(lp_name). */
export interface LpEntry {
  /** LP 이름 (예: 모태펀드) */
  lpName: string;
  /** 출자 좌수/금액 */
  shares: number;
  /** 지분율 (%) */
  percentage: number;
}

interface LpEntryRaw {
  lp_name?: string;
  shares?: number | string;
  percentage?: number | string;
}

/** 펀드/투자조합 (camelCase 화면 모델, 8_funds.md). */
export interface Fund {
  id: string;
  name: string;
  /** 결성 총액 (원) */
  totalAmount: number;
  /** 투자 대상 기간 (예: 2026-01 ~ 2030-12) */
  investingPeriod: string;
  /** 미소진 잔액 (원) */
  balance: number;
  /** LP 구성 및 지분율 */
  lpComposition: LpEntry[];
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: FundSections;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 책임자(created_by, 등록 Admin) id. 없으면 빈 문자열 */
  createdById: string;
  /** 책임자 이름. 없으면 빈 문자열 */
  authorName: string;
}

export interface FundRow {
  id: string;
  name: string;
  total_amount: number | string;
  investing_period: string;
  balance: number | string;
  lp_composition: LpEntryRaw[] | null;
  sections: Partial<Record<string, boolean>> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author: { name: string } | null;
}

export function mapFundRow(row: FundRow): Fund {
  return {
    id: row.id,
    name: row.name,
    totalAmount: Number(row.total_amount) || 0,
    investingPeriod: row.investing_period,
    balance: Number(row.balance) || 0,
    lpComposition: (row.lp_composition ?? []).map((e) => ({
      lpName: e.lp_name ?? '',
      shares: Number(e.shares) || 0,
      percentage: Number(e.percentage) || 0,
    })),
    sections: normalizeFundSections(row.sections),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.created_by ?? '',
    authorName: row.author?.name ?? '',
  };
}

/** 소진율(%) = (결성 총액 - 잔액) / 총액 × 100. 총액 0이면 0. */
export function fundExhaustionRate(fund: Pick<Fund, 'totalAmount' | 'balance'>): number {
  if (fund.totalAmount <= 0) return 0;
  return ((fund.totalAmount - fund.balance) / fund.totalAmount) * 100;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapFundInvestmentRow,
  type FundInvestment,
  type FundInvestmentRow,
} from '@/types/fundInvestment';
import type { FundInvestmentInput } from '@/schemas/fundInvestment';

/**
 * 펀드 투자 집행 데이터 훅 (fund_investments, 8_funds.md). Admin 전용 쓰기.
 * 펀드별 투자일 내림차순. 피투자 스타트업 이름 임베드. 실제 INSERT/UPDATE/DELETE.
 */
const TABLE = 'fund_investments';
const SELECT_WITH_STARTUP = '*, startup:startups(name)';

export function useFundInvestments(fundId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, fundId],
    enabled: Boolean(fundId),
    queryFn: async (): Promise<FundInvestment[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_STARTUP)
        .eq('fund_id', fundId as string)
        .order('investment_date', { ascending: false });
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return (data as unknown as FundInvestmentRow[]).map(mapFundInvestmentRow);
    },
  });
  return { ...query, investments: query.data ?? [] };
}

function toRow(fundId: string, input: FundInvestmentInput) {
  return {
    fund_id: fundId,
    startup_id: input.startupId,
    investment_amount: input.investmentAmount,
    share_percentage: input.sharePercentage,
    investment_date: input.investmentDate,
  };
}

export function useFundInvestmentMutations(fundId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, fundId] });

  const create = useMutation({
    mutationFn: async (input: FundInvestmentInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(fundId, input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FundInvestmentInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(fundId, input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

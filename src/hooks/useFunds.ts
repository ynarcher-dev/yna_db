import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapFundRow, type Fund, type FundRow } from '@/types/fund';
import type { FundInput, LpCompositionFormInput } from '@/schemas/fund';

/**
 * 펀드 데이터 훅 (8_funds.md / 17_conventions.md 2·3장). Admin 전용 도메인.
 * funds↔managers 관계는 created_by 하나뿐이라 책임자 임베드는 제약명 없이도 모호하지 않지만,
 * 공통 규약(PATTERNS 10)에 맞춰 제약명을 명시한다.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'funds';
const SELECT_WITH_AUTHOR =
  '*, author:managers!funds_created_by_fkey(name), fund_managers(manager:managers(name))';

/** id+name 옵션 목록 (Select 용, 예: 스타트업 자사 투자 재원 펀드). 미삭제 펀드 전체. */
export function useFundOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((f) => ({ value: f.id as string, label: f.name as string }));
    },
  });
}

interface FundsListArgs {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useFundsList(args: FundsListArgs) {
  const query = useListQuery<FundRow>({
    table: TABLE,
    columns: SELECT_WITH_AUTHOR,
    searchColumns: ['name', 'investing_period'],
    search: args.search,
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    funds: (query.data?.rows ?? []).map(mapFundRow),
    total: query.data?.total ?? 0,
  };
}

export function useFund(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Fund> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_AUTHOR)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapFundRow(data as FundRow);
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). LP 구성은 별도 변이에서 처리. */
function toRow(input: FundInput) {
  return {
    name: input.name.trim(),
    total_amount: input.totalAmount,
    investing_period: input.investingPeriod.trim(),
    balance: input.balance,
    sections: input.sections,
  };
}

export function useFundMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: FundInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FundInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // LP 구성(jsonb)만 갱신 (LP 카드 전용). DB jsonb 키는 snake_case 로 저장.
  const updateLpComposition = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: LpCompositionFormInput }) => {
      const lp_composition = input.lpComposition.map((e) => ({
        lp_name: e.lpName.trim(),
        shares: e.shares,
        percentage: e.percentage,
      }));
      const { error } = await supabase.from(TABLE).update({ lp_composition }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 (RLS 상 Admin 만 deleted_at 설정 가능)
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, updateLpComposition, remove };
}

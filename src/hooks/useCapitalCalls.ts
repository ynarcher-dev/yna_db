import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapCapitalCallRow, type CapitalCall, type CapitalCallRow } from '@/types/capitalCall';
import type { CapitalCallInput } from '@/schemas/capitalCall';

/**
 * Capital Call 데이터 훅 (capital_calls, 8_funds.md). Admin 전용 쓰기.
 * 펀드별 차수 오름차순. deleted_at 없는 이력이라 실제 INSERT/UPDATE/DELETE.
 */
const TABLE = 'capital_calls';

export function useCapitalCalls(fundId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, fundId],
    enabled: Boolean(fundId),
    queryFn: async (): Promise<CapitalCall[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('fund_id', fundId as string)
        .order('call_round', { ascending: true });
      if (error) throw error;
      return (data as CapitalCallRow[]).map(mapCapitalCallRow);
    },
  });
  return { ...query, calls: query.data ?? [] };
}

function toRow(fundId: string, input: CapitalCallInput) {
  return {
    fund_id: fundId,
    call_round: input.callRound,
    requested_amount: input.requestedAmount,
    requested_date: input.requestedDate,
    is_completed: input.isCompleted,
    completed_date: input.isCompleted && input.completedDate ? input.completedDate : null,
  };
}

export function useCapitalCallMutations(fundId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, fundId] });

  const create = useMutation({
    mutationFn: async (input: CapitalCallInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(fundId, input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CapitalCallInput }) => {
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

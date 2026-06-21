import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapMatchingApplicationRow,
  type MatchingApplication,
  type MatchingApplicationRow,
} from '@/types/matchingApplication';
import type { MatchingApplicationInput } from '@/schemas/matchingApplication';
import type { MatchingApplicationStatus } from '@/types/database';

/**
 * 매칭 신청/연계(다대다) 데이터 훅 (matching_applications).
 * 한 프로그램에 신청/추천된 스타트업과 담당 심사역·진행 상태를 추가/수정/상태변경/해제한다.
 * 실제 INSERT/UPDATE/DELETE(소프트삭제 없음). 스타트업·심사역 이름은 임베드.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'matching_applications';
const SELECT_WITH_RELATIONS = '*, startup:startups(name), manager:managers(name)';

export function useMatchingApplications(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<MatchingApplication[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('program_id', programId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as MatchingApplicationRow[]).map(mapMatchingApplicationRow);
    },
  });
  return { ...query, applications: query.data ?? [] };
}

function toRow(input: MatchingApplicationInput) {
  return {
    startup_id: input.startupId,
    manager_id: input.managerId,
    status: input.status,
    apply_date: input.applyDate,
    selection_date: input.selectionDate ? input.selectionDate : null,
    matching_amount: input.matchingAmount || null,
  };
}

export function useMatchingApplicationMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, programId] });

  const add = useMutation({
    mutationFn: async (input: MatchingApplicationInput) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, ...toRow(input) });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MatchingApplicationInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 진행 상태만 인라인 변경(테이블에서 바로 추천/선정/탈락 전환).
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MatchingApplicationStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
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

  return { add, update, updateStatus, remove };
}

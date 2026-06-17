import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapProgramManagerRow,
  type ProgramManager,
  type ProgramManagerRow,
} from '@/types/programManager';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 프로그램 운영 심사역(다대다) 데이터 훅 (program_managers, role lead/operator).
 * 책임자(created_by)와 별개로 운영총괄/운영담당 심사역을 배정/역할변경/해제한다.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'program_managers';

export function useProgramManagers(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramManager[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, manager_id, role, created_at, manager:managers(name)')
        .eq('program_id', programId as string)
        // 운영총괄(lead) 먼저, 그다음 배정순
        .order('role', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return (data as unknown as ProgramManagerRow[]).map(mapProgramManagerRow);
    },
  });
  return { ...query, managers: query.data ?? [] };
}

export function useProgramManagerMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, programId] });

  const add = useMutation({
    mutationFn: async ({ managerId, role }: { managerId: string; role: ProgramManagerRole }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, manager_id: managerId, role });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: ProgramManagerRole }) => {
      const { error } = await supabase.from(TABLE).update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, updateRole, remove };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapProgramStartupRow,
  type ProgramStartup,
  type ProgramStartupRow,
} from '@/types/programStartup';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 프로그램 참여 스타트업(다대다) 데이터 훅 (program_startups, status).
 * 배치 기수에 참여한 스타트업을 추가/상태변경/해제한다. 실제 INSERT/UPDATE/DELETE.
 */
const TABLE = 'program_startups';

export function useProgramStartups(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramStartup[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, startup_id, status, created_at, startup:startups(name)')
        .eq('program_id', programId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return (data as unknown as ProgramStartupRow[]).map(mapProgramStartupRow);
    },
  });
  return { ...query, participants: query.data ?? [] };
}

export function useProgramStartupMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, programId] });

  const add = useMutation({
    mutationFn: async ({
      startupId,
      status,
    }: {
      startupId: string;
      status: ProgramStartupStatus;
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, startup_id: startupId, status });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProgramStartupStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
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

  return { add, updateStatus, remove };
}

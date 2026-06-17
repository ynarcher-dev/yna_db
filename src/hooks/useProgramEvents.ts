import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapProgramEventRow, type ProgramEvent, type ProgramEventRow } from '@/types/programEvent';
import type { ProgramEventInput } from '@/schemas/programEvent';

/**
 * 프로그램 세부 일정 데이터 훅 (program_events, 7_programs.md).
 * 추가/수정/삭제 시 0003 동기화 트리거가 system_events(대시보드 다가오는 일정)도 함께 갱신한다.
 */
const TABLE = 'program_events';

export function useProgramEvents(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramEvent[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('program_id', programId as string)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data as ProgramEventRow[]).map(mapProgramEventRow);
    },
  });
  return { ...query, events: query.data ?? [] };
}

function toRow(programId: string, input: ProgramEventInput) {
  return {
    program_id: programId,
    title: input.title.trim(),
    event_type: input.eventType,
    event_date: input.eventDate,
    description: input.description ? input.description.trim() : null,
  };
}

export function useProgramEventMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, programId] });

  const create = useMutation({
    mutationFn: async (input: ProgramEventInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(programId, input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProgramEventInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(programId, input)).eq('id', id);
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import {
  mapMatchingProgramRow,
  type MatchingProgram,
  type MatchingProgramRow,
} from '@/types/matchingProgram';
import type { MatchingProgramInput } from '@/schemas/matchingProgram';

/**
 * 매칭 프로그램 데이터 훅 (21_matching_programs.md / 17_conventions.md 2·3장).
 * partners 패턴 복제 — 목록(useListQuery)·단건·변이(소프트 삭제). 책임자명은 created_by FK 임베드.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'matching_programs';
const SELECT_WITH_RELATIONS = '*, author:managers!matching_programs_created_by_fkey(name)';

interface MatchingProgramsListArgs {
  search: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useMatchingProgramsList(args: MatchingProgramsListArgs) {
  const query = useListQuery<MatchingProgramRow>({
    table: TABLE,
    columns: SELECT_WITH_RELATIONS,
    searchColumns: ['name', 'agency'],
    search: args.search,
    filters: { status: args.status },
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    programs: (query.data?.rows ?? []).map(mapMatchingProgramRow),
    total: query.data?.total ?? 0,
  };
}

export function useMatchingProgram(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<MatchingProgram> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapMatchingProgramRow(data as MatchingProgramRow);
    },
  });
}

function toRow(input: MatchingProgramInput) {
  return {
    name: input.name.trim(),
    agency: input.agency.trim(),
    year: input.year,
    budget: input.budget,
    status: input.status,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useMatchingProgramMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: MatchingProgramInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from(TABLE).insert(toRow(input)).select('id').single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MatchingProgramInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 — RLS 상 Admin 만 deleted_at 설정 가능(21.4 삭제=Admin).
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

  return { create, update, remove };
}

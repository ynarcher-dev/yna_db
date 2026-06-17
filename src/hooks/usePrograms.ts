import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapProgramRow, type Program, type ProgramRow } from '@/types/program';
import type { ProgramInput } from '@/schemas/program';

/**
 * 프로그램 데이터 훅 (7_programs.md / 17_conventions.md 2·3장).
 * programs↔managers 관계가 2개(created_by=책임자, program_managers 조인)라 책임자 임베드는
 * FK 제약명을 명시한다(PATTERNS 10). 운영 심사역은 program_managers 다대다 임베드.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'programs';
const SELECT_WITH_RELATIONS =
  '*, author:managers!programs_created_by_fkey(name), program_managers(manager:managers(name))';

interface ProgramsListArgs {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useProgramsList(args: ProgramsListArgs) {
  const query = useListQuery<ProgramRow>({
    table: TABLE,
    columns: SELECT_WITH_RELATIONS,
    searchColumns: ['name'],
    search: args.search,
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    programs: (query.data?.rows ?? []).map(mapProgramRow),
    total: query.data?.total ?? 0,
  };
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Program> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapProgramRow(data as ProgramRow);
    },
  });
}

/** id+name 옵션 목록 (Select 용, 예: 스타트업 상세에서 참여 프로그램 매핑). 미삭제 전체. */
export function useProgramOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, generation')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        value: p.id as string,
        label: `${p.name as string} (${p.generation as number}기)`,
      }));
    },
  });
}

function toRow(input: ProgramInput) {
  return {
    name: input.name.trim(),
    generation: input.generation,
    budget: input.budget,
    start_date: input.startDate,
    end_date: input.endDate,
    recruitment_deadline: input.recruitmentDeadline ? input.recruitmentDeadline : null,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useProgramMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  // 생성 후 새 id 를 반환한다(.select) — 역방향 화면에서 "생성과 동시에 매핑"에 쓰인다.
  const create = useMutation({
    mutationFn: async (input: ProgramInput): Promise<{ id: string }> => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(input))
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProgramInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 — RLS 상 책임자(created_by) 또는 관리자만 deleted_at 설정 가능.
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

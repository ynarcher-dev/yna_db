import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapDepartmentRow, type Department, type DepartmentRow } from '@/types/department';
import type { DepartmentInput } from '@/schemas/department';

/**
 * 소속(부서) 데이터 훅 (11_departments.md / 17_conventions.md 2·3장).
 * 협력사(usePartners) 패턴을 그대로 복제한다. 작성/수정/삭제는 RLS·화면 양쪽에서
 * Admin 전용으로 제한된다. 변이는 raw 에러를 전파해 호출부가 토스트로 피드백한다.
 */
const TABLE = 'departments';
// departments→managers FK 가 2개(leader_id/created_by)이므로 제약명으로 작성자만 명시 임베드
const SELECT_WITH_AUTHOR = '*, author:managers!departments_created_by_fkey(name)';

interface DepartmentsListArgs {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useDepartmentsList(args: DepartmentsListArgs) {
  const query = useListQuery<DepartmentRow>({
    table: TABLE,
    columns: SELECT_WITH_AUTHOR,
    searchColumns: ['name', 'description'],
    search: args.search,
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    departments: (query.data?.rows ?? []).map(mapDepartmentRow),
    total: query.data?.total ?? 0,
  };
}

/**
 * 부서 Select 옵션 (id·name). 다른 도메인(심사역 소속 지정 등)의 드롭다운에서 재사용.
 * 미삭제 부서를 이름순으로 가져온다.
 */
export function useDepartmentOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d) => ({ value: d.id as string, label: d.name as string }));
    },
  });
}

export function useDepartment(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Department> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_AUTHOR)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapDepartmentRow(data as DepartmentRow);
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). 빈 설립일/설명은 NULL 저장. */
function toRow(input: DepartmentInput) {
  return {
    name: input.name.trim(),
    established_at: input.establishedAt ? input.establishedAt : null,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useDepartmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DepartmentInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 (RLS 상 Admin 만 가능)
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapBusinessRow, type Business, type BusinessRow } from '@/types/business';
import type { BusinessInput } from '@/schemas/business';

/**
 * 사업 데이터 훅 (7_businesses.md / 17_conventions.md 2·3장).
 * businesses↔managers 관계가 2개(created_by=책임자, business_managers 조인)라 책임자 임베드는
 * FK 제약명을 명시한다(PATTERNS 10). 운영 심사역은 business_managers 다대다 임베드.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'businesses';
const SELECT_WITH_RELATIONS =
  '*, author:managers!businesses_created_by_fkey(name), business_managers(manager:managers(name))';

interface BusinessesListArgs {
  search: string;
  status?: string;
  /** 기간 조회 범위(시작~종료 겹침). YYYY-MM-DD, 빈 값이면 미적용 */
  dateFrom?: string;
  dateTo?: string;
  /** 매출·이익 범위(원 단위). 미지정 끝점은 미적용 */
  revenueMin?: number;
  revenueMax?: number;
  profitMin?: number;
  profitMax?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useBusinessesList(args: BusinessesListArgs) {
  const query = useListQuery<BusinessRow>({
    table: TABLE,
    columns: SELECT_WITH_RELATIONS,
    searchColumns: ['name'],
    search: args.search,
    filters: { status: args.status },
    dateOverlap: { startColumn: 'start_date', endColumn: 'end_date', from: args.dateFrom, to: args.dateTo },
    numericRanges: [
      { column: 'revenue', min: args.revenueMin, max: args.revenueMax },
      { column: 'profit', min: args.profitMin, max: args.profitMax },
    ],
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    businesses: (query.data?.rows ?? []).map(mapBusinessRow),
    total: query.data?.total ?? 0,
  };
}

export function useBusiness(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Business> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapBusinessRow(data as BusinessRow);
    },
  });
}

/** id+name 옵션 목록 (Select 용, 예: 스타트업 상세에서 참여 사업 매핑). 미삭제 전체. */
export function useBusinessOptions() {
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

function toRow(input: BusinessInput) {
  return {
    name: input.name.trim(),
    status: input.status,
    generation: input.generation,
    budget: input.budget,
    revenue: input.revenue,
    profit: input.profit,
    start_date: input.startDate,
    end_date: input.endDate,
    recruitment_deadline: input.recruitmentDeadline ? input.recruitmentDeadline : null,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useBusinessMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  // 생성 후 새 id 를 반환한다(.select) — 역방향 화면에서 "생성과 동시에 매핑"에 쓰인다.
  const create = useMutation({
    mutationFn: async (input: BusinessInput): Promise<{ id: string }> => {
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
    mutationFn: async ({ id, input }: { id: string; input: BusinessInput }) => {
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

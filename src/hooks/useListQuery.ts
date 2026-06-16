import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 목록 공통 데이터 훅 (17_conventions.md 2장).
 * - 소프트 딜리트 제외(deleted_at IS NULL), 서버 검색(ilike)·필터(eq/in)·정렬(order)·
 *   페이지네이션(range) + 총건수(count: exact)를 표준화한다.
 * - 페이지 전환 시 이전 데이터를 유지(keepPreviousData)해 깜빡임을 줄인다.
 */
export interface ListQueryParams {
  table: string;
  columns?: string;
  /** ilike OR 검색 대상 컬럼 (예: ['name', 'contact_person']) */
  searchColumns?: string[];
  search?: string;
  /** eq(단일 값) / in(배열) 필터. snake_case 컬럼명 키 사용 */
  filters?: Record<string, string | string[] | undefined | null>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  /** deleted_at IS NULL 자동 적용 (기본 true) */
  softDelete?: boolean;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
}

export function useListQuery<T>(params: ListQueryParams) {
  const {
    table,
    columns = '*',
    searchColumns = [],
    search = '',
    filters = {},
    sortBy,
    sortOrder,
    page,
    pageSize,
    softDelete = true,
  } = params;

  return useQuery({
    queryKey: [table, { columns, search, filters, sortBy, sortOrder, page, pageSize }],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ListResult<T>> => {
      let query = supabase.from(table).select(columns, { count: 'exact' });
      if (softDelete) query = query.is('deleted_at', null);

      const term = search.trim();
      if (term && searchColumns.length) {
        query = query.or(searchColumns.map((c) => `${c}.ilike.%${term}%`).join(','));
      }

      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          if (value.length) query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      const from = (page - 1) * pageSize;
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      return { rows: (data ?? []) as T[], total: count ?? 0 };
    },
  });
}

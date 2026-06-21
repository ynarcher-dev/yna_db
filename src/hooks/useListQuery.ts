import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 목록 공통 데이터 훅 (17_conventions.md 2장).
 * - 소프트 딜리트 제외(deleted_at IS NULL), 서버 검색(ilike)·필터(eq/in)·정렬(order)·
 *   페이지네이션(range) + 총건수(count: exact)를 표준화한다.
 * - 페이지 전환 시 이전 데이터를 유지(keepPreviousData)해 깜빡임을 줄인다.
 */
/**
 * 기간(시작~종료) 범위 겹침 조회. [startColumn, endColumn] 구간이 [from, to] 와 겹치는 행만 통과.
 * 겹침 = (시작 <= to) AND (종료 >= from). 종료가 NULL(미정·진행중)이면 열린 구간으로 보고 포함한다.
 */
export interface DateOverlapFilter {
  startColumn: string;
  endColumn: string;
  from?: string;
  to?: string;
}

/** 숫자 컬럼 범위(min~max) 조회. min/max 는 컬럼과 동일 단위(원). 둘 다 없으면 미적용. */
export interface NumericRangeFilter {
  column: string;
  min?: number;
  max?: number;
}

export interface ListQueryParams {
  table: string;
  columns?: string;
  /** ilike OR 검색 대상 컬럼 (예: ['name', 'contact_person']) */
  searchColumns?: string[];
  search?: string;
  /** eq(단일 값) / in(배열) 필터. snake_case 컬럼명 키 사용 */
  filters?: Record<string, string | string[] | undefined | null>;
  /** 기간 범위 겹침 조회(선택). from/to 둘 다 없으면 미적용. */
  dateOverlap?: DateOverlapFilter;
  /** 숫자 컬럼 범위(gte/lte) 조회 목록(선택). 예: 매출·이익. */
  numericRanges?: NumericRangeFilter[];
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
    dateOverlap,
    numericRanges = [],
    sortBy,
    sortOrder,
    page,
    pageSize,
    softDelete = true,
  } = params;

  return useQuery({
    queryKey: [
      table,
      { columns, search, filters, dateOverlap, numericRanges, sortBy, sortOrder, page, pageSize },
    ],
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

      if (dateOverlap?.to) query = query.lte(dateOverlap.startColumn, dateOverlap.to);
      if (dateOverlap?.from) {
        // 종료 >= from 또는 종료 NULL(열린 구간). NULL 행도 겹침으로 포함한다.
        query = query.or(`${dateOverlap.endColumn}.gte.${dateOverlap.from},${dateOverlap.endColumn}.is.null`);
      }

      for (const r of numericRanges) {
        if (typeof r.min === 'number') query = query.gte(r.column, r.min);
        if (typeof r.max === 'number') query = query.lte(r.column, r.max);
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

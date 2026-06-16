import { useSearchParams } from 'react-router-dom';

/**
 * 목록 화면의 검색·필터·정렬·페이지 상태를 URL 쿼리스트링에 직렬화한다
 * (17_conventions.md 2장 — 공유·새로고침 가능). 모든 도메인 목록이 재사용한다.
 */
export const DEFAULT_PAGE_SIZE = 20;

export interface ListParamsConfig {
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  /** URL 에 직렬화할 필터 키 목록 (예: ['partner_type']) */
  filterKeys?: string[];
}

// 기본 정렬: 최신순(created_at desc) — 최신글이 맨 위. No.는 전체건수 기준 내림(최초글=1번) (PATTERNS.md 3장)
export function useListParams(config: ListParamsConfig = {}) {
  const { defaultSortBy = 'created_at', defaultSortOrder = 'desc', filterKeys = [] } = config;
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sort') ?? defaultSortBy;
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || defaultSortOrder;
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const filters: Record<string, string> = {};
  for (const key of filterKeys) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next, { replace: true });
  }

  return {
    search,
    sortBy,
    sortOrder,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    filters,
    /** 검색어 변경 시 1페이지로 리셋 */
    setSearch: (value: string) =>
      update((n) => {
        if (value) n.set('q', value);
        else n.delete('q');
        n.delete('page');
      }),
    setFilter: (key: string, value?: string) =>
      update((n) => {
        if (value) n.set(key, value);
        else n.delete(key);
        n.delete('page');
      }),
    setSort: (column: string, order: 'asc' | 'desc') =>
      update((n) => {
        n.set('sort', column);
        n.set('order', order);
      }),
    setPage: (value: number) => update((n) => n.set('page', String(value))),
  };
}

import { useSearchParams } from 'react-router-dom';

/**
 * 목록 화면의 검색·필터·정렬·페이지 상태를 URL 쿼리스트링에 직렬화한다
 * (17_conventions.md 2장 — 공유·새로고침 가능). 모든 도메인 목록이 재사용한다.
 */
export const DEFAULT_PAGE_SIZE = 20;

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface ListParamsConfig {
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  /** URL 에 직렬화할 필터 키 목록 (예: ['partner_type']) */
  filterKeys?: string[];
  /** URL 에 직렬화할 숫자 범위 키 목록 (예: ['revenue', 'profit']) → `${key}_min`/`${key}_max` */
  rangeKeys?: string[];
}

// 기본 정렬: 최신순(created_at desc) — 최신글이 맨 위. No.는 전체건수 기준 내림(최초글=1번) (PATTERNS.md 3장)
export function useListParams(config: ListParamsConfig = {}) {
  const {
    defaultSortBy = 'created_at',
    defaultSortOrder = 'desc',
    filterKeys = [],
    rangeKeys = [],
  } = config;
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sort') ?? defaultSortBy;
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || defaultSortOrder;
  const page = Number(searchParams.get('page') ?? '1') || 1;
  // 기간 조회(시작~종료 범위 겹침). 둘 다 빈 문자열이면 미적용 (YYYY-MM-DD).
  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';

  const filters: Record<string, string> = {};
  for (const key of filterKeys) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }

  // 숫자 범위 (min~max). URL 키는 `${key}_min` / `${key}_max`.
  const ranges: Record<string, NumberRange> = {};
  for (const key of rangeKeys) {
    const min = searchParams.get(`${key}_min`);
    const max = searchParams.get(`${key}_max`);
    ranges[key] = {
      min: min !== null && min !== '' ? Number(min) : undefined,
      max: max !== null && max !== '' ? Number(max) : undefined,
    };
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
    ranges,
    dateFrom,
    dateTo,
    /** 숫자 범위 설정. 빈/NaN 값이면 해당 끝점 제거. 변경 시 1페이지로 리셋 */
    setRange: (key: string, min?: number, max?: number) =>
      update((n) => {
        if (typeof min === 'number' && !Number.isNaN(min)) n.set(`${key}_min`, String(min));
        else n.delete(`${key}_min`);
        if (typeof max === 'number' && !Number.isNaN(max)) n.set(`${key}_max`, String(max));
        else n.delete(`${key}_max`);
        n.delete('page');
      }),
    /** 기간 조회 범위 설정. 빈 값이면 해당 끝점 제거. 변경 시 1페이지로 리셋 */
    setDateRange: (from?: string, to?: string) =>
      update((n) => {
        if (from) n.set('from', from);
        else n.delete('from');
        if (to) n.set('to', to);
        else n.delete('to');
        n.delete('page');
      }),
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

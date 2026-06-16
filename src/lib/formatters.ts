import dayjs from 'dayjs';

/** 원화 금액 포맷 (NUMERIC 기반 문자열/숫자 모두 허용) */
export function formatKRW(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  return `${num.toLocaleString('ko-KR')}원`;
}

/** 날짜 포맷 (기본 YYYY.MM.DD) */
export function formatDate(value: string | Date | null | undefined, pattern = 'YYYY.MM.DD'): string {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format(pattern) : '-';
}

/** 백분율 포맷 (지분율 등) */
export function formatPercent(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  return `${num.toFixed(digits)}%`;
}

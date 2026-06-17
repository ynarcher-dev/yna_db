import dayjs from 'dayjs';

/** 원화 금액 포맷 (NUMERIC 기반 문자열/숫자 모두 허용) */
export function formatKRW(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  return `${num.toLocaleString('ko-KR')}원`;
}

/**
 * 원화 축약 포맷 (억/만 단위). 좁은 표·라벨에서 긴 원 단위 대신 사용한다.
 * 예: 1,234,567,890 → "12.3억" / 50,000,000 → "5,000만" / 3,000 → "3,000원".
 */
export function formatKRWShort(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e8) return `${(num / 1e8).toFixed(1).replace(/\.0$/, '')}억`;
  if (abs >= 1e4) return `${Math.round(num / 1e4).toLocaleString('ko-KR')}만`;
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

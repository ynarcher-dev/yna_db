import dayjs from 'dayjs';

/**
 * 현재 분기 문자열 (예: '2026-Q2').
 * get_dashboard_summary / get_report_submission_rate 의 target_period 인자로 사용한다.
 */
export function getCurrentQuarter(date: dayjs.Dayjs = dayjs()): string {
  const quarter = Math.floor(date.month() / 3) + 1;
  return `${date.year()}-Q${quarter}`;
}

/** 오늘 날짜 (YYYY-MM-DD) — 다가오는 일정 조회 기준. */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentQuarter, todayISO } from '@/lib/period';
import type {
  CeoDashboardSummary,
  DashboardMetrics,
  UpcomingEvent,
} from '@/types/dashboard';
import type { EventType } from '@/types/database';

/**
 * 대시보드 통합 요약 조회 (4_dashboard.md / 16_aggregations.md).
 * - get_dashboard_summary(current_period) RPC 로 요약 지표를 1회 호출.
 * - system_events 에서 다가오는 일정 5건을 병렬 조회.
 * 두 호출을 묶어 React Query 로 캐싱·로딩·에러를 표준화한다(17_conventions.md 2장).
 */
async function fetchDashboardSummary(period: string): Promise<CeoDashboardSummary> {
  const [summaryRes, eventsRes] = await Promise.all([
    supabase.rpc('get_dashboard_summary', { current_period: period }),
    supabase
      .from('system_events')
      .select('id, title, event_type, event_date')
      .gte('event_date', todayISO())
      .order('event_date', { ascending: true })
      .limit(5),
  ]);

  if (summaryRes.error) throw summaryRes.error;
  if (eventsRes.error) throw eventsRes.error;

  const upcomingEvents: UpcomingEvent[] = (eventsRes.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    eventType: row.event_type as EventType,
    eventDate: row.event_date as string,
  }));

  return {
    metrics: summaryRes.data as DashboardMetrics,
    upcomingEvents,
  };
}

export function useDashboardSummary() {
  const period = getCurrentQuarter();
  return useQuery({
    queryKey: ['dashboard-summary', period],
    queryFn: () => fetchDashboardSummary(period),
  });
}

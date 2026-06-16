import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapStartupMetricRow,
  type StartupMetric,
  type StartupMetricRow,
} from '@/types/startupMetric';

/** 카드별 부분 저장 payload (record_date 필수 + 해당 카드 컬럼만). snake_case. */
export type MetricUpsertPayload = { record_date: string } & Record<string, unknown>;

/**
 * 스타트업 성장 지표 훅 (6_startups.md startup_metrics).
 * 특정 스타트업의 시계열 지표를 record_date 오름차순으로 조회하고, 추가/삭제한다.
 * (소프트삭제 없는 종속 이력 → 실제 DELETE. 작성 RLS: 0017)
 */
const TABLE = 'startup_metrics';

export function useStartupMetrics(startupId: string | undefined) {
  return useQuery({
    queryKey: [TABLE, startupId],
    enabled: Boolean(startupId),
    queryFn: async (): Promise<StartupMetric[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('startup_id', startupId as string)
        .order('record_date', { ascending: true });
      if (error) throw error;
      return (data as StartupMetricRow[]).map(mapStartupMetricRow);
    },
  });
}

export function useStartupMetricMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, startupId] });

  // 카드별 부분 저장: 같은 (startup, 연도) 행이 있으면 해당 카드 컬럼만 갱신, 없으면 신규.
  const upsert = useMutation({
    mutationFn: async (payload: MetricUpsertPayload) => {
      const { error } = await supabase
        .from(TABLE)
        .upsert({ startup_id: startupId, ...payload }, { onConflict: 'startup_id,record_date' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { upsert, remove };
}

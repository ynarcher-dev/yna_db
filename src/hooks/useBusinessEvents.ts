import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapBusinessEventRow, type BusinessEvent, type BusinessEventRow } from '@/types/businessEvent';
import type { BusinessEventInput } from '@/schemas/businessEvent';

/**
 * 사업 세부 일정 데이터 훅 (business_events, 7_businesses.md).
 * 추가/수정/삭제 시 0003 동기화 트리거가 system_events(대시보드 다가오는 일정)도 함께 갱신한다.
 */
const TABLE = 'business_events';

export function useBusinessEvents(businessId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BusinessEvent[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('business_id', businessId as string)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data as BusinessEventRow[]).map(mapBusinessEventRow);
    },
  });
  return { ...query, events: query.data ?? [] };
}

function toRow(businessId: string, input: BusinessEventInput) {
  return {
    business_id: businessId,
    title: input.title.trim(),
    event_type: input.eventType,
    event_date: input.eventDate,
    description: input.description ? input.description.trim() : null,
  };
}

export function useBusinessEventMutations(businessId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, businessId] });

  const create = useMutation({
    mutationFn: async (input: BusinessEventInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(businessId, input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BusinessEventInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(businessId, input)).eq('id', id);
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

  return { create, update, remove };
}

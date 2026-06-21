import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapProjectEventRow, type ProjectEvent, type ProjectEventRow } from '@/types/projectEvent';
import type { ProjectEventInput } from '@/schemas/projectEvent';
import type { EventStatus } from '@/types/database';

/**
 * 프로젝트 세부 일정(테스크) 데이터 훅 (project_events, 23_gantt_milestone.md).
 * 사업 일정(useBusinessEvents)과 동일 패턴. 추가/수정/삭제 시 0063 동기화 트리거가
 * system_events(대시보드 다가오는 일정)도 함께 갱신한다.
 */
const TABLE = 'project_events';

export function useProjectEvents(projectId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectEvent[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('project_id', projectId as string)
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data as unknown as ProjectEventRow[]).map(mapProjectEventRow);
    },
  });
  return { ...query, events: query.data ?? [] };
}

function toRow(projectId: string, input: ProjectEventInput) {
  const urls = input.urls.map((u) => u.trim()).filter(Boolean);
  return {
    project_id: projectId,
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    // manager_id(레거시 단일)는 첫 담당자로 보정, manager_ids(다중)를 정식 저장.
    manager_id: input.managerIds[0] ?? null,
    manager_ids: input.managerIds.length ? input.managerIds : null,
    status: input.status,
    dependencies: input.dependencies.length ? input.dependencies : null,
    urls: urls.length ? urls : null,
    description: input.description ? input.description.trim() : null,
  };
}

export function useProjectEventMutations(projectId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, projectId] });

  const create = useMutation({
    mutationFn: async (input: ProjectEventInput): Promise<string> => {
      // 파일 첨부를 새 테스크에 연결할 수 있도록 생성된 id 를 반환한다.
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(projectId, input), sort_order: Math.floor(Date.now() / 1000) })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProjectEventInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(projectId, input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const patch = useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      changes: { startDate?: string; endDate?: string; status?: EventStatus };
    }) => {
      const payload: Record<string, unknown> = {};
      if (changes.startDate !== undefined) payload.start_date = changes.startDate;
      if (changes.endDate !== undefined) payload.end_date = changes.endDate;
      if (changes.status !== undefined) payload.status = changes.status;
      const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i += 1) {
        const { error } = await supabase
          .from(TABLE)
          .update({ sort_order: i + 1 })
          .eq('id', orderedIds[i]);
        if (error) throw error;
      }
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

  return { create, update, patch, reorder, remove };
}

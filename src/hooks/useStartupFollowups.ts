import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapStartupFollowupRow,
  type Milestone,
  type StartupFollowup,
  type StartupFollowupRow,
} from '@/types/startupFollowup';
import type { StartupFollowupInput } from '@/schemas/startupFollowup';

/**
 * 스타트업 후속 보고 훅 (6_startups.md startup_followups).
 * due_date 오름차순 조회 + 추가/삭제 + 제출여부/마일스톤 토글.
 * DB CHECK 상 submitted_at 은 is_submitted=true 일 때만 값이 있어야 한다(여기서 동기화).
 * (소프트삭제 없는 종속 이력 → 실제 DELETE. 작성 RLS: 0017)
 */
const TABLE = 'startup_followups';

export function useStartupFollowups(startupId: string | undefined) {
  return useQuery({
    queryKey: [TABLE, startupId],
    enabled: Boolean(startupId),
    queryFn: async (): Promise<StartupFollowup[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('startup_id', startupId as string)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data as StartupFollowupRow[]).map(mapStartupFollowupRow);
    },
  });
}

export function useStartupFollowupMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, startupId] });

  const create = useMutation({
    mutationFn: async (input: StartupFollowupInput) => {
      const { error } = await supabase.from(TABLE).insert({
        startup_id: startupId,
        title: input.title.trim(),
        report_type: input.reportType,
        reporting_period: input.reportingPeriod.trim(),
        due_date: input.dueDate,
        file_url: input.fileUrl ? input.fileUrl.trim() : null,
        is_submitted: input.isSubmitted,
        submitted_at: input.isSubmitted ? new Date().toISOString() : null,
        milestones: input.milestones,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 제출 여부 토글 (CHECK 동기화: submitted_at)
  const setSubmitted = useMutation({
    mutationFn: async ({ id, submitted }: { id: string; submitted: boolean }) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ is_submitted: submitted, submitted_at: submitted ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 마일스톤 달성 토글
  const setMilestones = useMutation({
    mutationFn: async ({ id, milestones }: { id: string; milestones: Milestone[] }) => {
      const { error } = await supabase.from(TABLE).update({ milestones }).eq('id', id);
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

  return { create, setSubmitted, setMilestones, remove };
}

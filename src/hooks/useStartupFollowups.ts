import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapStartupFollowupRow,
  type StartupFollowup,
  type StartupFollowupRow,
} from '@/types/startupFollowup';
import type { StartupFollowupInput } from '@/schemas/startupFollowup';

/**
 * 스타트업 후속관리 훅 (6_startups.md startup_followups).
 * 등록/수정/삭제 + 제출 완료 토글. 제출 자료는 복수 첨부파일(files jsonb).
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
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as StartupFollowupRow[]).map(mapStartupFollowupRow);
    },
  });
}

function toRow(input: StartupFollowupInput) {
  return {
    title: input.title.trim(),
    report_type: input.reportType,
    reporting_period: input.reportingPeriod.trim(),
    comment: input.comment.trim() ? input.comment.trim() : null,
    files: input.files,
  };
}

export function useStartupFollowupMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, startupId] });

  const create = useMutation({
    mutationFn: async (input: StartupFollowupInput) => {
      const { error } = await supabase.from(TABLE).insert({
        startup_id: startupId,
        ...toRow(input),
        is_submitted: false,
        submitted_at: null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: StartupFollowupInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 제출 완료 토글 (CHECK 동기화: submitted_at)
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, setSubmitted, remove };
}

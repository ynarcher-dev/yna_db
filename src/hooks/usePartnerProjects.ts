import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapProjectRow, type Project, type ProjectRow } from '@/types/project';

/**
 * 협력사 기준 역방향(편집형) 참여 프로젝트 훅 (project_partners '쓰는 쪽', 0036 쓰기 RLS).
 * 협력사 상세에서 참여 프로젝트를 연결/해제하고, 없으면 신규 프로젝트를 만들어 즉시 매핑한다.
 * 표시는 프로젝트 목록과 동일한 컬럼이 되도록 목록과 같은 임베드 후 mapProjectRow 를 재사용한다.
 * (정방향=프로젝트 상세의 협력사 매핑은 useProjectLinks 가 담당.)
 */
const TABLE = 'project_partners';

export const partnerProjectsKey = (partnerId: string) =>
  [TABLE, 'by-partner', partnerId] as const;

export interface PartnerProjectRow {
  id: string;
  project: Project | null;
}
interface PartnerProjectRaw {
  id: string;
  project: ProjectRow | null;
}

export function usePartnerProjects(partnerId: string | undefined) {
  const query = useQuery({
    queryKey: partnerProjectsKey(partnerId as string),
    enabled: Boolean(partnerId),
    queryFn: async (): Promise<PartnerProjectRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project:projects(*, project_managers(manager:managers(name)))')
        .eq('partner_id', partnerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as PartnerProjectRaw[]).map((r) => ({
        id: r.id,
        project: r.project ? mapProjectRow(r.project) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function usePartnerProjectMutations(partnerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: partnerProjectsKey(partnerId) });

  const add = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ partner_id: partnerId, project_id: projectId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

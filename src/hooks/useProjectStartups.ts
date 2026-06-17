import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapProjectRow, type Project, type ProjectRow } from '@/types/project';

/**
 * 프로젝트 참여 스타트업(다대다) 역방향 훅 (project_startups, 상태값 없음).
 * 스타트업 상세에서 참여 프로젝트를 연결/해제하고, 없으면 신규 프로젝트를 만들어 즉시 매핑한다.
 * 백엔드는 project_startups 쓰기 RLS(0036)·projects 생성으로 이미 열려 있다.
 */
const TABLE = 'project_startups';

/** 스타트업 상세 "참여 프로젝트" 역방향 캐시 키 (StartupRelatedBlocks 와 공유). */
export const startupProjectsKey = (startupId: string) =>
  [TABLE, 'by-startup', startupId] as const;

/** 역방향 행: 조인 메타(id=조인 PK) + 목록과 동일한 프로젝트 도메인 객체. */
export interface StartupProjectRow {
  id: string;
  project: Project | null;
}

/** 매핑된 프로젝트를 목록 화면과 동일한 컬럼으로 보이도록, 목록과 같은 관계 임베드까지 끌어온다. */
const REVERSE_PROJECT_SELECT =
  'id, project:projects(*, project_managers(manager:managers(name)))';

interface StartupProjectRaw {
  id: string;
  project: ProjectRow | null;
}

export function useStartupProjects(startupId: string | undefined) {
  const query = useQuery({
    queryKey: startupProjectsKey(startupId as string),
    enabled: Boolean(startupId),
    queryFn: async (): Promise<StartupProjectRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(REVERSE_PROJECT_SELECT)
        .eq('startup_id', startupId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as StartupProjectRaw[]).map((r) => ({
        id: r.id,
        project: r.project ? mapProjectRow(r.project) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useStartupProjectMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: startupProjectsKey(startupId) });

  const add = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ project_id: projectId, startup_id: startupId });
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

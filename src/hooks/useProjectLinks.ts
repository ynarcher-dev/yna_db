import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 프로젝트 매칭 연계(다대다) 데이터 훅 — 스타트업/협력사 공용.
 * project_startups / project_partners 두 조인 테이블이 구조가 동일하므로 kind 로 분기한다.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
export type ProjectLinkKind = 'startup' | 'partner';

interface LinkConfig {
  table: string;
  /** 상대 엔티티 FK 컬럼 */
  fk: string;
  /** 상대 엔티티 테이블(이름 임베드용) */
  entityTable: string;
  /** 상세 라우트 prefix */
  path: string;
  /** 화면 명사(스타트업/협력사) */
  noun: string;
}

export const PROJECT_LINK_CONFIG: Record<ProjectLinkKind, LinkConfig> = {
  startup: {
    table: 'project_startups',
    fk: 'startup_id',
    entityTable: 'startups',
    path: '/startups',
    noun: '스타트업',
  },
  partner: {
    table: 'project_partners',
    fk: 'partner_id',
    entityTable: 'partners',
    path: '/partners',
    noun: '협력사',
  },
};

/** 연계 1건 (조인 행 + 상대 엔티티 이름). */
export interface ProjectLink {
  /** 조인 행 id (해제 시 사용) */
  id: string;
  /** 상대 엔티티(스타트업/협력사) id */
  entityId: string;
  /** 상대 엔티티 이름 */
  name: string;
}

interface LinkRow {
  id: string;
  entity_id: string;
  entity: { name: string } | null;
}

export function useProjectLinks(projectId: string | undefined, kind: ProjectLinkKind) {
  const cfg = PROJECT_LINK_CONFIG[kind];
  const query = useQuery({
    queryKey: [cfg.table, projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectLink[]> => {
      const { data, error } = await supabase
        .from(cfg.table)
        .select(`id, entity_id:${cfg.fk}, entity:${cfg.entityTable}(name)`)
        .eq('project_id', projectId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return (data as unknown as LinkRow[]).map((r) => ({
        id: r.id,
        entityId: r.entity_id,
        name: r.entity?.name ?? '',
      }));
    },
  });

  return { ...query, links: query.data ?? [] };
}

export function useProjectLinkMutations(projectId: string, kind: ProjectLinkKind) {
  const cfg = PROJECT_LINK_CONFIG[kind];
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [cfg.table, projectId] });

  // 매핑 추가. UNIQUE(project_id, {fk}) 로 중복은 DB가 막는다.
  const add = useMutation({
    mutationFn: async (entityId: string) => {
      const { error } = await supabase
        .from(cfg.table)
        .insert({ project_id: projectId, [cfg.fk]: entityId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 매핑 해제(조인 행 실제 삭제).
  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(cfg.table).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

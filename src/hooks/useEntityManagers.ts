import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 담당자(다대다) 공통 데이터 훅 — 프로젝트/스타트업 공용.
 * project_managers / startup_managers 두 조인 테이블이 구조가 동일하므로 kind 로 분기한다.
 * 책임자(created_by)와 달리 한 레코드에 담당 심사역을 여러 명 배정/해제한다.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
export type ManagerEntityKind = 'project' | 'startup';

interface ManagerJoinConfig {
  table: string;
  /** 부모 엔티티 FK 컬럼 */
  fk: string;
}

const CONFIG: Record<ManagerEntityKind, ManagerJoinConfig> = {
  project: { table: 'project_managers', fk: 'project_id' },
  startup: { table: 'startup_managers', fk: 'startup_id' },
};

/** 담당자 1건 (조인 행 + 심사역 이름). */
export interface EntityManager {
  /** 조인 행 id (해제 시 사용) */
  id: string;
  managerId: string;
  managerName: string;
  createdAt: string;
}

interface ManagerRow {
  id: string;
  manager_id: string;
  created_at: string;
  manager: { name: string } | null;
}

export function useEntityManagers(kind: ManagerEntityKind, entityId: string | undefined) {
  const cfg = CONFIG[kind];
  const query = useQuery({
    queryKey: [cfg.table, entityId],
    enabled: Boolean(entityId),
    queryFn: async (): Promise<EntityManager[]> => {
      const { data, error } = await supabase
        .from(cfg.table)
        .select('id, manager_id, created_at, manager:managers(name)')
        .eq(cfg.fk, entityId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return (data as unknown as ManagerRow[]).map((r) => ({
        id: r.id,
        managerId: r.manager_id,
        managerName: r.manager?.name ?? '',
        createdAt: r.created_at,
      }));
    },
  });

  return { ...query, managers: query.data ?? [] };
}

export function useEntityManagerMutations(kind: ManagerEntityKind, entityId: string) {
  const cfg = CONFIG[kind];
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [cfg.table, entityId] });

  // 담당자 배정(추가). UNIQUE({fk}, manager_id) 로 중복은 DB가 막는다.
  const add = useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase
        .from(cfg.table)
        .insert({ [cfg.fk]: entityId, manager_id: managerId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 담당자 배정 해제(조인 행 실제 삭제).
  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(cfg.table).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

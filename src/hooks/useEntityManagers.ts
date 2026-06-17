import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapManagerRow, type Manager, type ManagerRow } from '@/types/manager';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 담당자(다대다) 공통 데이터 훅 — 프로젝트/스타트업/프로그램/펀드 공용.
 * *_managers 조인 테이블이 (manager_id, 부모 FK) 구조로 동일하므로 kind 로 분기한다.
 * 작성자(created_by)는 0048 트리거로 담당자에 자동 편입되며 DB가 해제를 차단한다(연동 해제 불가).
 * 프로그램만 운영 역할(role: lead/operator) 컬럼을 추가로 가진다.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
export type ManagerEntityKind = 'project' | 'startup' | 'program' | 'fund';

interface ManagerJoinConfig {
  table: string;
  /** 부모 엔티티 FK 컬럼 */
  fk: string;
  /** 운영 역할(role) 컬럼 보유 여부 — 프로그램 전용 */
  hasRole?: boolean;
}

const CONFIG: Record<ManagerEntityKind, ManagerJoinConfig> = {
  project: { table: 'project_managers', fk: 'project_id' },
  startup: { table: 'startup_managers', fk: 'startup_id' },
  program: { table: 'program_managers', fk: 'program_id', hasRole: true },
  fund: { table: 'fund_managers', fk: 'fund_id' },
};

/** 담당자 1건 (조인 행 + 심사역 도메인 객체 + (프로그램) 역할). */
export interface EntityManager {
  /** 조인 행 id (해제 시 사용) */
  id: string;
  /** 심사역 도메인 객체 (목록과 동일한 컬럼 표시용). 임베드 누락 시 null */
  manager: Manager | null;
  /** 운영 역할 (프로그램만; 그 외 undefined) */
  role?: ProgramManagerRole;
  createdAt: string;
}

/** 조인 행 raw (심사역은 목록과 동일하게 풀 임베드). */
interface ManagerJoinRow {
  id: string;
  role?: ProgramManagerRole;
  created_at: string;
  manager: ManagerRow | null;
}

export function useEntityManagers(kind: ManagerEntityKind, entityId: string | undefined) {
  const cfg = CONFIG[kind];
  const query = useQuery({
    queryKey: [cfg.table, entityId],
    enabled: Boolean(entityId),
    queryFn: async (): Promise<EntityManager[]> => {
      // 목록(managerColumns)과 동일한 컬럼(직급·소속·관심분야)을 표시하기 위해 심사역을 풀 임베드한다.
      const cols = `id, ${cfg.hasRole ? 'role, ' : ''}created_at, manager:managers(*, department:departments!managers_department_id_fkey(name, company), team:teams!managers_team_id_fkey(name))`;
      let q = supabase.from(cfg.table).select(cols).eq(cfg.fk, entityId as string);
      // 프로그램은 운영총괄(lead) 먼저, 그다음 배정순
      if (cfg.hasRole) q = q.order('role', { ascending: true });
      q = q.order('created_at', { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as ManagerJoinRow[]).map((r) => ({
        id: r.id,
        manager: r.manager ? mapManagerRow(r.manager) : null,
        role: r.role,
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
  // 프로그램은 역할(role)을 함께 저장(미지정 시 운영담당 operator).
  const add = useMutation({
    mutationFn: async (input: { managerId: string; role?: ProgramManagerRole }) => {
      const payload: Record<string, unknown> = {
        [cfg.fk]: entityId,
        manager_id: input.managerId,
      };
      if (cfg.hasRole) payload.role = input.role ?? 'operator';
      const { error } = await supabase.from(cfg.table).insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 운영 역할 변경 (프로그램 전용). 그 외 kind 에서는 호출하지 않는다.
  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: ProgramManagerRole }) => {
      const { error } = await supabase.from(cfg.table).update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 담당자 배정 해제(조인 행 실제 삭제). 작성자 행은 DB 트리거가 차단해 에러를 던진다.
  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(cfg.table).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, updateRole, remove };
}

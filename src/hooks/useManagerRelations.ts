import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapStartupRow, type Startup, type StartupRow } from '@/types/startup';
import { mapProjectRow, type Project, type ProjectRow } from '@/types/project';
import { mapProgramRow, type Program, type ProgramRow } from '@/types/program';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 심사역 기준 역방향(편집형) 데이터 훅 — 심사역 상세에서 담당/운영을 직접 매핑한다.
 * startup_managers·project_managers(역할 없음) / program_managers(역할 lead·operator)의 '쓰는 쪽'.
 * 표시는 각 도메인 목록과 동일한 컬럼이 되도록, 목록과 같은 관계 임베드 후 map{Domain}Row 를 재사용한다.
 * 쓰기 RLS 는 기존 조인 정책(전 직원 공통)으로 이미 열려 있어 새 마이그레이션이 필요 없다.
 */

// ── 담당 스타트업 (startup_managers) ──────────────────────────────────────────
const STARTUP_TABLE = 'startup_managers';
export const managerStartupsKey = (managerId: string) =>
  [STARTUP_TABLE, 'by-manager', managerId] as const;

/** 역방향 행: 조인 PK + 목록과 동일한 스타트업 도메인 객체. */
export interface ManagerStartupRow {
  id: string;
  startup: Startup | null;
}
interface ManagerStartupRaw {
  id: string;
  startup: StartupRow | null;
}

export function useManagerStartups(managerId: string | undefined) {
  const query = useQuery({
    queryKey: managerStartupsKey(managerId as string),
    enabled: Boolean(managerId),
    queryFn: async (): Promise<ManagerStartupRow[]> => {
      const { data, error } = await supabase
        .from(STARTUP_TABLE)
        .select('id, startup:startups(*, startup_managers(manager:managers(name)))')
        .eq('manager_id', managerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as ManagerStartupRaw[]).map((r) => ({
        id: r.id,
        startup: r.startup ? mapStartupRow(r.startup) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useManagerStartupMutations(managerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: managerStartupsKey(managerId) });

  const add = useMutation({
    mutationFn: async (startupId: string) => {
      const { error } = await supabase
        .from(STARTUP_TABLE)
        .insert({ manager_id: managerId, startup_id: startupId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(STARTUP_TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

// ── 담당 프로젝트 (project_managers) ──────────────────────────────────────────
const PROJECT_TABLE = 'project_managers';
export const managerProjectsKey = (managerId: string) =>
  [PROJECT_TABLE, 'by-manager', managerId] as const;

export interface ManagerProjectRow {
  id: string;
  project: Project | null;
}
interface ManagerProjectRaw {
  id: string;
  project: ProjectRow | null;
}

export function useManagerProjects(managerId: string | undefined) {
  const query = useQuery({
    queryKey: managerProjectsKey(managerId as string),
    enabled: Boolean(managerId),
    queryFn: async (): Promise<ManagerProjectRow[]> => {
      const { data, error } = await supabase
        .from(PROJECT_TABLE)
        .select('id, project:projects(*, project_managers(manager:managers(name)))')
        .eq('manager_id', managerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as ManagerProjectRaw[]).map((r) => ({
        id: r.id,
        project: r.project ? mapProjectRow(r.project) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useManagerProjectMutations(managerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: managerProjectsKey(managerId) });

  const add = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from(PROJECT_TABLE)
        .insert({ manager_id: managerId, project_id: projectId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(PROJECT_TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

// ── 운영 프로그램 (program_managers, 역할 lead/operator) ──────────────────────
const PROGRAM_TABLE = 'program_managers';
export const managerProgramsKey = (managerId: string) =>
  [PROGRAM_TABLE, 'by-manager', managerId] as const;

export interface ManagerProgramRow {
  id: string;
  role: ProgramManagerRole;
  program: Program | null;
}
interface ManagerProgramRaw {
  id: string;
  role: ProgramManagerRole;
  program: ProgramRow | null;
}

export function useManagerPrograms(managerId: string | undefined) {
  const query = useQuery({
    queryKey: managerProgramsKey(managerId as string),
    enabled: Boolean(managerId),
    queryFn: async (): Promise<ManagerProgramRow[]> => {
      const { data, error } = await supabase
        .from(PROGRAM_TABLE)
        .select('id, role, program:programs(*, program_managers(manager:managers(name)))')
        .eq('manager_id', managerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as ManagerProgramRaw[]).map((r) => ({
        id: r.id,
        role: r.role,
        program: r.program ? mapProgramRow(r.program) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useManagerProgramMutations(managerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: managerProgramsKey(managerId) });

  const add = useMutation({
    mutationFn: async ({ programId, role }: { programId: string; role: ProgramManagerRole }) => {
      const { error } = await supabase
        .from(PROGRAM_TABLE)
        .insert({ manager_id: managerId, program_id: programId, role });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: ProgramManagerRole }) => {
      const { error } = await supabase.from(PROGRAM_TABLE).update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(PROGRAM_TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, updateRole, remove };
}

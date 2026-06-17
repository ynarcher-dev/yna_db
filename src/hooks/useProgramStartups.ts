import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapStartupRow, type Startup, type StartupRow } from '@/types/startup';
import { mapProgramRow, type Program, type ProgramRow } from '@/types/program';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 프로그램 참여 스타트업(다대다) 데이터 훅 (program_startups, status).
 * 배치 기수에 참여한 스타트업을 추가/상태변경/해제한다. 실제 INSERT/UPDATE/DELETE.
 * 표시는 스타트업 목록과 동일한 컬럼이 되도록 목록과 같은 임베드 후 mapStartupRow 를 재사용한다.
 */
const TABLE = 'program_startups';

/** 참여 스타트업 1행: 조인 PK + 보육상태 + 목록과 동일한 스타트업 도메인 객체. */
export interface ProgramStartupRow {
  id: string;
  status: ProgramStartupStatus;
  startup: Startup | null;
}
interface ProgramStartupRaw {
  id: string;
  status: ProgramStartupStatus;
  startup: StartupRow | null;
}

export function useProgramStartups(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramStartupRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, status, startup:startups(*, startup_managers(manager:managers(name)))')
        .eq('program_id', programId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as ProgramStartupRaw[]).map((r) => ({
        id: r.id,
        status: r.status,
        startup: r.startup ? mapStartupRow(r.startup) : null,
      }));
    },
  });
  return { ...query, participants: query.data ?? [] };
}

// ── 역방향(스타트업 기준): 스타트업 상세에서 참여 프로그램을 매핑한다 ──────────────
/** 스타트업 상세 "참여 프로그램" 역방향 캐시 키 (StartupRelatedBlocks 와 공유). */
export const startupProgramsKey = (startupId: string) =>
  [TABLE, 'by-startup', startupId] as const;

/** 역방향 행: 조인 메타(id=조인 PK, 보육상태) + 목록과 동일한 프로그램 도메인 객체. */
export interface StartupProgramRow {
  id: string;
  status: ProgramStartupStatus;
  program: Program | null;
}

/** 매핑된 프로그램을 목록 화면과 동일한 컬럼으로 보이도록, 목록과 같은 관계 임베드까지 끌어온다. */
const REVERSE_PROGRAM_SELECT =
  'id, status, program:programs(*, program_managers(manager:managers(name)))';

interface StartupProgramRaw {
  id: string;
  status: ProgramStartupStatus;
  program: ProgramRow | null;
}

export function useStartupPrograms(startupId: string | undefined) {
  const query = useQuery({
    queryKey: startupProgramsKey(startupId as string),
    enabled: Boolean(startupId),
    queryFn: async (): Promise<StartupProgramRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(REVERSE_PROGRAM_SELECT)
        .eq('startup_id', startupId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as StartupProgramRaw[]).map((r) => ({
        id: r.id,
        status: r.status,
        program: r.program ? mapProgramRow(r.program) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useStartupProgramMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: startupProgramsKey(startupId) });

  const add = useMutation({
    mutationFn: async ({
      programId,
      status,
    }: {
      programId: string;
      status: ProgramStartupStatus;
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, startup_id: startupId, status });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProgramStartupStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
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

  return { add, updateStatus, remove };
}

export function useProgramStartupMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, programId] });

  const add = useMutation({
    mutationFn: async ({
      startupId,
      status,
    }: {
      startupId: string;
      status: ProgramStartupStatus;
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, startup_id: startupId, status });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProgramStartupStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
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

  return { add, updateStatus, remove };
}

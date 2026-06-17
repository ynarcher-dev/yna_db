import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapTeamRow, type Team, type TeamRow } from '@/types/team';
import type { TeamInput } from '@/schemas/team';

/**
 * 팀 데이터 훅 — 소속 관리의 단위(팀=하나의 '부서'). 5_managers 패턴 복제.
 * 그룹(departments)·회사(departments.company)는 임베드로 함께 표시한다.
 * 작성/수정/삭제는 RLS·화면 양쪽에서 Admin 전용(0051). 변이는 raw 에러를 전파한다.
 */
const TABLE = 'teams';
// 그룹(회사 포함)·작성자 임베드. teams→departments/managers 는 각각 단일 FK 라 모호하지 않다.
const SELECT_FULL =
  '*, department:departments(name, company), author:managers!teams_created_by_fkey(name)';

interface TeamsListArgs {
  search: string;
  company?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useTeamsList(args: TeamsListArgs) {
  // 회사 필터가 걸리면 그룹 임베드를 inner 로 바꿔 임베드 자원에 company 필터를 건다.
  const filteringByCompany = Boolean(args.company);
  const columns = filteringByCompany
    ? '*, department:departments!inner(name, company), author:managers!teams_created_by_fkey(name)'
    : SELECT_FULL;

  const query = useListQuery<TeamRow>({
    table: TABLE,
    columns,
    searchColumns: ['name'],
    search: args.search,
    filters: filteringByCompany ? { 'department.company': args.company } : {},
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    teams: (query.data?.rows ?? []).map(mapTeamRow),
    total: query.data?.total ?? 0,
  };
}

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Team> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_FULL)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapTeamRow(data as TeamRow);
    },
  });
}

interface TeamOptionRow {
  id: string;
  name: string | null;
  department: { name: string; company: string } | null;
}

/**
 * 심사역 소속 지정용 팀 옵션. 라벨은 "회사 · 그룹 · 팀" 으로 계층을 보여준다.
 */
export function useTeamOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, department:departments(name, company)')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      const rows = (data as unknown as TeamOptionRow[]) ?? [];
      return rows
        .map((t) => ({
          value: t.id,
          label: [t.department?.company, t.department?.name, t.name].filter(Boolean).join(' · '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    },
  });
}

/**
 * 특정 회사의 기존 그룹명 목록 (팀 폼의 그룹 콤보박스 후보).
 * 정규화된 departments 에서 미삭제 그룹명을 이름순으로 가져온다.
 */
export function useGroupNameOptions(company: string | undefined) {
  return useQuery({
    queryKey: ['departments', 'group-names', company],
    enabled: Boolean(company),
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('company', company as string)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d) => ({ value: d.name as string, label: d.name as string }));
    },
  });
}

/**
 * (회사, 그룹명) → 그룹 id. 기존 그룹이 있으면 그 id, 없으면 새 그룹을 만들어 id 반환.
 * 신규 생성은 departments INSERT(Admin 전용 RLS)를 탄다.
 */
async function resolveGroupId(company: string, groupName: string): Promise<string> {
  const name = groupName.trim();
  const { data: found, error: findErr } = await supabase
    .from('departments')
    .select('id')
    .eq('company', company)
    .eq('name', name)
    .is('deleted_at', null)
    .maybeSingle();
  if (findErr) throw findErr;
  if (found?.id) return found.id as string;

  const { data: created, error: insErr } = await supabase
    .from('departments')
    .insert({ company, name })
    .select('id')
    .single();
  if (insErr) throw insErr;
  return created.id as string;
}

/** 팀 컬럼(운영기간) 매핑. 빈 운영기간은 NULL 저장. */
function teamColumns(departmentId: string, input: TeamInput) {
  return {
    department_id: departmentId,
    // 팀명은 선택값 — 비면 NULL(팀 미지정). 유일성 인덱스가 NULL 은 제약하지 않는다.
    name: input.name.trim() ? input.name.trim() : null,
    operating_start: input.operatingStart ? input.operatingStart : null,
    operating_end: input.operatingEnd ? input.operatingEnd : null,
  };
}

export function useTeamMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [TABLE] });
    qc.invalidateQueries({ queryKey: ['departments'] });
  };

  const create = useMutation({
    mutationFn: async (input: TeamInput) => {
      const departmentId = await resolveGroupId(input.company, input.groupName);
      const { error } = await supabase.from(TABLE).insert(teamColumns(departmentId, input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TeamInput }) => {
      const departmentId = await resolveGroupId(input.company, input.groupName);
      const { error } = await supabase
        .from(TABLE)
        .update(teamColumns(departmentId, input))
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 (RLS 상 Admin 만 가능)
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

/** 팀 소속 멤버(심사역) — managers.team_id = teamId. */
export interface TeamMember {
  id: string;
  name: string;
  position: string;
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['managers', 'by-team', teamId],
    enabled: Boolean(teamId),
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('managers')
        .select('id, name, position')
        .eq('team_id', teamId as string)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

/**
 * 소속 멤버 배정/해제 — 심사역의 team_id 를 갱신한다(Admin 전용 RLS).
 * 배정 시 DB 트리거가 그룹(department_id)을 팀에서 자동 동기화한다.
 * 한 심사역은 한 팀에만 속하므로, 다른 팀 소속자를 배정하면 이 팀으로 이동한다.
 */
export function useTeamMemberMutations(teamId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['managers'] });
  };

  const assign = useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase
        .from('managers')
        .update({ team_id: teamId })
        .eq('id', managerId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unassign = useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase
        .from('managers')
        .update({ team_id: null })
        .eq('id', managerId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { assign, unassign };
}

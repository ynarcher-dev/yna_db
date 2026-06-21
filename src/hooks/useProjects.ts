import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapProjectRow, type Project, type ProjectRow } from '@/types/project';
import type { ProjectInput } from '@/schemas/project';

/**
 * 프로젝트 데이터 훅 (10_projects.md / 17_conventions.md 2·3장).
 * 스타트업(useStartups) 패턴을 복제한다. projects↔managers 관계가 2개
 * (manager_id / created_by=책임자)라 책임자 임베드는 FK 제약명을 명시한다(PATTERNS 10).
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'projects';
const SELECT_WITH_RELATIONS =
  '*, author:managers!projects_created_by_fkey(name), project_managers(manager:managers(name))';

interface ProjectsListArgs {
  search: string;
  projectType?: string;
  stage?: string;
  priority?: string;
  /** 기간 조회 범위(개시~종료 겹침). YYYY-MM-DD, 빈 값이면 미적용 */
  dateFrom?: string;
  dateTo?: string;
  /** 매출·이익 범위(원 단위). 미지정 끝점은 미적용 */
  revenueMin?: number;
  revenueMax?: number;
  profitMin?: number;
  profitMax?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useProjectsList(args: ProjectsListArgs) {
  const query = useListQuery<ProjectRow>({
    table: TABLE,
    columns: SELECT_WITH_RELATIONS,
    searchColumns: ['name'],
    search: args.search,
    filters: {
      project_type: args.projectType,
      stage: args.stage,
      priority: args.priority,
    },
    dateOverlap: { startColumn: 'start_date', endColumn: 'end_date', from: args.dateFrom, to: args.dateTo },
    numericRanges: [
      { column: 'revenue', min: args.revenueMin, max: args.revenueMax },
      { column: 'profit', min: args.profitMin, max: args.profitMax },
    ],
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    projects: (query.data?.rows ?? []).map(mapProjectRow),
    total: query.data?.total ?? 0,
  };
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapProjectRow(data as ProjectRow);
    },
  });
}

/**
 * id+name 옵션 목록 (Select 용, 예: 협력사 상세에서 참여 프로젝트 매핑). 미삭제 전체.
 * projectType 을 주면 해당 유형만 — M&A/신사업 분리 연동에서 유형별 후보만 노출한다.
 */
export function useProjectOptions(projectType?: string) {
  return useQuery({
    queryKey: [TABLE, 'options', projectType ?? 'all'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      let q = supabase.from(TABLE).select('id, name').is('deleted_at', null);
      if (projectType) q = q.eq('project_type', projectType);
      const { data, error } = await q.order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({ value: p.id as string, label: p.name as string }));
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). 빈 값은 NULL 처리. */
function toRow(input: ProjectInput) {
  return {
    name: input.name.trim(),
    project_type: input.projectType,
    // 기타일 때만 자유 텍스트 저장, 그 외 유형에선 NULL 로 비운다.
    project_type_etc:
      input.projectType === 'other' && input.projectTypeEtc.trim()
        ? input.projectTypeEtc.trim()
        : null,
    stage: input.stage,
    priority: input.priority,
    start_date: input.startDate,
    end_date: input.endDate ? input.endDate : null,
    revenue: input.revenue,
    profit: input.profit,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  // 생성 후 새 id 를 반환한다(.select) — 역방향 화면에서 "생성과 동시에 매핑"에 쓰인다.
  const create = useMutation({
    mutationFn: async (input: ProjectInput): Promise<{ id: string }> => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(input))
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProjectInput }) => {
      // stage 변경 시 0001 의 감사 트리거가 project_timelines 에 자동 기록한다.
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 — RLS 상 책임자(created_by) 또는 관리자만 deleted_at 설정 가능.
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

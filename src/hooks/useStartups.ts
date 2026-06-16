import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapStartupRow, type Startup, type StartupRow } from '@/types/startup';
import type { StartupInput } from '@/schemas/startup';

/**
 * 스타트업 데이터 훅 (6_startups.md / 17_conventions.md 2·3장).
 * 협력사(usePartners) 패턴을 그대로 복제한다. startups↔managers 관계가 2개
 * (manager_id=담당 심사역 / created_by=작성자)라 임베드는 FK 제약명을 명시한다.
 * 변이는 try-catch 대신 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'startups';
const SELECT_WITH_RELATIONS =
  '*, manager:managers!startups_manager_id_fkey(name), author:managers!startups_created_by_fkey(name)';

interface StartupsListArgs {
  search: string;
  investmentStage?: string;
  managementStatus?: string;
  managerId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useStartupsList(args: StartupsListArgs) {
  const query = useListQuery<StartupRow>({
    table: TABLE,
    columns: SELECT_WITH_RELATIONS,
    searchColumns: ['name', 'ceo_name'],
    search: args.search,
    filters: {
      investment_stage: args.investmentStage,
      management_status: args.managementStatus,
      manager_id: args.managerId,
    },
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    startups: (query.data?.rows ?? []).map(mapStartupRow),
    total: query.data?.total ?? 0,
  };
}

export function useStartup(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Startup> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapStartupRow(data as StartupRow);
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). 빈 값은 NULL/기본값 처리. */
function toRow(input: StartupInput) {
  return {
    name: input.name.trim(),
    ceo_name: input.ceoName.trim(),
    investment_stage: input.investmentStage,
    management_status: input.managementStatus,
    // 기타일 때만 자유 텍스트 저장, 그 외 상태에선 NULL 로 비운다.
    management_status_etc:
      input.managementStatus === 'other' && input.managementStatusEtc.trim()
        ? input.managementStatusEtc.trim()
        : null,
    manager_id: input.managerId ? input.managerId : null,
    brand_color: input.brandColor,
    logo_url: input.logoUrl ? input.logoUrl.trim() : null,
    description: input.description ? input.description.trim() : null,
    shareholders: input.shareholders.map((s) => ({
      name: s.name.trim(),
      shares: s.shares,
      percentage: s.percentage,
    })),
  };
}

export function useStartupMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: StartupInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: StartupInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 (RLS 상 Admin 만 deleted_at 설정 가능)
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

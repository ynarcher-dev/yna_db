import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapStartupRow, type Startup, type StartupRow } from '@/types/startup';
import type {
  StartupInput,
  ShareholdersFormInput,
  MemosFormInput,
  BusinessStatusFormInput,
  DiagnosisFormInput,
} from '@/schemas/startup';
import type { BusinessTeamInput } from '@/schemas/startupProfile';

/**
 * 스타트업 데이터 훅 (6_startups.md / 17_conventions.md 2·3장).
 * 협력사(usePartners) 패턴을 그대로 복제한다. startups↔managers 관계가 2개
 * (manager_id=담당 심사역 / created_by=작성자)라 임베드는 FK 제약명을 명시한다.
 * 변이는 try-catch 대신 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'startups';
// 담당 심사역은 다대다(startup_managers) 임베드. 책임자(created_by)는 단수 임베드.
const SELECT_WITH_RELATIONS =
  '*, startup_managers(manager:managers(name)), author:managers!startups_created_by_fkey(name)';

/** id+name 옵션 목록 (Select 용, 예: 프로젝트 매칭 스타트업). 미삭제 스타트업 전체. */
export function useStartupOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s) => ({ value: s.id as string, label: s.name as string }));
    },
  });
}

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
  // 담당 심사역 필터가 걸리면 startup_managers 를 inner 임베드로 바꿔 해당 담당자가 있는
  // 스타트업만 남기고, 임베드 자원에 manager_id 필터를 건다(다대다 조인 필터링).
  const filteringByManager = Boolean(args.managerId);
  const columns = filteringByManager
    ? '*, startup_managers!inner(manager:managers(name)), author:managers!startups_created_by_fkey(name)'
    : SELECT_WITH_RELATIONS;

  const query = useListQuery<StartupRow>({
    table: TABLE,
    columns,
    searchColumns: ['name', 'ceo_name'],
    search: args.search,
    filters: {
      investment_stage: args.investmentStage,
      management_status: args.managementStatus,
      ...(filteringByManager ? { 'startup_managers.manager_id': args.managerId } : {}),
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
    brand_color: input.brandColor,
    logo_url: input.logoUrl ? input.logoUrl.trim() : null,
    description: input.description ? input.description.trim() : null,
    sections: input.sections,
  };
}

export function useStartupMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  // 생성 후 새 id 를 반환한다(.select) — 역방향 화면에서 "생성과 동시에 매핑"에 쓰인다.
  const create = useMutation({
    mutationFn: async (input: StartupInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from(TABLE).insert(toRow(input)).select('id').single();
      if (error) throw error;
      return data as { id: string };
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

  // 비즈니스 & 팀 역량(jsonb 2개)만 갱신. 기존 startups UPDATE RLS(Admin·Manager) 사용.
  const updateBusinessTeam = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BusinessTeamInput }) => {
      const business_profile = {
        oneLiner: input.oneLiner.trim(),
        businessModel: input.businessModel.trim(),
        targetMarket: input.targetMarket.trim(),
        competitiveEdge: input.competitiveEdge.trim(),
      };
      const team_profile = {
        founderStrength: input.founderStrength.trim(),
        members: input.members.map((m) => ({
          name: m.name.trim(),
          role: m.role.trim(),
          background: m.background.trim(),
        })),
        capabilities: input.capabilities.map((c) => c.trim()).filter(Boolean),
      };
      const { error } = await supabase
        .from(TABLE)
        .update({
          business_profile,
          team_profile,
          business_profile_updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 주주 구성만 갱신 (주주 카드 전용). 섹션 최종 수정 시각도 함께 기록.
  const updateShareholders = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ShareholdersFormInput }) => {
      const shareholders = input.shareholders.map((s) => ({
        name: s.name.trim(),
        shares: s.shares,
        percentage: s.percentage,
      }));
      const { error } = await supabase
        .from(TABLE)
        .update({ shareholders, shareholders_updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 시계열 메모/회의록만 갱신 (메모 카드 전용). 섹션 최종 수정 시각도 함께 기록.
  const updateMemos = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MemosFormInput }) => {
      const memos = input.memos.map((m) => ({ date: m.date, content: m.content.trim() }));
      const { error } = await supabase
        .from(TABLE)
        .update({ memos, memos_updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 비즈니스 현황(성장 지표 영역, 시계열 텍스트)만 갱신.
  const updateBusinessStatus = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BusinessStatusFormInput }) => {
      const business_status = input.businessStatus.map((m) => ({
        date: m.date,
        content: m.content.trim(),
      }));
      const { error } = await supabase
        .from(TABLE)
        .update({ business_status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 기업진단(임시 수동 입력)만 갱신. 최종 수정 시각도 함께 기록.
  const updateDiagnosis = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DiagnosisFormInput }) => {
      const { error } = await supabase
        .from(TABLE)
        .update({
          diagnosis: input.diagnosis.trim() ? input.diagnosis.trim() : null,
          diagnosis_updated_at: new Date().toISOString(),
        })
        .eq('id', id);
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

  return {
    create,
    update,
    updateBusinessTeam,
    updateShareholders,
    updateMemos,
    updateBusinessStatus,
    updateDiagnosis,
    remove,
  };
}

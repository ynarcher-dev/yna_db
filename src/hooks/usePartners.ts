import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapPartnerRow, type Partner, type PartnerRow } from '@/types/partner';
import type { PartnerInput } from '@/schemas/partner';

/**
 * 협력사 데이터 훅 (12_partners.md / 17_conventions.md 2·3장).
 * 목록은 useListQuery 공통 패턴을 재사용하고, 변이는 try-catch 대신
 * React Query onError 로 호출부(useAppToast)가 피드백하도록 raw 에러를 전파한다.
 */
const TABLE = 'partners';
// created_by FK 로 작성자(심사역) 이름을 임베드 (PostgREST resource embedding)
const SELECT_WITH_AUTHOR = '*, author:managers!partners_created_by_fkey(name)';

interface PartnersListArgs {
  search: string;
  partnerType?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function usePartnersList(args: PartnersListArgs) {
  const query = useListQuery<PartnerRow>({
    table: TABLE,
    columns: SELECT_WITH_AUTHOR,
    searchColumns: ['name', 'department', 'contact_person'],
    search: args.search,
    filters: { partner_type: args.partnerType },
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    partners: (query.data?.rows ?? []).map(mapPartnerRow),
    total: query.data?.total ?? 0,
  };
}

export function usePartner(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Partner> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_AUTHOR)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapPartnerRow(data as PartnerRow);
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). 빈 연락처는 NULL 저장. */
function toRow(input: PartnerInput) {
  return {
    name: input.name.trim(),
    department: input.department ? input.department.trim() : null,
    partner_type: input.partnerType,
    contact_person: input.contactPerson.trim(),
    phone: input.phone ? input.phone.trim() : null,
    email: input.email ? input.email.trim().toLowerCase() : null,
    interaction_log: input.interactionLog,
  };
}

export function usePartnerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: PartnerInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PartnerInput }) => {
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

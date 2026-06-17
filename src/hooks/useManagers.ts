import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import { mapManagerRow, type Manager, type ManagerRow } from '@/types/manager';
import type { Biography } from '@/types/biography';
import type { ManagerInput } from '@/schemas/manager';

/**
 * 심사역 데이터 훅 (5_managers.md / 14_auth.md / 17_conventions.md 2·3장).
 * - 읽기: 목록/단건(공통 패턴, 소속 부서명 임베드).
 * - 쓰기: '등록'은 Edge Function(계정 발급)으로 분리. 여기서는
 *   Admin 전체 수정(updateAsAdmin), 본인 프로필 수정(updateMyProfile RPC), 소프트삭제(remove).
 */
const TABLE = 'managers';
// 소속 임베드. managers↔departments 관계가 여러 개(department_id / leader_id /
// created_by)라 모호하므로 FK 제약명(managers_department_id_fkey)을 명시해 지정한다.
// 소속은 팀 단위지만, 그룹(department_id)은 트리거로 동기화되어 회사·그룹명 표시에 함께 쓴다.
const SELECT_WITH_DEPT =
  '*, department:departments!managers_department_id_fkey(name, company), team:teams!managers_team_id_fkey(name)';

interface ManagersListArgs {
  search: string;
  role?: string;
  departmentId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useManagersList(args: ManagersListArgs) {
  const query = useListQuery<ManagerRow>({
    table: TABLE,
    columns: SELECT_WITH_DEPT,
    searchColumns: ['name', 'position', 'email'],
    search: args.search,
    filters: { role: args.role, department_id: args.departmentId },
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    managers: (query.data?.rows ?? []).map(mapManagerRow),
    total: query.data?.total ?? 0,
  };
}

/** 담당 심사역 드롭다운용 옵션 (id→이름). 미삭제 심사역만 이름순 정렬. */
export function useManagerOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m) => ({ value: m.id as string, label: m.name as string }));
    },
  });
}

export function useManager(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Manager> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_DEPT)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapManagerRow(data as ManagerRow);
    },
  });
}

/** Admin 수정용: 전체 허용 컬럼(직급·소속 포함, role/email 제외) → DB row. */
function toAdminRow(input: ManagerInput) {
  return {
    name: input.name.trim(),
    position: input.position.trim(),
    // 소속은 팀 단위. department_id(그룹)는 DB 트리거가 팀에서 자동 동기화한다.
    team_id: input.teamId ? input.teamId : null,
    phone: input.phone ? input.phone.trim() : null,
    specialties: input.specialties.map((s) => s.trim()).filter(Boolean),
    profile_image_url: input.profileImageUrl ? input.profileImageUrl.trim() : null,
    greeting: input.greeting ? input.greeting.trim() : null,
    biography: input.biography,
    // 표시 섹션은 Admin 전용 설정 → 전체 수정 경로에서만 갱신(본인 RPC 는 미포함).
    sections: input.sections,
  };
}

export function useManagerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  // Admin: 타 심사역 포함 전체 수정 (RLS managers_update_admin)
  const updateAsAdmin = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ManagerInput }) => {
      const { error } = await supabase.from(TABLE).update(toAdminRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 본인: 허용 컬럼만 갱신하는 SECURITY DEFINER RPC (직급/소속/역할 제외)
  const updateMyProfile = useMutation({
    mutationFn: async (input: ManagerInput) => {
      const { error } = await supabase.rpc('update_my_profile', {
        p_name: input.name.trim(),
        p_phone: input.phone ? input.phone.trim() : '',
        p_specialties: input.specialties.map((s) => s.trim()).filter(Boolean),
        p_biography: input.biography,
        p_profile_image_url: input.profileImageUrl ? input.profileImageUrl.trim() : '',
        p_greeting: input.greeting ? input.greeting.trim() : '',
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 약력·소개는 기본 수정에서 분리해 상세 카드에서 부분 저장한다.
  // Admin 은 컬럼 직접 UPDATE, 본인은 update_my_profile RPC(허용 컬럼 일괄 갱신)로만 가능하므로
  // 바뀐 필드 외 나머지(이름·연락처·관심분야·이미지·다른 텍스트)는 현재값을 그대로 실어 보낸다.
  const updateBiography = useMutation({
    mutationFn: async ({
      manager,
      biography,
      mode,
    }: {
      manager: Manager;
      biography: Biography;
      mode: 'admin' | 'self';
    }) => {
      if (mode === 'admin') {
        const { error } = await supabase.from(TABLE).update({ biography }).eq('id', manager.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('update_my_profile', {
          p_name: manager.name,
          p_phone: manager.phone,
          p_specialties: manager.specialties,
          p_biography: biography,
          p_profile_image_url: manager.profileImageUrl,
          p_greeting: manager.greeting,
        });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const updateIntro = useMutation({
    mutationFn: async ({
      manager,
      greeting,
      mode,
    }: {
      manager: Manager;
      greeting: string;
      mode: 'admin' | 'self';
    }) => {
      const trimmed = greeting.trim();
      if (mode === 'admin') {
        const { error } = await supabase
          .from(TABLE)
          .update({ greeting: trimmed ? trimmed : null })
          .eq('id', manager.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('update_my_profile', {
          p_name: manager.name,
          p_phone: manager.phone,
          p_specialties: manager.specialties,
          p_biography: manager.biography,
          p_profile_image_url: manager.profileImageUrl,
          p_greeting: trimmed,
        });
        if (error) throw error;
      }
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

  return { updateAsAdmin, updateMyProfile, updateBiography, updateIntro, remove };
}

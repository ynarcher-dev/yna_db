import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useListQuery } from '@/hooks/useListQuery';
import {
  mapExpertRow,
  mapExpertRatingRow,
  type Expert,
  type ExpertRow,
  type ExpertRating,
  type ExpertRatingRow,
} from '@/types/expert';
import type { ExpertInput } from '@/schemas/expert';

/**
 * 전문가 데이터 훅 (9_experts.md / 17_conventions.md 2·3장).
 * 협력사(usePartners) 패턴을 그대로 복제하고, 전문가 고유로 멘토링 평점
 * (view_expert_ratings) 단건 조회를 추가한다. 변이는 try-catch 대신 raw 에러를
 * 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'experts';
// created_by FK 로 작성자(심사역) 이름을 임베드 (PostgREST resource embedding)
const SELECT_WITH_AUTHOR = '*, author:managers!experts_created_by_fkey(name)';

interface ExpertsListArgs {
  search: string;
  expertType?: string;
  isAvailable?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useExpertsList(args: ExpertsListArgs) {
  const query = useListQuery<ExpertRow>({
    table: TABLE,
    columns: SELECT_WITH_AUTHOR,
    searchColumns: ['name', 'company', 'position', 'email'],
    search: args.search,
    filters: { expert_type: args.expertType, is_available: args.isAvailable },
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    ...query,
    experts: (query.data?.rows ?? []).map(mapExpertRow),
    total: query.data?.total ?? 0,
  };
}

export function useExpert(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Expert> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_AUTHOR)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapExpertRow(data as ExpertRow);
    },
  });
}

/** 멘토링 평점/건수 집계 (view_expert_ratings). 이력이 없으면 평점 null. */
export function useExpertRating(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'rating', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ExpertRating> => {
      const { data, error } = await supabase
        .from('view_expert_ratings')
        .select('*')
        .eq('expert_id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data
        ? mapExpertRatingRow(data as ExpertRatingRow)
        : { mentoringCount: 0, averageRating: null };
    },
  });
}

/**
 * 여러 전문가의 멘토링 평점/건수를 한 번에 조회 (목록 화면용).
 * 현재 페이지에 보이는 전문가 id 배열로 view_expert_ratings 를 in 조회하고
 * id→평점 맵으로 반환한다. id 가 없으면 비활성.
 */
export function useExpertRatings(ids: string[]) {
  return useQuery({
    queryKey: [TABLE, 'ratings', ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, ExpertRating>> => {
      const { data, error } = await supabase
        .from('view_expert_ratings')
        .select('*')
        .in('expert_id', ids);
      if (error) throw error;
      const map: Record<string, ExpertRating> = {};
      for (const row of (data ?? []) as ExpertRatingRow[]) {
        map[row.expert_id] = mapExpertRatingRow(row);
      }
      return map;
    },
  });
}

/** 폼 입력(camelCase) → DB row(snake_case). 빈 연락처는 NULL, 이메일은 소문자화. */
function toRow(input: ExpertInput) {
  return {
    name: input.name.trim(),
    company: input.company.trim(),
    position: input.position.trim(),
    phone: input.phone ? input.phone.trim() : null,
    email: input.email.trim().toLowerCase(),
    expert_type: input.expertType,
    specialties: input.specialties.map((s) => s.trim()).filter(Boolean),
    is_available: input.isAvailable,
    profile_image_url: input.profileImageUrl ? input.profileImageUrl.trim() : null,
    greeting: input.greeting ? input.greeting.trim() : null,
    biography: input.biography,
  };
}

export function useExpertMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: ExpertInput) => {
      const { error } = await supabase.from(TABLE).insert(toRow(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ExpertInput }) => {
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

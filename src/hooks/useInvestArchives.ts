import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  mapInvestArchiveRow,
  type InvestArchive,
  type InvestArchiveRow,
} from '@/types/investArchive';
import type { InvestArchiveInput } from '@/schemas/investArchive';

/**
 * 투자 자료실 데이터 훅 (22_invest_archives.md / 17_conventions.md 2·3장).
 * 게시판형: 상단 고정(is_pinned) 글을 항상 최상단에 두기 위해 useListQuery(단일 정렬) 대신
 * is_pinned DESC 1차 + 선택 정렬 2차로 직접 질의한다. 검색=제목·본문, 필터=카테고리.
 * 변이는 raw 에러를 전파해 호출부(useAppToast)가 피드백하도록 한다.
 */
const TABLE = 'invest_archives';
const SELECT_WITH_RELATIONS = '*, author:managers!invest_archives_created_by_fkey(name)';

interface InvestArchivesListArgs {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useInvestArchivesList(args: InvestArchivesListArgs) {
  const query = useQuery({
    queryKey: [TABLE, 'list', args],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ rows: InvestArchive[]; total: number }> => {
      let q = supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS, { count: 'exact' })
        .is('deleted_at', null);

      const term = args.search.trim();
      if (term) q = q.or(`title.ilike.%${term}%,content.ilike.%${term}%`);

      const from = (args.page - 1) * args.pageSize;
      // 고정 공지를 항상 맨 위로(1차) + 선택 정렬(2차).
      const { data, error, count } = await q
        .order('is_pinned', { ascending: false })
        .order(args.sortBy, { ascending: args.sortOrder === 'asc' })
        .range(from, from + args.pageSize - 1);

      if (error) throw error;
      return {
        rows: (data as unknown as InvestArchiveRow[]).map(mapInvestArchiveRow),
        total: count ?? 0,
      };
    },
  });

  return {
    ...query,
    archives: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useInvestArchive(id: string | undefined) {
  return useQuery({
    queryKey: [TABLE, 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<InvestArchive> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id as string)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return mapInvestArchiveRow(data as InvestArchiveRow);
    },
  });
}

/** 상세 진입 시 조회수 1 증가 (SECURITY DEFINER RPC). 실패는 조용히 무시(부가 기능). */
export async function incrementArchiveViews(id: string): Promise<void> {
  await supabase.rpc('increment_archive_views', { p_id: id });
}

function toRow(input: InvestArchiveInput) {
  return {
    title: input.title.trim(),
    is_pinned: input.isPinned,
    content: input.content ? input.content.trim() : null,
    sections: input.sections,
  };
}

export function useInvestArchiveMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE] });

  const create = useMutation({
    mutationFn: async (input: InvestArchiveInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from(TABLE).insert(toRow(input)).select('id').single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: InvestArchiveInput }) => {
      const { error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // 소프트 딜리트 — RLS 상 작성자 본인(Manager) 또는 Admin 만 가능(22.4).
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

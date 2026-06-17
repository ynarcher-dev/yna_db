import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 그룹(departments) 조회 보조 훅. 소속 계층 개편(2026-06-17) 이후 그룹은 팀의 상위 분류이며
 * 별도 관리 페이지가 없다(팀 폼의 콤보박스로 선택/자동생성, useTeams.useGroupNameOptions).
 * 여기서는 심사역 목록의 '소속(그룹)' 필터용 옵션만 제공한다.
 */
const TABLE = 'departments';

/** 그룹 Select 옵션 (id·name). 미삭제 그룹을 이름순으로. */
export function useDepartmentOptions() {
  return useQuery({
    queryKey: [TABLE, 'options'],
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d) => ({ value: d.id as string, label: d.name as string }));
    },
  });
}

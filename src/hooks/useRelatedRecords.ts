import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * 역방향 연계 조회 공통 훅 (양방향 연결의 '보여지는 쪽').
 * 조인/이력 테이블에서 특정 엔티티를 참조하는 행들을 상대 레코드 이름과 함께 읽어온다.
 * 예: 심사역 상세에서 startup_managers(manager_id=X) → 담당 스타트업 목록.
 * 모두 읽기 전용이며 RLS SELECT(0004, 전 직원)로 동작한다. 임베드는 caller 가 TRow 로 단언한다.
 */
export function useRelatedRecords<TRow>(args: {
  /** react-query 캐시 키 */
  key: unknown[];
  table: string;
  /** PostgREST select (상대 레코드 임베드 포함) */
  select: string;
  filterColumn: string;
  filterId: string | undefined;
  order?: { column: string; ascending?: boolean };
  /** 대상 테이블에 deleted_at 이 있어 미삭제만 조회할 때 true (예: 부서원 managers) */
  softDelete?: boolean;
}) {
  const query = useQuery({
    queryKey: args.key,
    enabled: Boolean(args.filterId),
    queryFn: async (): Promise<TRow[]> => {
      let q = supabase
        .from(args.table)
        .select(args.select)
        .eq(args.filterColumn, args.filterId as string);
      if (args.softDelete) q = q.is('deleted_at', null);
      if (args.order) q = q.order(args.order.column, { ascending: args.order.ascending ?? true });
      const { data, error } = await q;
      if (error) throw error;
      // PostgREST 임베드는 단일 FK 도 배열 타입으로 추론하므로 unknown 경유로 단언한다.
      return data as unknown as TRow[];
    },
  });
  return { ...query, rows: query.data ?? [] };
}

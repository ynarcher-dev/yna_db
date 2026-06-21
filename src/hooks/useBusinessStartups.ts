import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapStartupRow, type Startup, type StartupRow } from '@/types/startup';
import { mapBusinessRow, type Business, type BusinessRow } from '@/types/business';
import type { BusinessStartupStatus } from '@/types/database';

/**
 * 사업 참여 스타트업(다대다) 데이터 훅 (business_startups, status).
 * 배치 기수에 참여한 스타트업을 추가/상태변경/해제한다. 실제 INSERT/UPDATE/DELETE.
 * 표시는 스타트업 목록과 동일한 컬럼이 되도록 목록과 같은 임베드 후 mapStartupRow 를 재사용한다.
 */
const TABLE = 'business_startups';

/** 참여 스타트업 1행: 조인 PK + 보육상태 + 목록과 동일한 스타트업 도메인 객체. */
export interface BusinessStartupRow {
  id: string;
  status: BusinessStartupStatus;
  startup: Startup | null;
}
interface BusinessStartupRaw {
  id: string;
  status: BusinessStartupStatus;
  startup: StartupRow | null;
}

export function useBusinessStartups(businessId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BusinessStartupRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, status, startup:startups(*, startup_managers(manager:managers(name)))')
        .eq('business_id', businessId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as BusinessStartupRaw[]).map((r) => ({
        id: r.id,
        status: r.status,
        startup: r.startup ? mapStartupRow(r.startup) : null,
      }));
    },
  });
  return { ...query, participants: query.data ?? [] };
}

// ── 역방향(스타트업 기준): 스타트업 상세에서 참여 사업을 매핑한다 ──────────────
/** 스타트업 상세 "참여 사업" 역방향 캐시 키 (StartupRelatedBlocks 와 공유). */
export const startupBusinessesKey = (startupId: string) =>
  [TABLE, 'by-startup', startupId] as const;

/** 역방향 행: 조인 메타(id=조인 PK, 보육상태) + 목록과 동일한 사업 도메인 객체. */
export interface StartupBusinessRow {
  id: string;
  status: BusinessStartupStatus;
  business: Business | null;
}

/** 매핑된 사업을 목록 화면과 동일한 컬럼으로 보이도록, 목록과 같은 관계 임베드까지 끌어온다. */
const REVERSE_BUSINESS_SELECT =
  'id, status, business:businesses(*, business_managers(manager:managers(name)))';

interface StartupBusinessRaw {
  id: string;
  status: BusinessStartupStatus;
  business: BusinessRow | null;
}

export function useStartupBusinesses(startupId: string | undefined) {
  const query = useQuery({
    queryKey: startupBusinessesKey(startupId as string),
    enabled: Boolean(startupId),
    queryFn: async (): Promise<StartupBusinessRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(REVERSE_BUSINESS_SELECT)
        .eq('startup_id', startupId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as StartupBusinessRaw[]).map((r) => ({
        id: r.id,
        status: r.status,
        business: r.business ? mapBusinessRow(r.business) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useStartupBusinessMutations(startupId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: startupBusinessesKey(startupId) });

  const add = useMutation({
    mutationFn: async ({
      businessId,
      status,
    }: {
      businessId: string;
      status: BusinessStartupStatus;
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ business_id: businessId, startup_id: startupId, status });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BusinessStartupStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, updateStatus, remove };
}

export function useBusinessStartupMutations(businessId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, businessId] });

  const add = useMutation({
    mutationFn: async ({
      startupId,
      status,
    }: {
      startupId: string;
      status: BusinessStartupStatus;
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ business_id: businessId, startup_id: startupId, status });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BusinessStartupStatus }) => {
      const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (joinId: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', joinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, updateStatus, remove };
}

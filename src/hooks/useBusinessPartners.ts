import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapPartnerRow, type Partner, type PartnerRow } from '@/types/partner';
import { mapBusinessRow, type Business, type BusinessRow } from '@/types/business';

/**
 * 사업-협력사(기관) 다대다 훅 (business_partners, 상태값 없음, 0046).
 * 표시는 각 도메인 목록과 동일한 컬럼이 되도록, 목록과 같은 임베드 후 map{Domain}Row 를 재사용한다.
 * - 정방향(사업 기준): 사업 상세에서 참여 협력사를 연결/해제한다.
 * - 역방향(협력사 기준): 협력사 상세에서 참여 사업을 연결/해제하고, 없으면 신규 개설·즉시 매핑.
 */
const TABLE = 'business_partners';

// ── 정방향(사업 기준): 참여 협력사 ─────────────────────────────────────────
export interface BusinessPartnerRow {
  id: string;
  partner: Partner | null;
}
interface BusinessPartnerRaw {
  id: string;
  partner: PartnerRow | null;
}

export function useBusinessPartners(businessId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, 'by-business', businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BusinessPartnerRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, partner:partners(*)')
        .eq('business_id', businessId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as BusinessPartnerRaw[]).map((r) => ({
        id: r.id,
        partner: r.partner ? mapPartnerRow(r.partner) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useBusinessPartnerMutations(businessId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, 'by-business', businessId] });

  const add = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ business_id: businessId, partner_id: partnerId });
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

  return { add, remove };
}

// ── 역방향(협력사 기준): 참여 사업 ─────────────────────────────────────────
export const partnerBusinessesKey = (partnerId: string) =>
  [TABLE, 'by-partner', partnerId] as const;

export interface PartnerBusinessRow {
  id: string;
  business: Business | null;
}
interface PartnerBusinessRaw {
  id: string;
  business: BusinessRow | null;
}

export function usePartnerBusinesses(partnerId: string | undefined) {
  const query = useQuery({
    queryKey: partnerBusinessesKey(partnerId as string),
    enabled: Boolean(partnerId),
    queryFn: async (): Promise<PartnerBusinessRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, business:businesses(*, business_managers(manager:managers(name)))')
        .eq('partner_id', partnerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as PartnerBusinessRaw[]).map((r) => ({
        id: r.id,
        business: r.business ? mapBusinessRow(r.business) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function usePartnerBusinessMutations(partnerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: partnerBusinessesKey(partnerId) });

  const add = useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ business_id: businessId, partner_id: partnerId });
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

  return { add, remove };
}

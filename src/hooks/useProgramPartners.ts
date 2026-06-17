import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { mapPartnerRow, type Partner, type PartnerRow } from '@/types/partner';
import { mapProgramRow, type Program, type ProgramRow } from '@/types/program';

/**
 * 프로그램-협력사(기관) 다대다 훅 (program_partners, 상태값 없음, 0046).
 * 표시는 각 도메인 목록과 동일한 컬럼이 되도록, 목록과 같은 임베드 후 map{Domain}Row 를 재사용한다.
 * - 정방향(프로그램 기준): 프로그램 상세에서 참여 협력사를 연결/해제한다.
 * - 역방향(협력사 기준): 협력사 상세에서 참여 프로그램을 연결/해제하고, 없으면 신규 개설·즉시 매핑.
 */
const TABLE = 'program_partners';

// ── 정방향(프로그램 기준): 참여 협력사 ─────────────────────────────────────────
export interface ProgramPartnerRow {
  id: string;
  partner: Partner | null;
}
interface ProgramPartnerRaw {
  id: string;
  partner: PartnerRow | null;
}

export function useProgramPartners(programId: string | undefined) {
  const query = useQuery({
    queryKey: [TABLE, 'by-program', programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramPartnerRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, partner:partners(*)')
        .eq('program_id', programId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as ProgramPartnerRaw[]).map((r) => ({
        id: r.id,
        partner: r.partner ? mapPartnerRow(r.partner) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function useProgramPartnerMutations(programId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [TABLE, 'by-program', programId] });

  const add = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, partner_id: partnerId });
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

// ── 역방향(협력사 기준): 참여 프로그램 ─────────────────────────────────────────
export const partnerProgramsKey = (partnerId: string) =>
  [TABLE, 'by-partner', partnerId] as const;

export interface PartnerProgramRow {
  id: string;
  program: Program | null;
}
interface PartnerProgramRaw {
  id: string;
  program: ProgramRow | null;
}

export function usePartnerPrograms(partnerId: string | undefined) {
  const query = useQuery({
    queryKey: partnerProgramsKey(partnerId as string),
    enabled: Boolean(partnerId),
    queryFn: async (): Promise<PartnerProgramRow[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, program:programs(*, program_managers(manager:managers(name)))')
        .eq('partner_id', partnerId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as PartnerProgramRaw[]).map((r) => ({
        id: r.id,
        program: r.program ? mapProgramRow(r.program) : null,
      }));
    },
  });
  return { ...query, rows: query.data ?? [] };
}

export function usePartnerProgramMutations(partnerId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: partnerProgramsKey(partnerId) });

  const add = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .insert({ program_id: programId, partner_id: partnerId });
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

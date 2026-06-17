import type { PartnerType } from './database';
import { normalizePartnerSections, type PartnerSections } from '@/lib/partnerSections';

/** 교류 협력 이력 로그 1건 (12_partners.md interaction_log) */
export interface InteractionLogEntry {
  date: string; // YYYY-MM-DD
  content: string;
}

/** 협력사 (camelCase 화면 모델, 12_partners.md Partner) */
export interface Partner {
  id: string;
  name: string;
  /** 담당 부서명 (예: 창업진흥과). 없으면 빈 문자열 */
  department: string;
  partnerType: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  interactionLog: InteractionLogEntry[];
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: PartnerSections;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/** DB row (snake_case). author 는 created_by FK 임베드 결과 */
export interface PartnerRow {
  id: string;
  name: string;
  department: string | null;
  partner_type: PartnerType;
  contact_person: string;
  phone: string | null;
  email: string | null;
  interaction_log: InteractionLogEntry[] | null;
  sections: Partial<Record<string, boolean>> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author: { name: string } | null;
}

export function mapPartnerRow(row: PartnerRow): Partner {
  return {
    id: row.id,
    name: row.name,
    department: row.department ?? '',
    partnerType: row.partner_type,
    contactPerson: row.contact_person,
    phone: row.phone ?? '',
    email: row.email ?? '',
    interactionLog: row.interaction_log ?? [],
    sections: normalizePartnerSections(row.sections),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

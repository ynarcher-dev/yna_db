import { Tag } from 'antd';
import { PARTNER_TYPE_COLOR, PARTNER_TYPE_LABEL, badgeTone } from '@/lib/labels';
import type { PartnerType } from '@/types/database';

/** 협력사 유형 배지 (12_partners.md 12.3 — 협력 유형 배지). */
export function PartnerTypeTag({ type }: { type: PartnerType }) {
  return <Tag {...badgeTone(PARTNER_TYPE_COLOR[type])}>{PARTNER_TYPE_LABEL[type]}</Tag>;
}

import { Tag } from 'antd';
import { EXPERT_TYPE_COLOR, EXPERT_TYPE_LABEL, badgeTone } from '@/lib/labels';
import type { ExpertType } from '@/types/database';

/** 전문가 유형 배지 (9_experts.md 9.3 — 멘토/감사/자문). */
export function ExpertTypeTag({ type }: { type: ExpertType }) {
  return <Tag {...badgeTone(EXPERT_TYPE_COLOR[type])}>{EXPERT_TYPE_LABEL[type]}</Tag>;
}

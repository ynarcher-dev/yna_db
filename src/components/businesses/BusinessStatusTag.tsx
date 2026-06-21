import { Tag } from 'antd';
import { BUSINESS_STATUS_COLOR, BUSINESS_STATUS_LABEL, badgeTone } from '@/lib/labels';
import type { BusinessStatus } from '@/types/database';

/** 사업 진행 상태 배지 (projects.stage 와 동일한 5단계). */
export function BusinessStatusTag({ status }: { status: BusinessStatus }) {
  return <Tag {...badgeTone(BUSINESS_STATUS_COLOR[status])}>{BUSINESS_STATUS_LABEL[status]}</Tag>;
}

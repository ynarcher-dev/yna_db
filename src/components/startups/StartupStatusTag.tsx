import { Tag } from 'antd';
import { MANAGEMENT_STATUS_COLOR, MANAGEMENT_STATUS_LABEL } from '@/lib/labels';
import type { ManagementStatus } from '@/types/database';

/**
 * 관리 현황 배지. '기타(other)'는 자유 텍스트(etc)를 표시하고, 없으면 '기타'.
 */
export function StartupStatusTag({
  status,
  etc,
}: {
  status: ManagementStatus;
  etc?: string;
}) {
  const label = status === 'other' ? etc?.trim() || MANAGEMENT_STATUS_LABEL.other : MANAGEMENT_STATUS_LABEL[status];
  return <Tag color={MANAGEMENT_STATUS_COLOR[status]}>{label}</Tag>;
}

import { Tag } from 'antd';
import { badgeTone } from '@/lib/labels';

/** 매칭 가능 여부 배지 (9_experts.md 9.3). 가능=green(진행), 불가=neutral(흰/회). */
export function AvailabilityTag({ available }: { available: boolean }) {
  return available ? (
    <Tag color="green">매칭 가능</Tag>
  ) : (
    <Tag {...badgeTone('neutral')}>매칭 불가</Tag>
  );
}

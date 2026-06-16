import { Tag } from 'antd';

/** 매칭 가능 여부 배지 (9_experts.md 9.3 — 매칭 가능 상태). */
export function AvailabilityTag({ available }: { available: boolean }) {
  return available ? (
    <Tag color="success">매칭 가능</Tag>
  ) : (
    <Tag color="default">매칭 불가</Tag>
  );
}

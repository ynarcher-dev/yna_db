import { Tag } from 'antd';
import {
  MATCHING_APPLICATION_STATUS_COLOR,
  MATCHING_APPLICATION_STATUS_LABEL,
  badgeTone,
} from '@/lib/labels';
import type { MatchingApplicationStatus } from '@/types/database';

/** 매칭 신청/연계 진행 상태 배지 (신청완료/추천완료/최종선정/탈락). */
export function MatchingApplicationStatusTag({ status }: { status: MatchingApplicationStatus }) {
  return (
    <Tag {...badgeTone(MATCHING_APPLICATION_STATUS_COLOR[status])}>
      {MATCHING_APPLICATION_STATUS_LABEL[status]}
    </Tag>
  );
}

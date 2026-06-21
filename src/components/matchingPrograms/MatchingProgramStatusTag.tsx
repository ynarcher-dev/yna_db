import { Tag } from 'antd';
import {
  MATCHING_PROGRAM_STATUS_COLOR,
  MATCHING_PROGRAM_STATUS_LABEL,
  badgeTone,
} from '@/lib/labels';
import type { MatchingProgramStatus } from '@/types/database';

/** 매칭 프로그램 상태 배지 (모집중/마감). */
export function MatchingProgramStatusTag({ status }: { status: MatchingProgramStatus }) {
  return (
    <Tag {...badgeTone(MATCHING_PROGRAM_STATUS_COLOR[status])}>
      {MATCHING_PROGRAM_STATUS_LABEL[status]}
    </Tag>
  );
}

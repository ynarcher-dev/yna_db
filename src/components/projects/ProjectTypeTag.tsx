import { Tag } from 'antd';
import { PROJECT_TYPE_COLOR, PROJECT_TYPE_LABEL, badgeTone } from '@/lib/labels';
import type { ProjectType } from '@/types/database';

/**
 * 프로젝트 유형 배지 (M&A / 신사업 / 기타).
 * '기타'면 자유 입력값(etc)을 배지 텍스트로 표시한다(없으면 '기타').
 */
export function ProjectTypeTag({ type, etc }: { type: ProjectType; etc?: string }) {
  const label = type === 'other' && etc ? etc : PROJECT_TYPE_LABEL[type];
  return <Tag {...badgeTone(PROJECT_TYPE_COLOR[type])}>{label}</Tag>;
}

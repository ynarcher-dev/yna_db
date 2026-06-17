import { Tag } from 'antd';
import { PROJECT_PRIORITY_COLOR, PROJECT_PRIORITY_LABEL } from '@/lib/labels';
import type { ProjectPriority } from '@/types/database';

/** 프로젝트 우선순위 배지 (높음/보통/낮음). */
export function ProjectPriorityTag({ priority }: { priority: ProjectPriority }) {
  return <Tag color={PROJECT_PRIORITY_COLOR[priority]}>{PROJECT_PRIORITY_LABEL[priority]}</Tag>;
}

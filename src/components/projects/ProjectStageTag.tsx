import { Tag } from 'antd';
import { PROJECT_STAGE_COLOR, PROJECT_STAGE_LABEL, badgeTone } from '@/lib/labels';
import type { ProjectStage } from '@/types/database';

/** 프로젝트 진행 단계 배지. */
export function ProjectStageTag({ stage }: { stage: ProjectStage }) {
  return <Tag {...badgeTone(PROJECT_STAGE_COLOR[stage])}>{PROJECT_STAGE_LABEL[stage]}</Tag>;
}

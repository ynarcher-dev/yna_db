import { Tag } from 'antd';
import { INVESTMENT_STAGE_COLOR, type InvestmentStage } from '@/lib/labels';

/** 투자 유치 단계 배지 (6_startups.md 6.3 — 투자 단계 배지). */
export function StartupStageTag({ stage }: { stage: string }) {
  const color = INVESTMENT_STAGE_COLOR[stage as InvestmentStage] ?? 'default';
  return <Tag color={color}>{stage}</Tag>;
}

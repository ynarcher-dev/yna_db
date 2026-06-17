import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { RelatedListCard, type RelatedItem } from '@/components/common/RelatedListCard';
import { PROGRAM_STARTUP_STATUS_LABEL, PROGRAM_STARTUP_STATUS_COLOR } from '@/lib/labels';
import { formatKRWShort, formatPercent } from '@/lib/formatters';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 스타트업 상세 역방향 연계 블록 (양방향 연결의 '보여지는 쪽').
 * 이 스타트업이 참여한 프로그램·프로젝트와, 이 스타트업에 투자한 펀드를 읽기 전용으로 보여준다.
 */
interface ProgramRow {
  id: string;
  status: ProgramStartupStatus;
  program: { id: string; name: string; generation: number } | null;
}
interface ProjectRow {
  id: string;
  project: { id: string; name: string } | null;
}
interface FundRow {
  id: string;
  investment_amount: number | string;
  share_percentage: number | string;
  fund: { id: string; name: string } | null;
}

export function StartupRelatedBlocks({ startupId }: { startupId: string }) {
  const programs = useRelatedRecords<ProgramRow>({
    key: ['program_startups', 'by-startup', startupId],
    table: 'program_startups',
    select: 'id, status, program:programs(id, name, generation)',
    filterColumn: 'startup_id',
    filterId: startupId,
  });
  const projects = useRelatedRecords<ProjectRow>({
    key: ['project_startups', 'by-startup', startupId],
    table: 'project_startups',
    select: 'id, project:projects(id, name)',
    filterColumn: 'startup_id',
    filterId: startupId,
  });
  const funds = useRelatedRecords<FundRow>({
    key: ['fund_investments', 'by-startup', startupId],
    table: 'fund_investments',
    select: 'id, investment_amount, share_percentage, fund:funds(id, name)',
    filterColumn: 'startup_id',
    filterId: startupId,
    order: { column: 'investment_date', ascending: false },
  });

  const programItems: RelatedItem[] = programs.rows
    .filter((r) => r.program)
    .map((r) => ({
      key: r.id,
      to: `/programs/${r.program!.id}`,
      primary: r.program!.name,
      secondary: `${r.program!.generation}기`,
      badge: {
        text: PROGRAM_STARTUP_STATUS_LABEL[r.status],
        color: PROGRAM_STARTUP_STATUS_COLOR[r.status],
      },
    }));

  const projectItems: RelatedItem[] = projects.rows
    .filter((r) => r.project)
    .map((r) => ({ key: r.id, to: `/projects/${r.project!.id}`, primary: r.project!.name }));

  const fundItems: RelatedItem[] = funds.rows
    .filter((r) => r.fund)
    .map((r) => ({
      key: r.id,
      to: `/funds/${r.fund!.id}`,
      primary: r.fund!.name,
      secondary: `${formatKRWShort(Number(r.investment_amount))} · ${formatPercent(Number(r.share_percentage))}`,
    }));

  return (
    <>
      <RelatedListCard
        title="참여 프로그램"
        items={programItems}
        isLoading={programs.isLoading}
        emptyText="참여한 프로그램이 없습니다."
      />
      <RelatedListCard
        title="참여 프로젝트"
        items={projectItems}
        isLoading={projects.isLoading}
        emptyText="참여한 프로젝트가 없습니다."
      />
      <RelatedListCard
        title="투자받은 펀드"
        items={fundItems}
        isLoading={funds.isLoading}
        emptyText="투자받은 펀드 내역이 없습니다."
      />
    </>
  );
}

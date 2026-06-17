import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { RelatedListCard, type RelatedItem } from '@/components/common/RelatedListCard';
import { PROGRAM_MANAGER_ROLE_LABEL, PROGRAM_MANAGER_ROLE_COLOR } from '@/lib/labels';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 심사역 상세 역방향 연계 블록 (양방향 연결의 '보여지는 쪽').
 * 이 심사역이 담당하는 스타트업·프로젝트와 운영하는 프로그램을 읽기 전용으로 보여준다.
 */
interface StartupRow {
  id: string;
  startup: { id: string; name: string } | null;
}
interface ProjectRow {
  id: string;
  project: { id: string; name: string } | null;
}
interface ProgramRow {
  id: string;
  role: ProgramManagerRole;
  program: { id: string; name: string; generation: number } | null;
}

export function ManagerRelatedBlocks({ managerId }: { managerId: string }) {
  const startups = useRelatedRecords<StartupRow>({
    key: ['startup_managers', 'by-manager', managerId],
    table: 'startup_managers',
    select: 'id, startup:startups(id, name)',
    filterColumn: 'manager_id',
    filterId: managerId,
  });
  const projects = useRelatedRecords<ProjectRow>({
    key: ['project_managers', 'by-manager', managerId],
    table: 'project_managers',
    select: 'id, project:projects(id, name)',
    filterColumn: 'manager_id',
    filterId: managerId,
  });
  const programs = useRelatedRecords<ProgramRow>({
    key: ['program_managers', 'by-manager', managerId],
    table: 'program_managers',
    select: 'id, role, program:programs(id, name, generation)',
    filterColumn: 'manager_id',
    filterId: managerId,
  });

  const startupItems: RelatedItem[] = startups.rows
    .filter((r) => r.startup)
    .map((r) => ({ key: r.id, to: `/startups/${r.startup!.id}`, primary: r.startup!.name }));

  const projectItems: RelatedItem[] = projects.rows
    .filter((r) => r.project)
    .map((r) => ({ key: r.id, to: `/projects/${r.project!.id}`, primary: r.project!.name }));

  const programItems: RelatedItem[] = programs.rows
    .filter((r) => r.program)
    .map((r) => ({
      key: r.id,
      to: `/programs/${r.program!.id}`,
      primary: r.program!.name,
      secondary: `${r.program!.generation}기`,
      badge: {
        text: PROGRAM_MANAGER_ROLE_LABEL[r.role],
        color: PROGRAM_MANAGER_ROLE_COLOR[r.role],
      },
    }));

  return (
    <>
      <RelatedListCard
        title="담당 스타트업"
        items={startupItems}
        isLoading={startups.isLoading}
        emptyText="담당 중인 스타트업이 없습니다."
      />
      <RelatedListCard
        title="담당 프로젝트"
        items={projectItems}
        isLoading={projects.isLoading}
        emptyText="담당 중인 프로젝트가 없습니다."
      />
      <RelatedListCard
        title="운영 프로그램"
        items={programItems}
        isLoading={programs.isLoading}
        emptyText="운영 중인 프로그램이 없습니다."
      />
    </>
  );
}

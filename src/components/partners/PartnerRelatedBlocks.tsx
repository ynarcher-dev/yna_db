import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { RelatedListCard, type RelatedItem } from '@/components/common/RelatedListCard';

/**
 * 협력사 상세 역방향 연계 블록 (양방향 연결의 '보여지는 쪽').
 * 이 협력사가 참여한 프로젝트(project_partners)를 읽기 전용으로 보여준다.
 */
interface ProjectRow {
  id: string;
  project: { id: string; name: string } | null;
}

export function PartnerRelatedBlocks({ partnerId }: { partnerId: string }) {
  const projects = useRelatedRecords<ProjectRow>({
    key: ['project_partners', 'by-partner', partnerId],
    table: 'project_partners',
    select: 'id, project:projects(id, name)',
    filterColumn: 'partner_id',
    filterId: partnerId,
  });

  const items: RelatedItem[] = projects.rows
    .filter((r) => r.project)
    .map((r) => ({ key: r.id, to: `/projects/${r.project!.id}`, primary: r.project!.name }));

  return (
    <RelatedListCard
      title="참여 프로젝트"
      items={items}
      isLoading={projects.isLoading}
      emptyText="참여한 프로젝트가 없습니다."
    />
  );
}

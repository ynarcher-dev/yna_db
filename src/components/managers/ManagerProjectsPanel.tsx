import { useMemo } from 'react';
import { useManagerProjects } from '@/hooks/useManagerRelations';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { projectColumns } from '@/lib/listColumns';
import type { Project } from '@/types/project';

/**
 * 심사역 상세 "담당 프로젝트" 정방향 표시 패널 (project_managers '읽는 쪽', 읽기 전용).
 * 매핑·신규생성·연동해제는 제공하지 않는다. 매핑 편집은 프로젝트 상세의 '담당자' 카드에서 한다.
 * 표시는 프로젝트 목록과 동일한 컬럼 + 행 클릭 시 상세 이동.
 */
export function ManagerProjectsPanel({ managerId }: { managerId: string }) {
  const { rows, isLoading } = useManagerProjects(managerId);

  const projects = useMemo(
    () => rows.map((r) => r.project).filter((p): p is Project => Boolean(p)),
    [rows],
  );

  return (
    <RelatedTableCard<Project>
      title="담당 프로젝트"
      columns={projectColumns()}
      data={projects}
      isLoading={isLoading}
      emptyText="담당 중인 프로젝트가 없습니다."
      getHref={(p) => `/projects/${p.id}`}
    />
  );
}

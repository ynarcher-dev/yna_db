import { useMemo } from 'react';
import { useManagerProjects } from '@/hooks/useManagerRelations';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { projectColumns } from '@/lib/listColumns';
import { PROJECT_DOMAINS } from '@/views/projects/projectDomain';
import type { Project } from '@/types/project';

/**
 * 심사역 상세 "담당 프로젝트" 정방향 표시 패널 (project_managers '읽는 쪽', 읽기 전용).
 * M&A·신사업은 상호 배타적 도메인이라 유형별 카드로 분리해 표시한다.
 * 매핑·신규생성·연동해제는 제공하지 않는다. 매핑 편집은 프로젝트 상세의 '담당자' 카드에서 한다.
 */
export function ManagerProjectsPanel({ managerId }: { managerId: string }) {
  const { rows, isLoading } = useManagerProjects(managerId);

  const projects = useMemo(
    () => rows.map((r) => r.project).filter((p): p is Project => Boolean(p)),
    [rows],
  );

  return (
    <>
      {PROJECT_DOMAINS.map((domain) => (
        <RelatedTableCard<Project>
          key={domain.projectType}
          title={`담당 ${domain.shortLabel}`}
          columns={projectColumns()}
          data={projects.filter((p) => p.projectType === domain.projectType)}
          isLoading={isLoading}
          emptyText={`담당 중인 ${domain.shortLabel} 프로젝트가 없습니다.`}
          getHref={(p) => `${domain.basePath}/${p.id}`}
        />
      ))}
    </>
  );
}

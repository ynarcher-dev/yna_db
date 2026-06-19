import { useMemo } from 'react';
import { useStartupProjects } from '@/hooks/useProjectStartups';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { projectColumns } from '@/lib/listColumns';
import type { Project } from '@/types/project';

/**
 * 스타트업 상세 "참여 프로젝트" 정방향 표시 패널 (project_startups '읽는 쪽', 읽기 전용).
 * 매핑·신규생성·연동해제는 제공하지 않는다. 매핑 편집은 프로젝트 상세의 '매칭 스타트업' 카드에서 한다.
 * 표시는 프로젝트 목록과 동일한 컬럼 + 행 클릭 시 상세 이동.
 */
export function StartupProjectsPanel({ startupId }: { startupId: string }) {
  const { rows, isLoading } = useStartupProjects(startupId);

  const projects = useMemo(
    () => rows.map((r) => r.project).filter((p): p is Project => Boolean(p)),
    [rows],
  );

  return (
    <RelatedTableCard<Project>
      title="참여 프로젝트"
      columns={projectColumns()}
      data={projects}
      isLoading={isLoading}
      emptyText="참여한 프로젝트가 없습니다."
      getHref={(p) => `/projects/${p.id}`}
    />
  );
}

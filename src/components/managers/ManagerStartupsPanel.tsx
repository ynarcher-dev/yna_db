import { useMemo } from 'react';
import { useManagerStartups } from '@/hooks/useManagerRelations';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { startupColumns } from '@/lib/listColumns';
import type { Startup } from '@/types/startup';

/**
 * 심사역 상세 "담당 스타트업" 정방향 표시 패널 (startup_managers '읽는 쪽', 읽기 전용).
 * 매핑·신규생성·연동해제는 제공하지 않는다. 심사역↔스타트업 매핑 편집은 스타트업 상세의
 * '담당 심사역' 카드에서만 한다. 표시는 스타트업 목록과 동일한 컬럼 + 행 클릭 시 상세 이동.
 */
export function ManagerStartupsPanel({ managerId }: { managerId: string }) {
  const { rows, isLoading } = useManagerStartups(managerId);

  const startups = useMemo(
    () => rows.map((r) => r.startup).filter((s): s is Startup => Boolean(s)),
    [rows],
  );

  return (
    <RelatedTableCard<Startup>
      title="담당 스타트업"
      columns={startupColumns()}
      data={startups}
      isLoading={isLoading}
      emptyText="담당 중인 스타트업이 없습니다."
      getHref={(s) => `/startups/${s.id}`}
    />
  );
}

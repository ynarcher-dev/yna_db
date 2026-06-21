import { useMemo } from 'react';
import { Tag } from 'antd';
import type { TableProps } from 'antd';
import {
  useStartupBusinesses,
  type StartupBusinessRow,
} from '@/hooks/useBusinessStartups';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { businessColumns } from '@/lib/listColumns';
import { BUSINESS_STARTUP_STATUS_LABEL, BUSINESS_STARTUP_STATUS_COLOR, badgeTone } from '@/lib/labels';
import type { Business } from '@/types/business';

/**
 * 스타트업 상세 "참여 사업" 정방향 표시 패널 (business_startups '읽는 쪽', 읽기 전용).
 * 매핑·신규개설·상태변경·연동해제는 제공하지 않는다. 매핑 편집은 사업 상세의 '참여 스타트업'
 * 카드에서 한다. 표시는 사업 목록과 동일한 컬럼 + 보육 상태(읽기 전용 태그) + 행 클릭 시 상세 이동.
 */
export function StartupBusinessesPanel({ startupId }: { startupId: string }) {
  const { rows, isLoading } = useStartupBusinesses(startupId);

  const businesses = useMemo(
    () => rows.map((r) => r.business).filter((p): p is Business => Boolean(p)),
    [rows],
  );
  const metaByBusiness = useMemo(() => {
    const m = new Map<string, StartupBusinessRow>();
    rows.forEach((r) => {
      if (r.business) m.set(r.business.id, r);
    });
    return m;
  }, [rows]);

  // 목록 화면과 동일한 사업 고유 컬럼 + 이 관계에만 있는 보육상태(읽기 전용) 컬럼.
  const columns: TableProps<Business>['columns'] = [
    ...businessColumns(),
    {
      title: '보육 상태',
      key: 'status',
      width: 120,
      render: (_, p) => {
        const m = metaByBusiness.get(p.id);
        return m ? (
          <Tag {...badgeTone(BUSINESS_STARTUP_STATUS_COLOR[m.status])}>
            {BUSINESS_STARTUP_STATUS_LABEL[m.status]}
          </Tag>
        ) : null;
      },
    },
  ];

  return (
    <RelatedTableCard<Business>
      title="참여 사업"
      columns={columns}
      data={businesses}
      isLoading={isLoading}
      emptyText="참여한 사업이 없습니다."
      getHref={(p) => `/businesses/${p.id}`}
    />
  );
}

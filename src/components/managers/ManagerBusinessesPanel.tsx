import { useMemo } from 'react';
import { Tag } from 'antd';
import type { TableProps } from 'antd';
import {
  useManagerBusinesses,
  type ManagerBusinessRow,
} from '@/hooks/useManagerRelations';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { businessColumns } from '@/lib/listColumns';
import { BUSINESS_MANAGER_ROLE_LABEL, BUSINESS_MANAGER_ROLE_COLOR, badgeTone } from '@/lib/labels';
import type { Business } from '@/types/business';

/**
 * 심사역 상세 "운영 사업" 정방향 표시 패널 (business_managers '읽는 쪽', 읽기 전용).
 * 매핑·신규개설·역할변경·연동해제는 제공하지 않는다. 매핑 편집은 사업 상세의 '운영 심사역'
 * 카드에서 한다. 표시는 사업 목록과 동일한 컬럼 + 역할(읽기 전용 태그) + 행 클릭 시 상세 이동.
 */
export function ManagerBusinessesPanel({ managerId }: { managerId: string }) {
  const { rows, isLoading } = useManagerBusinesses(managerId);

  const businesses = useMemo(
    () => rows.map((r) => r.business).filter((p): p is Business => Boolean(p)),
    [rows],
  );
  const metaByBusiness = useMemo(() => {
    const m = new Map<string, ManagerBusinessRow>();
    rows.forEach((r) => {
      if (r.business) m.set(r.business.id, r);
    });
    return m;
  }, [rows]);

  // 목록 화면과 동일한 사업 고유 컬럼 + 이 관계에만 있는 역할(읽기 전용) 컬럼.
  const columns: TableProps<Business>['columns'] = [
    ...businessColumns(),
    {
      title: '역할',
      key: 'role',
      width: 120,
      render: (_, p) => {
        const m = metaByBusiness.get(p.id);
        return m ? (
          <Tag {...badgeTone(BUSINESS_MANAGER_ROLE_COLOR[m.role])}>
            {BUSINESS_MANAGER_ROLE_LABEL[m.role]}
          </Tag>
        ) : null;
      },
    },
  ];

  return (
    <RelatedTableCard<Business>
      title="운영 사업"
      columns={columns}
      data={businesses}
      isLoading={isLoading}
      emptyText="운영 중인 사업이 없습니다."
      getHref={(p) => `/businesses/${p.id}`}
    />
  );
}

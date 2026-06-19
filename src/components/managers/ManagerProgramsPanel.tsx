import { useMemo } from 'react';
import { Tag } from 'antd';
import type { TableProps } from 'antd';
import {
  useManagerPrograms,
  type ManagerProgramRow,
} from '@/hooks/useManagerRelations';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { programColumns } from '@/lib/listColumns';
import { PROGRAM_MANAGER_ROLE_LABEL, PROGRAM_MANAGER_ROLE_COLOR, badgeTone } from '@/lib/labels';
import type { Program } from '@/types/program';

/**
 * 심사역 상세 "운영 프로그램" 정방향 표시 패널 (program_managers '읽는 쪽', 읽기 전용).
 * 매핑·신규개설·역할변경·연동해제는 제공하지 않는다. 매핑 편집은 프로그램 상세의 '운영 심사역'
 * 카드에서 한다. 표시는 프로그램 목록과 동일한 컬럼 + 역할(읽기 전용 태그) + 행 클릭 시 상세 이동.
 */
export function ManagerProgramsPanel({ managerId }: { managerId: string }) {
  const { rows, isLoading } = useManagerPrograms(managerId);

  const programs = useMemo(
    () => rows.map((r) => r.program).filter((p): p is Program => Boolean(p)),
    [rows],
  );
  const metaByProgram = useMemo(() => {
    const m = new Map<string, ManagerProgramRow>();
    rows.forEach((r) => {
      if (r.program) m.set(r.program.id, r);
    });
    return m;
  }, [rows]);

  // 목록 화면과 동일한 프로그램 고유 컬럼 + 이 관계에만 있는 역할(읽기 전용) 컬럼.
  const columns: TableProps<Program>['columns'] = [
    ...programColumns(),
    {
      title: '역할',
      key: 'role',
      width: 120,
      render: (_, p) => {
        const m = metaByProgram.get(p.id);
        return m ? (
          <Tag {...badgeTone(PROGRAM_MANAGER_ROLE_COLOR[m.role])}>
            {PROGRAM_MANAGER_ROLE_LABEL[m.role]}
          </Tag>
        ) : null;
      },
    },
  ];

  return (
    <RelatedTableCard<Program>
      title="운영 프로그램"
      columns={columns}
      data={programs}
      isLoading={isLoading}
      emptyText="운영 중인 프로그램이 없습니다."
      getHref={(p) => `/programs/${p.id}`}
    />
  );
}

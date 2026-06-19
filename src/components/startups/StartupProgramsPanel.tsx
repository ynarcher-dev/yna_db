import { useMemo } from 'react';
import { Tag } from 'antd';
import type { TableProps } from 'antd';
import {
  useStartupPrograms,
  type StartupProgramRow,
} from '@/hooks/useProgramStartups';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { programColumns } from '@/lib/listColumns';
import { PROGRAM_STARTUP_STATUS_LABEL, PROGRAM_STARTUP_STATUS_COLOR, badgeTone } from '@/lib/labels';
import type { Program } from '@/types/program';

/**
 * 스타트업 상세 "참여 프로그램" 정방향 표시 패널 (program_startups '읽는 쪽', 읽기 전용).
 * 매핑·신규개설·상태변경·연동해제는 제공하지 않는다. 매핑 편집은 프로그램 상세의 '참여 스타트업'
 * 카드에서 한다. 표시는 프로그램 목록과 동일한 컬럼 + 보육 상태(읽기 전용 태그) + 행 클릭 시 상세 이동.
 */
export function StartupProgramsPanel({ startupId }: { startupId: string }) {
  const { rows, isLoading } = useStartupPrograms(startupId);

  const programs = useMemo(
    () => rows.map((r) => r.program).filter((p): p is Program => Boolean(p)),
    [rows],
  );
  const metaByProgram = useMemo(() => {
    const m = new Map<string, StartupProgramRow>();
    rows.forEach((r) => {
      if (r.program) m.set(r.program.id, r);
    });
    return m;
  }, [rows]);

  // 목록 화면과 동일한 프로그램 고유 컬럼 + 이 관계에만 있는 보육상태(읽기 전용) 컬럼.
  const columns: TableProps<Program>['columns'] = [
    ...programColumns(),
    {
      title: '보육 상태',
      key: 'status',
      width: 120,
      render: (_, p) => {
        const m = metaByProgram.get(p.id);
        return m ? (
          <Tag {...badgeTone(PROGRAM_STARTUP_STATUS_COLOR[m.status])}>
            {PROGRAM_STARTUP_STATUS_LABEL[m.status]}
          </Tag>
        ) : null;
      },
    },
  ];

  return (
    <RelatedTableCard<Program>
      title="참여 프로그램"
      columns={columns}
      data={programs}
      isLoading={isLoading}
      emptyText="참여한 프로그램이 없습니다."
      getHref={(p) => `/programs/${p.id}`}
    />
  );
}

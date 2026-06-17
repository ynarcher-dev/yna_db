import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { RelatedListCard, type RelatedItem } from '@/components/common/RelatedListCard';
import { formatKRWShort } from '@/lib/formatters';

/**
 * 소속(부서) 상세 역방향 연계 블록 (양방향 연결의 '보여지는 쪽').
 * 소속 부서원(managers.department_id)과 본부 투자성과(view_department_stats)를 읽기 전용으로 보여준다.
 * (본부장 임명은 write 기능이라 별도 단계에서 추가한다.)
 */
interface MemberRow {
  id: string;
  name: string;
  position: string | null;
}
interface StatsRow {
  member_count: number | string;
  startup_count: number | string;
  total_valuation: number | string;
  total_revenue: number | string;
}

export function DepartmentRelatedBlocks({ departmentId }: { departmentId: string }) {
  const members = useRelatedRecords<MemberRow>({
    key: ['managers', 'by-department', departmentId],
    table: 'managers',
    select: 'id, name, position',
    filterColumn: 'department_id',
    filterId: departmentId,
    softDelete: true,
    order: { column: 'name', ascending: true },
  });
  const stats = useRelatedRecords<StatsRow>({
    key: ['view_department_stats', departmentId],
    table: 'view_department_stats',
    select: 'member_count, startup_count, total_valuation, total_revenue',
    filterColumn: 'department_id',
    filterId: departmentId,
  });

  const memberItems: RelatedItem[] = members.rows.map((m) => ({
    key: m.id,
    to: `/managers/${m.id}`,
    primary: m.name,
    secondary: m.position ?? undefined,
  }));

  const s = stats.rows[0];

  return (
    <>
      <RelatedListCard
        title="소속 부서원"
        items={memberItems}
        isLoading={members.isLoading}
        emptyText="소속된 부서원이 없습니다."
      />

      <div className="rounded-lg border border-yna-border bg-white p-6">
        <h2 className="mb-3 text-base font-semibold text-yna-main">본부 투자 성과</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: '부서원', value: s ? `${Number(s.member_count)}명` : '-' },
            { label: '담당 스타트업', value: s ? `${Number(s.startup_count)}개사` : '-' },
            { label: '포트폴리오 기업가치', value: s ? formatKRWShort(Number(s.total_valuation)) : '-' },
            { label: '포트폴리오 매출', value: s ? formatKRWShort(Number(s.total_revenue)) : '-' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md bg-yna-bg px-3 py-3 text-center">
              <p className="text-xs text-yna-sub">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-yna-main">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

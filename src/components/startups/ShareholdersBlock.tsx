import { Table } from 'antd';
import type { TableProps } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPercent } from '@/lib/formatters';
import type { Shareholder } from '@/types/startup';

/**
 * 주주 구성 표 + 지분율 파이차트 (6_startups.md 6.3 — 주주 구성 PIE).
 * 상세 화면 전용 표시 블록. 주주가 없으면 빈 상태를 노출한다.
 */
const PIE_COLORS = ['#e22213', '#515151', '#f5a623', '#4a90d9', '#7ac74f', '#9b59b6', '#e67e22'];

export function ShareholdersBlock({ shareholders }: { shareholders: Shareholder[] }) {
  const columns: TableProps<Shareholder>['columns'] = [
    { title: '주주명', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '보유 주식 수',
      dataIndex: 'shares',
      key: 'shares',
      align: 'right',
      render: (v: number) => v.toLocaleString('ko-KR'),
    },
    {
      title: '지분율',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right',
      width: 120,
      render: (v: number) => formatPercent(v),
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-yna-main">주주 구성</h2>
      {shareholders.length === 0 ? (
        <EmptyState message="등록된 주주 정보가 없습니다." />
      ) : (
        <div className="grid items-center gap-6 md:grid-cols-2">
          <Table<Shareholder>
            rowKey={(r) => r.name}
            size="small"
            columns={columns}
            dataSource={shareholders}
            pagination={false}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shareholders}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name} ${formatPercent(entry.percentage)}`}
                >
                  {shareholders.map((s, i) => (
                    <Cell key={s.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatPercent(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

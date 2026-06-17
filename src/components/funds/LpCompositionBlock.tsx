import { useState } from 'react';
import { Table, Button } from 'antd';
import type { TableProps } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LpCompositionFormDrawer } from './LpCompositionFormDrawer';
import { EmptyState } from '@/components/common/EmptyState';
import { formatKRW, formatPercent } from '@/lib/formatters';
import type { Fund, LpEntry } from '@/types/fund';

/**
 * LP 구성 표 + 지분율 도넛 차트 (8_funds.md 8.3 — LP 지분율 구조 Donut).
 * 카드 우측 상단 '수정'(Admin)으로 LP 구성만 편집(기본 정보와 분리).
 */
const DONUT_COLORS = ['#e22213', '#515151', '#f5a623', '#4a90d9', '#7ac74f', '#9b59b6', '#e67e22'];

export function LpCompositionBlock({
  fund,
  isAdmin,
  onSaved,
}: {
  fund: Fund;
  isAdmin: boolean;
  onSaved?: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const lps = fund.lpComposition;

  const columns: TableProps<LpEntry>['columns'] = [
    { title: 'LP명', dataIndex: 'lpName', key: 'lpName', ellipsis: true },
    {
      title: '출자금',
      dataIndex: 'shares',
      key: 'shares',
      align: 'right',
      render: (v: number) => formatKRW(v),
    },
    {
      title: '지분율',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right',
      width: 110,
      render: (v: number) => formatPercent(v),
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-yna-main">LP 구성</h2>
        {isAdmin ? (
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        ) : null}
      </div>

      {lps.length === 0 ? (
        <EmptyState message="등록된 LP 정보가 없습니다." />
      ) : (
        <div className="grid items-center gap-6 md:grid-cols-2">
          <Table<LpEntry>
            rowKey={(r) => r.lpName}
            size="small"
            columns={columns}
            dataSource={lps}
            pagination={false}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lps}
                  dataKey="percentage"
                  nameKey="lpName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  label={(entry) => `${entry.lpName} ${formatPercent(entry.percentage)}`}
                >
                  {lps.map((lp, i) => (
                    <Cell key={lp.lpName} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatPercent(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isAdmin ? (
        <LpCompositionFormDrawer
          open={editOpen}
          fund={fund}
          onClose={() => setEditOpen(false)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}

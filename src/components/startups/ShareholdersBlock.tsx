import { useState } from 'react';
import { Table, Button } from 'antd';
import type { TableProps } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SectionHeader } from './SectionHeader';
import { ShareholdersFormDrawer } from './ShareholdersFormDrawer';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPercent } from '@/lib/formatters';
import type { Shareholder, Startup } from '@/types/startup';

/**
 * 주주 구성 표 + 지분율 파이차트 (6_startups.md 6.3 — 주주 구성 PIE).
 * 카드 우측 상단 '수정'으로 주주 구성만 편집(기본 정보와 분리). 최종 수정일 노출.
 */
const PIE_COLORS = ['#e22213', '#515151', '#f5a623', '#4a90d9', '#7ac74f', '#9b59b6', '#e67e22'];

export function ShareholdersBlock({ startup, onSaved }: { startup: Startup; onSaved?: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const shareholders = startup.shareholders;

  // 표 양끝 셀(첫 칸 왼쪽 / 마지막 칸 오른쪽)에 여백을 줘 내용이 가장자리에 붙지 않게 한다.
  const padL = {
    onHeaderCell: () => ({ style: { paddingLeft: 16 } }),
    onCell: () => ({ style: { paddingLeft: 16 } }),
  };
  const padR = {
    onHeaderCell: () => ({ style: { paddingRight: 16 } }),
    onCell: () => ({ style: { paddingRight: 16 } }),
  };

  const columns: TableProps<Shareholder>['columns'] = [
    { title: '주주명', dataIndex: 'name', key: 'name', ellipsis: true, ...padL },
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
      ...padR,
      render: (v: number) => formatPercent(v),
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader
        title="주주 구성"
        updatedAt={startup.shareholdersUpdatedAt}
        action={
          <Button size="small" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        }
      />
      {shareholders.length === 0 ? (
        <EmptyState message="등록된 주주 정보가 없습니다. “수정”에서 입력하세요." />
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

      <ShareholdersFormDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}

import { useState } from 'react';
import { Table, Button } from 'antd';
import type { TableProps } from 'antd';
import { Link } from 'react-router-dom';
import { useFundInvestments, useFundInvestmentMutations } from '@/hooks/useFundInvestments';
import { FundInvestmentFormDrawer } from './FundInvestmentFormDrawer';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppToast } from '@/components/common/useAppToast';
import { formatDate, formatKRW, formatPercent } from '@/lib/formatters';
import type { FundInvestment } from '@/types/fundInvestment';

/**
 * 피투자 포트폴리오 지분 분배 테이블 (8_funds.md 8.3, Detail Area 2). Admin 전용 추가/수정/삭제.
 * 스타트업명 클릭 시 스타트업 상세로 이동.
 */
export function FundInvestmentsBlock({ fundId, isAdmin }: { fundId: string; isAdmin: boolean }) {
  const toast = useAppToast();
  const { investments, isLoading } = useFundInvestments(fundId);
  const { remove } = useFundInvestmentMutations(fundId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FundInvestment | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (inv: FundInvestment) => {
    setEditing(inv);
    setDrawerOpen(true);
  };

  const handleDelete = (inv: FundInvestment) => {
    toast.confirm(
      '투자 집행 삭제',
      `'${inv.startupName || '스타트업'}' 투자 집행 기록을 삭제하시겠습니까?`,
      async () => {
        try {
          await remove.mutateAsync(inv.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const columns: TableProps<FundInvestment>['columns'] = [
    {
      title: '피투자 스타트업',
      key: 'startup',
      ellipsis: true,
      render: (_, r) => (
        <Link className="text-yna-point" to={`/startups/${r.startupId}`}>
          {r.startupName || '스타트업'}
        </Link>
      ),
    },
    {
      title: '출자액',
      dataIndex: 'investmentAmount',
      key: 'investmentAmount',
      align: 'right',
      render: (v: number) => formatKRW(v),
    },
    {
      title: '취득 지분율',
      dataIndex: 'sharePercentage',
      key: 'sharePercentage',
      align: 'right',
      width: 110,
      render: (v: number) => formatPercent(v),
    },
    {
      title: '투자일',
      dataIndex: 'investmentDate',
      key: 'investmentDate',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    ...(isAdmin
      ? [
          {
            title: '관리',
            key: 'actions',
            width: 120,
            render: (_: unknown, r: FundInvestment) => (
              <div className="flex gap-1">
                <Button size="small" onClick={() => openEdit(r)}>
                  수정
                </Button>
                <Button size="small" danger onClick={() => handleDelete(r)}>
                  삭제
                </Button>
              </div>
            ),
          } as NonNullable<TableProps<FundInvestment>['columns']>[number],
        ]
      : []),
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-yna-main">피투자 포트폴리오</h2>
        {isAdmin ? (
          <Button size="small" type="primary" onClick={openCreate}>
            추가
          </Button>
        ) : null}
      </div>

      {investments.length === 0 && !isLoading ? (
        <EmptyState message="등록된 투자 집행 내역이 없습니다." />
      ) : (
        <Table<FundInvestment>
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={investments}
          pagination={false}
        />
      )}

      {isAdmin ? (
        <FundInvestmentFormDrawer
          open={drawerOpen}
          fundId={fundId}
          investment={editing}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}

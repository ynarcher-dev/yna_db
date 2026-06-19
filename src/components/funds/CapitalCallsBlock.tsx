import { useState } from 'react';
import { Table, Button, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useCapitalCalls, useCapitalCallMutations } from '@/hooks/useCapitalCalls';
import { CapitalCallFormDrawer } from './CapitalCallFormDrawer';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppToast } from '@/components/common/useAppToast';
import { formatDate, formatKRW } from '@/lib/formatters';
import type { CapitalCall } from '@/types/capitalCall';

/**
 * Capital Call 납입 히스토리 테이블 (8_funds.md 8.3, Detail Area 1). Admin 전용 추가/수정/삭제.
 */
export function CapitalCallsBlock({ fundId, isAdmin }: { fundId: string; isAdmin: boolean }) {
  const toast = useAppToast();
  const { calls, isLoading } = useCapitalCalls(fundId);
  const { remove } = useCapitalCallMutations(fundId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CapitalCall | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (call: CapitalCall) => {
    setEditing(call);
    setDrawerOpen(true);
  };

  const handleDelete = (call: CapitalCall) => {
    toast.confirm('캐피탈 콜 삭제', `${call.callRound}차 캐피탈 콜을 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(call.id);
        toast.success('삭제되었습니다.');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  const columns: TableProps<CapitalCall>['columns'] = [
    { title: '차수', dataIndex: 'callRound', key: 'callRound', width: 70, render: (v: number) => `${v}차` },
    {
      title: '요청일',
      dataIndex: 'requestedDate',
      key: 'requestedDate',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '요청액',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
      align: 'right',
      render: (v: number) => formatKRW(v),
    },
    {
      title: '납입 상태',
      key: 'status',
      width: 150,
      render: (_, r) =>
        r.isCompleted ? (
          <Tag color="blue">완료 ({formatDate(r.completedDate)})</Tag>
        ) : (
          <Tag color="gold">미납입</Tag>
        ),
    },
    ...(isAdmin
      ? [
          {
            title: '관리',
            key: 'actions',
            width: 120,
            render: (_: unknown, r: CapitalCall) => (
              <div className="flex gap-1">
                <Button size="small" onClick={() => openEdit(r)}>
                  수정
                </Button>
                <Button size="small" danger onClick={() => handleDelete(r)}>
                  삭제
                </Button>
              </div>
            ),
          } as NonNullable<TableProps<CapitalCall>['columns']>[number],
        ]
      : []),
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-yna-main">Capital Call 히스토리</h2>
        {isAdmin ? (
          <Button size="small" type="primary" onClick={openCreate}>
            추가
          </Button>
        ) : null}
      </div>

      {calls.length === 0 && !isLoading ? (
        <EmptyState message="등록된 캐피탈 콜이 없습니다." />
      ) : (
        <Table<CapitalCall>
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={calls}
          pagination={false}
        />
      )}

      {isAdmin ? (
        <CapitalCallFormDrawer
          open={drawerOpen}
          fundId={fundId}
          call={editing}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}

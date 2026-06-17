import { useRef, useState } from 'react';
import { Table, Input, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useFundsList, useFundMutations } from '@/hooks/useFunds';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { FundFormDrawer } from '@/components/funds/FundFormDrawer';
import { FundExhaustionBar } from '@/components/funds/FundExhaustionBar';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { formatKRW } from '@/lib/formatters';
import type { Fund } from '@/types/fund';

/**
 * 펀드 목록 (8_funds.md, 17_conventions.md 2장). Admin 전용 CRUD.
 * 검색(펀드명·투자기간)·정렬·페이지네이션 + 소진율 진척 바. 등록/삭제 버튼은 Admin 만 노출.
 */
export function FundsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: [] });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { funds, total, isLoading, isFetching, isError, refetch } = useFundsList({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useFundMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (fund: Fund) => {
    toast.confirm(
      '펀드 삭제',
      `'${fund.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(fund.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Fund>['columns'] = [
    numberColumn<Fund>(params.page, params.pageSize, total),
    {
      title: '펀드/투자조합명',
      key: 'name',
      width: 220,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    {
      title: '결성 총액',
      key: 'total_amount',
      width: 150,
      align: 'right',
      sorter: true,
      sortOrder: sortOrderOf('total_amount'),
      render: (_, r) => formatKRW(r.totalAmount),
    },
    {
      title: '소진율',
      key: 'exhaustion',
      width: 170,
      render: (_, r) => <FundExhaustionBar totalAmount={r.totalAmount} balance={r.balance} compact />,
    },
    {
      title: '투자 기간',
      key: 'investing_period',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.investingPeriod,
    },
    {
      title: '담당자',
      key: 'managers',
      width: 140,
      ellipsis: { showTitle: true },
      render: (_, r) => (r.managerNames.length ? r.managerNames.join(', ') : '-'),
    },
    authorColumn<Fund>(),
    createdAtColumn<Fund>(sortOrderOf('created_at')),
    updatedAtColumn<Fund>(sortOrderOf('updated_at')),
    actionsColumn<Fund>({ isAdmin, onDelete: handleDelete }),
  ];

  const onTableChange: TableProps<Fund>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">펀드 관리</h1>
        {isAdmin ? (
          <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
            펀드 등록
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="펀드명·투자기간 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="펀드 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Fund>
            rowKey="id"
            columns={columns}
            dataSource={funds}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/funds/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 펀드가 없습니다."
                  action={
                    isAdmin ? (
                      <Button type="primary" onClick={() => setCreateOpen(true)}>
                        펀드 등록
                      </Button>
                    ) : undefined
                  }
                />
              ),
            }}
          />
          <ListPagination
            page={params.page}
            pageSize={params.pageSize}
            total={total}
            onChange={params.setPage}
          />
        </>
      )}

      <FundFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

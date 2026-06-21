import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useBusinessesList, useBusinessMutations } from '@/hooks/useBusinesses';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { PeriodRangeFilter } from '@/components/common/PeriodRangeFilter';
import { NumberRangeFilter } from '@/components/common/NumberRangeFilter';
import { BusinessFormDrawer } from '@/components/businesses/BusinessFormDrawer';
import { BUSINESS_STATUS_OPTIONS } from '@/lib/labels';

/** 매출·이익 필터는 백만원 단위로 입력받아 원 단위로 환산해 조회한다. */
const MILLION = 1_000_000;
const toWon = (v?: number) => (typeof v === 'number' ? v * MILLION : undefined);
import {
  numberColumn,
  financeColumns,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { businessColumns } from '@/lib/listColumns';
import type { Business } from '@/types/business';

/**
 * 사업 목록 (7_businesses.md, 17_conventions.md 2장).
 * 검색(사업명)·정렬·페이지네이션. 삭제는 책임자(created_by)+관리자만 노출.
 */
export function BusinessesListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['status'], rangeKeys: ['revenue', 'profit'] });
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAdmin = role === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { businesses, total, isLoading, isFetching, isError, refetch } = useBusinessesList({
    search: params.search,
    status: params.filters.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    revenueMin: toWon(params.ranges.revenue?.min),
    revenueMax: toWon(params.ranges.revenue?.max),
    profitMin: toWon(params.ranges.profit?.min),
    profitMax: toWon(params.ranges.profit?.max),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useBusinessMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (business: Business) => {
    toast.confirm(
      '사업 삭제',
      `'${business.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(business.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  // 삭제 = 책임자(본인이 등록) 또는 관리자
  const canDelete = (business: Business) => isAdmin || (!!userId && business.createdById === userId);

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Business>['columns'] = [
    numberColumn<Business>(params.page, params.pageSize, total),
    ...businessColumns({ sortOrderOf }),
    ...financeColumns<Business>(),
    authorColumn<Business>(),
    createdAtColumn<Business>(sortOrderOf('created_at')),
    updatedAtColumn<Business>(sortOrderOf('updated_at')),
    actionsColumn<Business>({ isAdmin, onDelete: handleDelete, canDelete }),
  ];

  const onTableChange: TableProps<Business>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">사업 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          사업 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="사업명 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="상태 전체"
          options={BUSINESS_STATUS_OPTIONS}
          value={params.filters.status ?? undefined}
          onChange={(value) => params.setFilter('status', value)}
          className="w-32"
        />
        <PeriodRangeFilter
          from={params.dateFrom}
          to={params.dateTo}
          onChange={params.setDateRange}
        />
        <NumberRangeFilter
          label="매출(백만)"
          min={params.ranges.revenue?.min}
          max={params.ranges.revenue?.max}
          onChange={(min, max) => params.setRange('revenue', min, max)}
        />
        <NumberRangeFilter
          label="이익(백만)"
          min={params.ranges.profit?.min}
          max={params.ranges.profit?.max}
          onChange={(min, max) => params.setRange('profit', min, max)}
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="사업 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Business>
            rowKey="id"
            columns={columns}
            dataSource={businesses}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/businesses/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 사업이 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      사업 등록
                    </Button>
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

      <BusinessFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

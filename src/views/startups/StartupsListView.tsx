import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useStartupsList, useStartupMutations } from '@/hooks/useStartups';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { StartupStageTag } from '@/components/startups/StartupStageTag';
import { StartupStatusTag } from '@/components/startups/StartupStatusTag';
import { StartupFormDrawer } from '@/components/startups/StartupFormDrawer';
import { INVESTMENT_STAGE_OPTIONS, MANAGEMENT_STATUS_OPTIONS } from '@/lib/labels';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Startup } from '@/types/startup';

/**
 * 스타트업 목록 (6_startups.md, 17_conventions.md 2장).
 * 검색(기업명·대표자)·투자단계/담당심사역 필터·정렬·페이지네이션을 URL 상태로 직렬화하고,
 * 등록 Drawer 와 행별 상세/삭제(Admin) 액션을 제공한다.
 */
export function StartupsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({
    filterKeys: ['investment_stage', 'management_status', 'manager_id'],
  });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: managerOptions = [] } = useManagerOptions();
  const { startups, total, isLoading, isFetching, isError, refetch } = useStartupsList({
    search: params.search,
    investmentStage: params.filters.investment_stage,
    managementStatus: params.filters.management_status,
    managerId: params.filters.manager_id,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useStartupMutations();

  // 검색: 300ms 디바운스 후 URL 반영 (17_conventions.md 2장)
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (startup: Startup) => {
    toast.confirm(
      '스타트업 삭제',
      `'${startup.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(startup.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Startup>['columns'] = [
    numberColumn<Startup>(params.page, params.pageSize, total),
    {
      title: '기업명',
      key: 'name',
      width: 180,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => (
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: r.brandColor }}
          />
          <span className="font-medium text-yna-main">{r.name}</span>
        </span>
      ),
    },
    { title: '대표자', key: 'ceo_name', width: 120, ellipsis: true, render: (_, r) => r.ceoName },
    {
      title: '투자 단계',
      key: 'investment_stage',
      width: 130,
      render: (_, r) => <StartupStageTag stage={r.investmentStage} />,
    },
    {
      title: '관리 현황',
      key: 'management_status',
      width: 120,
      render: (_, r) => (
        <StartupStatusTag status={r.managementStatus} etc={r.managementStatusEtc} />
      ),
    },
    {
      title: '담당 심사역',
      key: 'manager',
      width: 120,
      ellipsis: true,
      render: (_, r) => r.managerName || '-',
    },
    {
      title: '기업 설명',
      key: 'description',
      width: 360,
      // 길면 한 줄로 잘라 말줄임(…) 처리. 마우스 오버 시 전체 텍스트 툴팁 노출.
      ellipsis: { showTitle: true },
      render: (_, r) => r.description || '-',
    },
    authorColumn<Startup>(),
    createdAtColumn<Startup>(sortOrderOf('created_at')),
    updatedAtColumn<Startup>(sortOrderOf('updated_at')),
    actionsColumn<Startup>({ isAdmin, onDelete: handleDelete }),
  ];

  // 정렬만 Table onChange 로 처리 (페이지는 외부 ListPagination 이 담당)
  const onTableChange: TableProps<Startup>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">스타트업 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          스타트업 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="기업명·대표자 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="투자 단계 전체"
          options={INVESTMENT_STAGE_OPTIONS}
          value={params.filters.investment_stage ?? undefined}
          onChange={(value) => params.setFilter('investment_stage', value)}
          className="w-40"
        />
        <Select
          allowClear
          placeholder="관리 현황 전체"
          options={MANAGEMENT_STATUS_OPTIONS}
          value={params.filters.management_status ?? undefined}
          onChange={(value) => params.setFilter('management_status', value)}
          className="w-40"
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="담당 심사역 전체"
          options={managerOptions}
          value={params.filters.manager_id ?? undefined}
          onChange={(value) => params.setFilter('manager_id', value)}
          className="w-44"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="스타트업 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Startup>
            rowKey="id"
            columns={columns}
            dataSource={startups}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/startups/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 스타트업이 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      스타트업 등록
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

      <StartupFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

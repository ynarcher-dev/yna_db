import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useListParams } from '@/hooks/useListParams';
import { useManagersList, useManagerMutations } from '@/hooks/useManagers';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { RoleTag } from '@/components/managers/RoleTag';
import { SpecialtyTags } from '@/components/experts/SpecialtyTags';
import { APP_ROLE_OPTIONS } from '@/lib/labels';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Manager } from '@/types/manager';

/**
 * 심사역 목록 (5_managers.md, 17_conventions.md 2장).
 * 검색(이름·직급·이메일)·역할/소속 필터·정렬·페이지네이션을 URL 상태로 직렬화한다.
 * '등록(계정 발급)'은 Edge Function(/admin/accounts) 으로 분리되어 본 목록에는 등록 버튼이 없다.
 * 삭제(소프트)는 Admin 전용. 행 클릭 시 상세(=본인이면 마이페이지) 이동.
 */
export function ManagersListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['role', 'department_id'] });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const myId = useAuthStore((s) => s.session?.user?.id);

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const { managers, total, isLoading, isFetching, isError, refetch } = useManagersList({
    search: params.search,
    role: params.filters.role,
    departmentId: params.filters.department_id,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useManagerMutations();
  const { data: departmentOptions = [] } = useDepartmentOptions();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (manager: Manager) => {
    toast.confirm(
      '심사역 비활성화',
      `'${manager.name}'을(를) 비활성화하시겠습니까? 목록·조회에서 숨김 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(manager.id);
          toast.success('비활성화되었습니다.');
        } catch (err) {
          toast.error('처리에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Manager>['columns'] = [
    numberColumn<Manager>(params.page, params.pageSize, total),
    {
      title: '이름',
      key: 'name',
      width: 130,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => (
        <span className="font-medium text-yna-main">
          {r.name}
          {r.id === myId ? <Tag className="ml-2">나</Tag> : null}
        </span>
      ),
    },
    { title: '직급', key: 'position', width: 120, ellipsis: true, render: (_, r) => r.position },
    {
      title: '역할',
      key: 'role',
      width: 90,
      render: (_, r) => <RoleTag role={r.role} />,
    },
    {
      title: '소속',
      key: 'department',
      ellipsis: true,
      render: (_, r) => r.departmentName || '-',
    },
    {
      title: '관심 분야',
      key: 'specialties',
      ellipsis: true,
      render: (_, r) => <SpecialtyTags specialties={r.specialties} />,
    },
    authorColumn<Manager>(),
    createdAtColumn<Manager>(sortOrderOf('created_at')),
    updatedAtColumn<Manager>(sortOrderOf('updated_at')),
    actionsColumn<Manager>({ isAdmin, onDelete: handleDelete }),
  ];

  const onTableChange: TableProps<Manager>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">심사역 관리</h1>
        {isAdmin ? (
          <Button onClick={() => navigate('/admin/accounts')}>계정 관리</Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="이름·직급·이메일 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="역할 전체"
          options={APP_ROLE_OPTIONS}
          value={params.filters.role ?? undefined}
          onChange={(value) => params.setFilter('role', value)}
          className="w-36"
        />
        <Select
          allowClear
          placeholder="소속 전체"
          options={departmentOptions}
          value={params.filters.department_id ?? undefined}
          onChange={(value) => params.setFilter('department_id', value)}
          className="w-48"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="심사역 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Manager>
            rowKey="id"
            columns={columns}
            dataSource={managers}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/managers/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: <EmptyState message="등록된 심사역이 없습니다." /> }}
          />
          <ListPagination
            page={params.page}
            pageSize={params.pageSize}
            total={total}
            onChange={params.setPage}
          />
        </>
      )}
    </div>
  );
}

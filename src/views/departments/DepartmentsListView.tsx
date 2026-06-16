import { useRef, useState } from 'react';
import { Table, Input, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useDepartmentsList, useDepartmentMutations } from '@/hooks/useDepartments';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { DepartmentFormDrawer } from '@/components/departments/DepartmentFormDrawer';
import { formatDate } from '@/lib/formatters';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Department } from '@/types/department';

/**
 * 소속(부서) 목록 (11_departments.md, 17_conventions.md 2장).
 * 검색(부서명·설명)·정렬·페이지네이션을 URL 상태로 직렬화한다.
 * 등록/수정/삭제는 Admin 전용(11.4) — 비Admin 에게는 작성 액션을 노출하지 않는다.
 */
export function DepartmentsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { departments, total, isLoading, isFetching, isError, refetch } = useDepartmentsList({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useDepartmentMutations();

  // 검색: 300ms 디바운스 후 URL 반영 (17_conventions.md 2장)
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (department: Department) => {
    toast.confirm(
      '부서 삭제',
      `'${department.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(department.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Department>['columns'] = [
    numberColumn<Department>(params.page, params.pageSize, total),
    {
      title: '부서명',
      key: 'name',
      width: 220,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    {
      title: '설립일',
      key: 'established_at',
      width: 120,
      align: 'center',
      render: (_, r) => (r.establishedAt ? formatDate(r.establishedAt) : '-'),
    },
    {
      title: '설명',
      key: 'description',
      ellipsis: true,
      render: (_, r) => r.description || '-',
    },
    authorColumn<Department>(),
    createdAtColumn<Department>(sortOrderOf('created_at')),
    updatedAtColumn<Department>(sortOrderOf('updated_at')),
    actionsColumn<Department>({ isAdmin, onDelete: handleDelete }),
  ];

  // 정렬만 Table onChange 로 처리 (페이지는 외부 ListPagination 이 담당)
  const onTableChange: TableProps<Department>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">소속 관리</h1>
        {isAdmin ? (
          <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
            부서 등록
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="부서명·설명 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="부서 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Department>
            rowKey="id"
            columns={columns}
            dataSource={departments}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/departments/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 부서가 없습니다."
                  action={
                    isAdmin ? (
                      <Button type="primary" onClick={() => setCreateOpen(true)}>
                        부서 등록
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

      <DepartmentFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

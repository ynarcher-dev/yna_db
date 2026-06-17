import { useRef, useState } from 'react';
import { Table, Input, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useProgramsList, useProgramMutations } from '@/hooks/usePrograms';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { ProgramFormDrawer } from '@/components/programs/ProgramFormDrawer';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { formatDate, formatKRWShort } from '@/lib/formatters';
import type { Program } from '@/types/program';

/**
 * 프로그램 목록 (7_programs.md, 17_conventions.md 2장).
 * 검색(프로그램명)·정렬·페이지네이션. 삭제는 책임자(created_by)+관리자만 노출.
 */
export function ProgramsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: [] });
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAdmin = role === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { programs, total, isLoading, isFetching, isError, refetch } = useProgramsList({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useProgramMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (program: Program) => {
    toast.confirm(
      '프로그램 삭제',
      `'${program.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(program.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  // 삭제 = 책임자(본인이 등록) 또는 관리자
  const canDelete = (program: Program) => isAdmin || (!!userId && program.createdById === userId);

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Program>['columns'] = [
    numberColumn<Program>(params.page, params.pageSize, total),
    {
      title: '프로그램명',
      key: 'name',
      width: 220,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    {
      title: '기수',
      key: 'generation',
      width: 70,
      align: 'center',
      sorter: true,
      sortOrder: sortOrderOf('generation'),
      render: (_, r) => `${r.generation}기`,
    },
    {
      title: '예산',
      key: 'budget',
      width: 110,
      align: 'right',
      render: (_, r) => formatKRWShort(r.budget),
    },
    {
      title: '기간',
      key: 'period',
      width: 180,
      ellipsis: true,
      render: (_, r) => `${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}`,
    },
    {
      title: '운영 심사역',
      key: 'managers',
      width: 140,
      ellipsis: { showTitle: true },
      render: (_, r) => (r.managerNames.length ? r.managerNames.join(', ') : '-'),
    },
    authorColumn<Program>(),
    createdAtColumn<Program>(sortOrderOf('created_at')),
    updatedAtColumn<Program>(sortOrderOf('updated_at')),
    actionsColumn<Program>({ isAdmin, onDelete: handleDelete, canDelete }),
  ];

  const onTableChange: TableProps<Program>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">프로그램 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          프로그램 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="프로그램명 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="프로그램 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Program>
            rowKey="id"
            columns={columns}
            dataSource={programs}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/programs/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 프로그램이 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      프로그램 등록
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

      <ProgramFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

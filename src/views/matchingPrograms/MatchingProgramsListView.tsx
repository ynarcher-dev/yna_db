import { useRef, useState } from 'react';
import { Table, Input, Button, Select, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useMatchingProgramsList, useMatchingProgramMutations } from '@/hooks/useMatchingPrograms';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { MatchingProgramFormDrawer } from '@/components/matchingPrograms/MatchingProgramFormDrawer';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { matchingProgramColumns } from '@/lib/listColumns';
import { MATCHING_PROGRAM_STATUS_OPTIONS } from '@/lib/labels';
import type { MatchingProgram } from '@/types/matchingProgram';

/**
 * 매칭 프로그램 목록 (21_matching_programs.md, 17_conventions.md 2장).
 * 검색(프로그램명·기관)·상태 필터·정렬·페이지네이션. 등록=Admin·Manager, 삭제=Admin.
 */
export function MatchingProgramsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['status'] });
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { programs, total, isLoading, isFetching, isError, refetch } = useMatchingProgramsList({
    search: params.search,
    status: params.filters.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useMatchingProgramMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (program: MatchingProgram) => {
    toast.confirm(
      '매칭 프로그램 삭제',
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

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<MatchingProgram>['columns'] = [
    numberColumn<MatchingProgram>(params.page, params.pageSize, total),
    ...matchingProgramColumns({ sortOrderOf }),
    authorColumn<MatchingProgram>(),
    createdAtColumn<MatchingProgram>(sortOrderOf('created_at')),
    updatedAtColumn<MatchingProgram>(sortOrderOf('updated_at')),
    actionsColumn<MatchingProgram>({ isAdmin, onDelete: handleDelete }),
  ];

  const onTableChange: TableProps<MatchingProgram>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">매칭 프로그램 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          매칭 프로그램 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="프로그램명·기관 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="상태"
          className="w-32"
          options={MATCHING_PROGRAM_STATUS_OPTIONS}
          value={params.filters.status || undefined}
          onChange={(v?: string) => params.setFilter('status', v)}
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="매칭 프로그램 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<MatchingProgram>
            rowKey="id"
            columns={columns}
            dataSource={programs}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/matching-programs/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 매칭 프로그램이 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      매칭 프로그램 등록
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

      <MatchingProgramFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

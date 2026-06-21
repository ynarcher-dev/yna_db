import { useRef, useState } from 'react';
import { Table, Input, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useInvestArchivesList, useInvestArchiveMutations } from '@/hooks/useInvestArchives';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { InvestArchiveFormDrawer } from '@/components/investArchives/InvestArchiveFormDrawer';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { investArchiveColumns } from '@/lib/listColumns';
import type { InvestArchive } from '@/types/investArchive';

/**
 * 투자 자료실 목록 (22_invest_archives.md, 17_conventions.md 2장).
 * 상단 고정(is_pinned) 글 최상단 + 카테고리 필터 + 제목·본문 검색 + 최신/조회수 정렬.
 * 등록=Admin·Manager, 삭제=작성자 본인·Admin.
 */
export function InvestArchivesListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAdmin = role === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { archives, total, isLoading, isFetching, isError, refetch } = useInvestArchivesList({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useInvestArchiveMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (archive: InvestArchive) => {
    toast.confirm(
      '자료 삭제',
      `'${archive.title}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(archive.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  // 삭제 = 작성자 본인 또는 관리자
  const canDelete = (archive: InvestArchive) =>
    isAdmin || (!!userId && archive.createdById === userId);

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<InvestArchive>['columns'] = [
    numberColumn<InvestArchive>(params.page, params.pageSize, total),
    ...investArchiveColumns({ sortOrderOf }),
    authorColumn<InvestArchive>(),
    createdAtColumn<InvestArchive>(sortOrderOf('created_at')),
    updatedAtColumn<InvestArchive>(sortOrderOf('updated_at')),
    actionsColumn<InvestArchive>({ isAdmin, onDelete: handleDelete, canDelete }),
  ];

  const onTableChange: TableProps<InvestArchive>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">투자 자료실</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          자료 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="제목·본문 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="자료실 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<InvestArchive>
            rowKey="id"
            columns={columns}
            dataSource={archives}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            rowClassName={(record) => (record.isPinned ? 'bg-yna-bg' : '')}
            onRow={(record) => ({
              onClick: () => navigate(`/invest-archives/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 자료가 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      자료 등록
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

      <InvestArchiveFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

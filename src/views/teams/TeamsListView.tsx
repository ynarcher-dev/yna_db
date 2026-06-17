import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useTeamsList, useTeamMutations } from '@/hooks/useTeams';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { TeamFormDrawer } from '@/components/teams/TeamFormDrawer';
import { COMPANY_OPTIONS } from '@/lib/labels';
import { formatDate } from '@/lib/formatters';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Team } from '@/types/team';

/**
 * 소속 관리 목록 = 팀(단위) 목록. 한 행이 곧 하나의 '부서'(팀).
 * 컬럼: No.·회사·그룹명·팀명·운영기간·작성자·등록일·수정일·관리.
 * 등록/수정/삭제는 Admin 전용 — 비Admin 에게는 작성 액션을 노출하지 않는다.
 */
export function TeamsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['company'] });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { teams, total, isLoading, isFetching, isError, refetch } = useTeamsList({
    search: params.search,
    company: params.filters.company,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useTeamMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (team: Team) => {
    toast.confirm(
      '팀 삭제',
      `'${team.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(team.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const periodCell = (t: Team) => {
    if (!t.operatingStart && !t.operatingEnd) return '-';
    const start = t.operatingStart ? formatDate(t.operatingStart) : '-';
    return t.operatingEnd ? (
      `${start} ~ ${formatDate(t.operatingEnd)}`
    ) : (
      <span>
        {start} ~ <Tag color="green">운영중</Tag>
      </span>
    );
  };

  const columns: TableProps<Team>['columns'] = [
    numberColumn<Team>(params.page, params.pageSize, total),
    { title: '회사', key: 'company', width: 150, ellipsis: true, render: (_, r) => r.company },
    {
      title: '그룹명',
      key: 'group',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.groupName || '-',
    },
    {
      title: '팀명',
      key: 'name',
      width: 140,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) =>
        r.name ? <span className="font-medium text-yna-main">{r.name}</span> : '-',
    },
    { title: '운영기간', key: 'period', width: 200, render: (_, r) => periodCell(r) },
    authorColumn<Team>(),
    createdAtColumn<Team>(sortOrderOf('created_at')),
    updatedAtColumn<Team>(sortOrderOf('updated_at')),
    actionsColumn<Team>({ isAdmin, onDelete: handleDelete }),
  ];

  const onTableChange: TableProps<Team>['onChange'] = (_pagination, _filters, sorter) => {
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
            팀 등록
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="팀명 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="회사 전체"
          options={COMPANY_OPTIONS}
          value={params.filters.company ?? undefined}
          onChange={(value) => params.setFilter('company', value)}
          className="w-48"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="팀 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Team>
            rowKey="id"
            columns={columns}
            dataSource={teams}
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
                  message="등록된 팀이 없습니다."
                  action={
                    isAdmin ? (
                      <Button type="primary" onClick={() => setCreateOpen(true)}>
                        팀 등록
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

      <TeamFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

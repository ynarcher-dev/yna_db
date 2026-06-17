import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useProjectsList, useProjectMutations } from '@/hooks/useProjects';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { ProjectTypeTag } from '@/components/projects/ProjectTypeTag';
import { ProjectStageTag } from '@/components/projects/ProjectStageTag';
import { ProjectPriorityTag } from '@/components/projects/ProjectPriorityTag';
import { ProjectFormDrawer } from '@/components/projects/ProjectFormDrawer';
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STAGE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
} from '@/lib/labels';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import { formatDate } from '@/lib/formatters';
import type { Project } from '@/types/project';

/**
 * 프로젝트 목록 (10_projects.md, 17_conventions.md 2장).
 * 검색(프로젝트명)·유형/단계/우선순위 필터·정렬·페이지네이션을 URL 상태로 직렬화한다.
 * 삭제는 책임자(created_by)+관리자만 노출(actionsColumn canDelete).
 */
export function ProjectsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['project_type', 'stage', 'priority'] });
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAdmin = role === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { projects, total, isLoading, isFetching, isError, refetch } = useProjectsList({
    search: params.search,
    projectType: params.filters.project_type,
    stage: params.filters.stage,
    priority: params.filters.priority,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useProjectMutations();

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (project: Project) => {
    toast.confirm(
      '프로젝트 삭제',
      `'${project.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(project.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  // 삭제 = 책임자(본인이 등록) 또는 관리자
  const canDelete = (project: Project) => isAdmin || (!!userId && project.createdById === userId);

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Project>['columns'] = [
    numberColumn<Project>(params.page, params.pageSize, total),
    {
      title: '프로젝트명',
      key: 'name',
      width: 220,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    {
      title: '유형',
      key: 'project_type',
      width: 130,
      render: (_, r) => <ProjectTypeTag type={r.projectType} etc={r.projectTypeEtc} />,
    },
    {
      title: '상태',
      key: 'stage',
      width: 90,
      render: (_, r) => <ProjectStageTag stage={r.stage} />,
    },
    {
      title: '우선순위',
      key: 'priority',
      width: 90,
      render: (_, r) => <ProjectPriorityTag priority={r.priority} />,
    },
    {
      title: '기간',
      key: 'period',
      width: 180,
      ellipsis: true,
      render: (_, r) => `${formatDate(r.startDate)} ~ ${r.endDate ? formatDate(r.endDate) : ''}`,
    },
    {
      title: '담당자',
      key: 'managers',
      width: 140,
      ellipsis: { showTitle: true },
      render: (_, r) => (r.managerNames.length ? r.managerNames.join(', ') : '-'),
    },
    authorColumn<Project>(),
    createdAtColumn<Project>(sortOrderOf('created_at')),
    updatedAtColumn<Project>(sortOrderOf('updated_at')),
    actionsColumn<Project>({ isAdmin, onDelete: handleDelete, canDelete }),
  ];

  const onTableChange: TableProps<Project>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">프로젝트 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          프로젝트 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="프로젝트명 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="유형 전체"
          options={PROJECT_TYPE_OPTIONS}
          value={params.filters.project_type ?? undefined}
          onChange={(value) => params.setFilter('project_type', value)}
          className="w-40"
        />
        <Select
          allowClear
          placeholder="단계 전체"
          options={PROJECT_STAGE_OPTIONS}
          value={params.filters.stage ?? undefined}
          onChange={(value) => params.setFilter('stage', value)}
          className="w-32"
        />
        <Select
          allowClear
          placeholder="우선순위 전체"
          options={PROJECT_PRIORITY_OPTIONS}
          value={params.filters.priority ?? undefined}
          onChange={(value) => params.setFilter('priority', value)}
          className="w-32"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="프로젝트 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Project>
            rowKey="id"
            columns={columns}
            dataSource={projects}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/projects/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 프로젝트가 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      프로젝트 등록
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

      <ProjectFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

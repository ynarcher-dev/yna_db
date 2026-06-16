import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { useExpertsList, useExpertMutations, useExpertRatings } from '@/hooks/useExperts';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { ExpertTypeTag } from '@/components/experts/ExpertTypeTag';
import { AvailabilityTag } from '@/components/experts/AvailabilityTag';
import { SpecialtyTags } from '@/components/experts/SpecialtyTags';
import { RatingCell } from '@/components/experts/RatingCell';
import { ExpertFormDrawer } from '@/components/experts/ExpertFormDrawer';
import { EXPERT_TYPE_OPTIONS } from '@/lib/labels';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Expert } from '@/types/expert';

const AVAILABILITY_OPTIONS = [
  { value: 'true', label: '매칭 가능' },
  { value: 'false', label: '매칭 불가' },
];

/**
 * 전문가 목록 (9_experts.md, 17_conventions.md 2장).
 * 검색(이름·소속·직책·이메일)·유형/매칭여부 필터·정렬·페이지네이션을 URL 상태로
 * 직렬화하고, 등록 Drawer 와 행별 상세/삭제(Admin) 액션을 제공한다.
 */
export function ExpertsListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['expert_type', 'is_available'] });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { experts, total, isLoading, isFetching, isError, refetch } = useExpertsList({
    search: params.search,
    expertType: params.filters.expert_type,
    isAvailable: params.filters.is_available,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = useExpertMutations();
  const { data: ratings } = useExpertRatings(experts.map((e) => e.id));

  // 검색: 300ms 디바운스 후 URL 반영 (17_conventions.md 2장)
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (expert: Expert) => {
    toast.confirm(
      '전문가 삭제',
      `'${expert.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(expert.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Expert>['columns'] = [
    numberColumn<Expert>(params.page, params.pageSize, total),
    {
      title: '이름',
      key: 'name',
      width: 120,
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    { title: '소속', key: 'company', ellipsis: true, render: (_, r) => r.company },
    {
      title: '유형',
      key: 'expert_type',
      width: 90,
      render: (_, r) => <ExpertTypeTag type={r.expertType} />,
    },
    {
      title: '관심 분야',
      key: 'specialties',
      ellipsis: true,
      render: (_, r) => <SpecialtyTags specialties={r.specialties} />,
    },
    {
      title: '매칭',
      key: 'is_available',
      width: 96,
      align: 'center',
      render: (_, r) => <AvailabilityTag available={r.isAvailable} />,
    },
    {
      title: '만족도',
      key: 'rating',
      width: 110,
      align: 'center',
      render: (_, r) => <RatingCell rating={ratings?.[r.id]} />,
    },
    authorColumn<Expert>(),
    createdAtColumn<Expert>(sortOrderOf('created_at')),
    updatedAtColumn<Expert>(sortOrderOf('updated_at')),
    actionsColumn<Expert>({ isAdmin, onDelete: handleDelete }),
  ];

  // 정렬만 Table onChange 로 처리 (페이지는 외부 ListPagination 이 담당)
  const onTableChange: TableProps<Expert>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">전문가 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          전문가 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="이름·소속·직책·이메일 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="유형 전체"
          options={EXPERT_TYPE_OPTIONS}
          value={params.filters.expert_type ?? undefined}
          onChange={(value) => params.setFilter('expert_type', value)}
          className="w-36"
        />
        <Select
          allowClear
          placeholder="매칭 전체"
          options={AVAILABILITY_OPTIONS}
          value={params.filters.is_available ?? undefined}
          onChange={(value) => params.setFilter('is_available', value)}
          className="w-36"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="전문가 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Expert>
            rowKey="id"
            columns={columns}
            dataSource={experts}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/experts/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 전문가가 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      전문가 등록
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

      <ExpertFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

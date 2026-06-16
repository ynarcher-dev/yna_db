import { useRef, useState } from 'react';
import { Table, Input, Select, Button, Alert } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useListParams } from '@/hooks/useListParams';
import { usePartnersList, usePartnerMutations } from '@/hooks/usePartners';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/listPagination';
import { PartnerTypeTag } from '@/components/partners/PartnerTypeTag';
import { PartnerFormDrawer } from '@/components/partners/PartnerFormDrawer';
import { PARTNER_TYPE_OPTIONS } from '@/lib/labels';
import {
  numberColumn,
  authorColumn,
  createdAtColumn,
  updatedAtColumn,
  actionsColumn,
} from '@/lib/tableColumns';
import type { Partner } from '@/types/partner';

/**
 * 협력사 목록 (12_partners.md, 17_conventions.md 2장).
 * 검색(이름·담당자)·유형 필터·정렬·페이지네이션을 URL 상태로 직렬화하고,
 * 등록 Drawer 와 행별 상세/삭제(Admin) 액션을 제공한다.
 */
export function PartnersListView() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const params = useListParams({ filterKeys: ['partner_type'] });
  const isAdmin = useAuthStore((s) => s.role) === 'admin';

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [createOpen, setCreateOpen] = useState(false);

  const { partners, total, isLoading, isFetching, isError, refetch } = usePartnersList({
    search: params.search,
    partnerType: params.filters.partner_type,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    pageSize: params.pageSize,
  });
  const { remove } = usePartnerMutations();

  // 검색: 300ms 디바운스 후 URL 반영 (17_conventions.md 2장)
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => params.setSearch(value), 300);
  };

  const handleDelete = (partner: Partner) => {
    toast.confirm(
      '협력사 삭제',
      `'${partner.name}'을(를) 삭제하시겠습니까? 목록에서 비활성 처리됩니다.`,
      async () => {
        try {
          await remove.mutateAsync(partner.id);
          toast.success('삭제되었습니다.');
        } catch (err) {
          toast.error('삭제에 실패했습니다.', err);
        }
      },
    );
  };

  const sortOrderOf = (key: string) =>
    params.sortBy === key ? (params.sortOrder === 'asc' ? 'ascend' : 'descend') : null;

  const columns: TableProps<Partner>['columns'] = [
    numberColumn<Partner>(params.page, params.pageSize, total),
    {
      title: '기업/기관명',
      key: 'name',
      sorter: true,
      sortOrder: sortOrderOf('name'),
      ellipsis: true,
      render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
    },
    { title: '부서명', key: 'department', ellipsis: true, render: (_, r) => r.department || '-' },
    {
      title: '유형',
      key: 'partner_type',
      width: 130,
      render: (_, r) => <PartnerTypeTag type={r.partnerType} />,
    },
    { title: '담당자', key: 'contact_person', ellipsis: true, render: (_, r) => r.contactPerson },
    { title: '이메일', key: 'email', ellipsis: true, render: (_, r) => r.email || '-' },
    authorColumn<Partner>(),
    createdAtColumn<Partner>(sortOrderOf('created_at')),
    updatedAtColumn<Partner>(sortOrderOf('updated_at')),
    actionsColumn<Partner>({ isAdmin, onDelete: handleDelete }),
  ];

  // 정렬만 Table onChange 로 처리 (페이지는 외부 ListPagination 이 담당)
  const onTableChange: TableProps<Partner>['onChange'] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.order) {
      params.setSort(String(single.columnKey), single.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-yna-main">협력사 관리</h1>
        <Button type="primary" icon={<HiOutlinePlus />} onClick={() => setCreateOpen(true)}>
          협력사 등록
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="기업명·부서·담당자 검색"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          allowClear
          placeholder="유형 전체"
          options={PARTNER_TYPE_OPTIONS}
          value={params.filters.partner_type ?? undefined}
          onChange={(value) => params.setFilter('partner_type', value)}
          className="w-44"
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="협력사 목록을 불러오지 못했습니다."
          action={
            <Button size="small" onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          <Table<Partner>
            rowKey="id"
            columns={columns}
            dataSource={partners}
            loading={isLoading || isFetching}
            onChange={onTableChange}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/partners/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <EmptyState
                  message="등록된 협력사가 없습니다."
                  action={
                    <Button type="primary" onClick={() => setCreateOpen(true)}>
                      협력사 등록
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

      <PartnerFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

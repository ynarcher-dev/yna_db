import { useMemo, useState } from 'react';
import { Table, Select, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  usePartnerBusinesses,
  usePartnerBusinessMutations,
  type PartnerBusinessRow,
} from '@/hooks/useBusinessPartners';
import { useBusinessOptions } from '@/hooks/useBusinesses';
import { BusinessFormDrawer } from '@/components/businesses/BusinessFormDrawer';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { businessColumns } from '@/lib/listColumns';
import type { Business } from '@/types/business';

/**
 * 협력사 상세 "참여 사업" 역방향 편집 패널 (business_partners '쓰는 쪽', 0046).
 * 사업 목록과 동일한 표 형태 + 연동 해제. (a) 기존 사업 연결 또는 (b) 신규 개설·즉시 매핑.
 */
export function PartnerBusinessesPanel({ partnerId }: { partnerId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = usePartnerBusinesses(partnerId);
  const { data: businessOptions = [] } = useBusinessOptions();
  const { add, remove } = usePartnerBusinessMutations(partnerId);
  const [selected, setSelected] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.business?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => businessOptions.filter((o) => !joinedIds.has(o.value)),
    [businessOptions, joinedIds],
  );

  // 표시는 목록과 동일한 사업 도메인 객체로, 조인 메타(해제)는 사업 id 로 역참조한다.
  const businesses = useMemo(
    () => rows.map((r) => r.business).filter((p): p is Business => Boolean(p)),
    [rows],
  );
  const metaByBusiness = useMemo(() => {
    const m = new Map<string, PartnerBusinessRow>();
    rows.forEach((r) => {
      if (r.business) m.set(r.business.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = (businessId: string, isNew = false) => {
    add.mutate(businessId, {
      onSuccess: () => {
        toast.success(isNew ? '새 사업이 개설·연결되었습니다.' : '참여 사업이 추가되었습니다.');
        setSelected(undefined);
      },
      onError: (err) =>
        toast.error(
          isNew
            ? '사업은 개설됐지만 연결에 실패했습니다. 아래 목록에서 직접 추가해 주세요.'
            : '추가에 실패했습니다.',
          err,
        ),
    });
  };

  const handleRemove = (r: PartnerBusinessRow) => {
    toast.confirm('연동 해제', `'${r.business?.name || '사업'}' 연동을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 사업 목록과 동일한 고유 컬럼 + 연동해제 컬럼.
  const columns: TableProps<Business>['columns'] = [
    ...businessColumns(),
    {
      title: '연동 해제',
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_, p) => {
        const m = metaByBusiness.get(p.id);
        return m ? (
          <Button
            size="small"
            type="text"
            danger
            aria-label="연동 해제"
            icon={<HiOutlineLinkSlash />}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(m);
            }}
          />
        ) : null;
      },
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        참여 사업
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="참여한 사업이 없습니다." />
      ) : (
        <Table<Business>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={businesses}
          pagination={false}
          onRow={(p) => ({
            onClick: () => navigate(`/businesses/${p.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-52"
          placeholder="사업 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 사업이 없습니다.'}
        />
        <Space>
          <Button
            type="primary"
            icon={<HiOutlinePlus />}
            disabled={!selected}
            loading={add.isPending}
            onClick={() => selected && handleAdd(selected)}
          >
            추가
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>+ 새 사업</Button>
        </Space>
      </div>

      <BusinessFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(businessId) => handleAdd(businessId, true)}
      />
    </div>
  );
}

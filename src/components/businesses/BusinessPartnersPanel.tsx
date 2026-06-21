import { useMemo, useState } from 'react';
import { Table, Select, Button } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useBusinessPartners,
  useBusinessPartnerMutations,
  type BusinessPartnerRow,
} from '@/hooks/useBusinessPartners';
import { usePartnerOptions } from '@/hooks/usePartners';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { partnerColumns } from '@/lib/listColumns';
import type { Partner } from '@/types/partner';

/**
 * 사업 참여 협력사(기관) 매핑 패널 (business_partners, 정방향=주인 테이블).
 * 협력사 목록과 동일한 표 형태 + 관리(연결 해제). 추가/해제는 전 직원. (정방향이라 테두리 강조 없음)
 */
export function BusinessPartnersPanel({ businessId }: { businessId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = useBusinessPartners(businessId);
  const { data: partnerOptions = [] } = usePartnerOptions();
  const { add, remove } = useBusinessPartnerMutations(businessId);
  const [selected, setSelected] = useState<string | undefined>();

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.partner?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => partnerOptions.filter((o) => !joinedIds.has(o.value)),
    [partnerOptions, joinedIds],
  );

  // 표시는 목록과 동일한 협력사 도메인 객체로, 조인 메타(해제)는 협력사 id 로 역참조한다.
  const partners = useMemo(
    () => rows.map((r) => r.partner).filter((p): p is Partner => Boolean(p)),
    [rows],
  );
  const metaByPartner = useMemo(() => {
    const m = new Map<string, BusinessPartnerRow>();
    rows.forEach((r) => {
      if (r.partner) m.set(r.partner.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(selected, {
      onSuccess: () => {
        toast.success('참여 협력사가 추가되었습니다.');
        setSelected(undefined);
      },
      onError: (err) => toast.error('추가에 실패했습니다.', err),
    });
  };

  const handleRemove = (r: BusinessPartnerRow) => {
    toast.confirm('연결 해제', `'${r.partner?.name || '협력사'}' 연결을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 협력사 목록과 동일한 고유 컬럼 + 관리(연결 해제) 컬럼.
  const columns: TableProps<Partner>['columns'] = [
    ...partnerColumns(),
    {
      title: '연동 해제',
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_, p) => {
        const m = metaByPartner.get(p.id);
        return m ? (
          <Button
            size="small"
            type="text"
            danger
            aria-label="연결 해제"
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
        참여 협력사
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="연결된 협력사가 없습니다." />
      ) : (
        <Table<Partner>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={partners}
          pagination={false}
          onRow={(p) => ({
            onClick: () => navigate(`/partners/${p.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}

      <div className="flex items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-60"
          placeholder="협력사 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 협력사가 없습니다.'}
        />
        <Button
          type="primary"
          icon={<HiOutlinePlus />}
          disabled={!selected}
          loading={add.isPending}
          onClick={handleAdd}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

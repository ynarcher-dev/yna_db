import { useMemo, useState } from 'react';
import { Select, Button, Modal, InputNumber, DatePicker } from 'antd';
import type { TableProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useEntityManagers,
  useEntityManagerMutations,
  type EntityManager,
  type ManagerEntityKind,
} from '@/hooks/useEntityManagers';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { managerColumns } from '@/lib/listColumns';
import { BUSINESS_MANAGER_ROLE_OPTIONS } from '@/lib/labels';
import { formatDate } from '@/lib/formatters';
import type { Manager } from '@/types/manager';
import type { BusinessManagerRole } from '@/types/database';

/**
 * 담당자(다대다) 배정 패널 — 프로젝트/스타트업/사업/펀드 공용. UI·기능·명칭("담당자") 통일.
 * 심사역 목록과 동일한 표(이름·직급·직책·소속·관심분야) + 관리(연동 해제) 컬럼.
 * - 모든 담당자를 자유롭게 추가/해제한다(작성자 필수 편입 규칙은 0054 에서 폐지).
 * - 사업만 운영 역할(role) 컬럼을 추가로 노출하고 인라인 변경할 수 있다.
 * - canEdit=false 면 추가/해제 컨트롤을 숨긴다(예: 펀드는 Admin 만 편집).
 */
export function EntityManagersPanel({
  kind,
  entityId,
  title = '담당자',
  canEdit = true,
  defaultPeriodStart,
  defaultPeriodEnd,
}: {
  kind: ManagerEntityKind;
  entityId: string;
  title?: string;
  canEdit?: boolean;
  /** 참여율 부여 시 투입 기간 기본값(엔티티 진행 기간). 사업·프로젝트에서 전달 */
  defaultPeriodStart?: string;
  defaultPeriodEnd?: string;
}) {
  const toast = useAppToast();
  const hasRole = kind === 'business';
  // 참여율(투입 비중)은 사업·프로젝트만 (0062). 부여 후 잠금되어 관리자만 수정/해제 가능.
  const hasParticipation = kind === 'business' || kind === 'project';
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const { managers: rows, isLoading } = useEntityManagers(kind, entityId);
  const { data: managerOptions = [] } = useManagerOptions();
  const { add, updateRole, setParticipationBulk, remove } = useEntityManagerMutations(kind, entityId);
  const [selected, setSelected] = useState<string | undefined>();
  const [role, setRole] = useState<BusinessManagerRole>('operator');

  // 참여율 일괄 부여 모달 — 투입 기간(전원 공통) + 인원별 참여율(조인 id → %)
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPeriod, setBulkPeriod] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [bulkRates, setBulkRates] = useState<Record<string, number>>({});

  // 배정된(심사역 임베드 성공) 행만 부여 대상으로 삼는다.
  const assignedRows = useMemo(() => rows.filter((r) => r.manager), [rows]);
  const anyLocked = useMemo(() => assignedRows.some((r) => r.locked), [assignedRows]);
  // 일괄 부여 가능: 대상이 있고 (관리자거나 아직 아무도 잠기지 않은 경우)
  const canAssignParticipation =
    hasParticipation && canEdit && assignedRows.length > 0 && (isAdmin || !anyLocked);

  const openBulk = () => {
    const equal = Math.floor(100 / (assignedRows.length || 1));
    const rates: Record<string, number> = {};
    assignedRows.forEach((r) => {
      rates[r.id] = r.participationRate ?? equal;
    });
    setBulkRates(rates);
    // 기존 부여 기간이 있으면 그 값을, 없으면 엔티티 진행 기간을 기본값으로.
    const withPeriod = assignedRows.find((r) => r.periodStart && r.periodEnd);
    const start = withPeriod?.periodStart ?? defaultPeriodStart;
    const end = withPeriod?.periodEnd ?? defaultPeriodEnd;
    setBulkPeriod([start ? dayjs(start) : null, end ? dayjs(end) : null]);
    setBulkOpen(true);
  };

  const handleBulkSubmit = () => {
    const [start, end] = bulkPeriod;
    if (!start || !end) {
      toast.error('투입 기간을 선택해 주세요.');
      return;
    }
    const allocations = assignedRows.map((r) => ({ id: r.id, rate: bulkRates[r.id] ?? 0 }));
    if (!allocations.length) {
      toast.error('배정된 담당자가 없습니다.');
      return;
    }
    setParticipationBulk.mutate(
      { periodStart: start.format('YYYY-MM-DD'), periodEnd: end.format('YYYY-MM-DD'), allocations },
      {
        onSuccess: () => {
          toast.success('참여율이 일괄 부여되었습니다.');
          setBulkOpen(false);
        },
        onError: (err) => toast.error('참여율 부여에 실패했습니다.', err),
      },
    );
  };

  const bulkRateSum = assignedRows.reduce((s, r) => s + (bulkRates[r.id] ?? 0), 0);

  // 표시는 목록과 동일한 심사역 도메인 객체로, 조인 메타(역할·해제)는 심사역 id 로 역참조한다.
  const managers = useMemo(
    () => rows.map((r) => r.manager).filter((m): m is Manager => Boolean(m)),
    [rows],
  );
  const metaByManager = useMemo(() => {
    const m = new Map<string, EntityManager>();
    rows.forEach((r) => {
      if (r.manager) m.set(r.manager.id, r);
    });
    return m;
  }, [rows]);

  // 이미 배정된 심사역은 추가 후보에서 제외한다.
  const assignedIds = useMemo(() => new Set(managers.map((m) => m.id)), [managers]);
  const availableOptions = useMemo(
    () => managerOptions.filter((o) => !assignedIds.has(o.value)),
    [managerOptions, assignedIds],
  );

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(
      { managerId: selected, role: hasRole ? role : undefined },
      {
        onSuccess: () => {
          toast.success('담당자가 추가되었습니다.');
          setSelected(undefined);
          setRole('operator');
        },
        onError: (err) => toast.error('담당자 추가에 실패했습니다.', err),
      },
    );
  };

  const handleRoleChange = (id: string, next: BusinessManagerRole) => {
    updateRole.mutate(
      { id, role: next },
      { onError: (err) => toast.error('역할 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (m: Manager) => {
    const meta = metaByManager.get(m.id);
    if (!meta) return;
    toast.confirm('담당자 해제', `'${m.name || '심사역'}' 담당 배정을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(meta.id);
        toast.success('담당자가 해제되었습니다.');
      } catch (err) {
        toast.error('담당자 해제에 실패했습니다.', err);
      }
    });
  };

  // 목록과 동일한 고유 컬럼 + (사업) 운영 역할 + 관리(작성자 표시/연동 해제) 컬럼.
  const roleColumn: NonNullable<TableProps<Manager>['columns']>[number] = {
    title: '운영 역할',
    key: 'pm_role',
    width: 120,
    render: (_, m) => {
      const meta = metaByManager.get(m.id);
      if (!meta) return null;
      return canEdit ? (
        // 행 클릭(상세 이동)과 분리: Select 조작이 네비게이션을 트리거하지 않도록 stopPropagation.
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            size="small"
            className="w-24"
            options={BUSINESS_MANAGER_ROLE_OPTIONS}
            value={meta.role}
            onChange={(v: BusinessManagerRole) => handleRoleChange(meta.id, v)}
          />
        </div>
      ) : (
        BUSINESS_MANAGER_ROLE_OPTIONS.find((o) => o.value === meta.role)?.label ?? '-'
      );
    },
  };

  // 참여율 / 투입 기간 (사업·프로젝트). 표시 전용 — 부여는 카드 하단 '일괄 부여'로 한다.
  const participationColumn: NonNullable<TableProps<Manager>['columns']>[number] = {
    title: '참여율 / 투입기간',
    key: 'participation',
    width: 170,
    render: (_, m) => {
      const meta = metaByManager.get(m.id);
      if (!meta || meta.participationRate == null) {
        return <span className="text-yna-sub">미부여</span>;
      }
      return (
        <div>
          <div className="text-sm font-medium text-yna-main">
            {meta.participationRate}%
            {meta.locked ? (
              <span className="ml-1 text-xs font-normal text-yna-sub">· 잠금</span>
            ) : null}
          </div>
          <div className="text-xs text-yna-sub">
            {meta.periodStart ? formatDate(meta.periodStart) : '-'} ~{' '}
            {meta.periodEnd ? formatDate(meta.periodEnd) : '-'}
          </div>
        </div>
      );
    },
  };

  const manageColumn: NonNullable<TableProps<Manager>['columns']>[number] = {
    title: '관리',
    key: 'actions',
    width: 90,
    align: 'center',
    render: (_, m) => {
      if (!canEdit) return null;
      return (
        <Button
          size="small"
          type="text"
          danger
          aria-label="담당자 해제"
          icon={<HiOutlineLinkSlash />}
          onClick={(e) => {
            e.stopPropagation();
            handleRemove(m);
          }}
        />
      );
    },
  };

  const columns: TableProps<Manager>['columns'] = [
    ...managerColumns(),
    ...(hasRole ? [roleColumn] : []),
    ...(hasParticipation ? [participationColumn] : []),
    manageColumn,
  ];

  return (
    <>
      <RelatedTableCard<Manager>
        title={title}
        columns={columns}
        data={managers}
        isLoading={isLoading}
        emptyText="아직 배정된 담당자가 없습니다."
        getHref={(m) => `/managers/${m.id}`}
        headerAction={
          canAssignParticipation ? (
            <Button size="small" onClick={openBulk}>
              {anyLocked ? '참여율 수정 (관리자)' : '참여율 일괄 부여'}
            </Button>
          ) : null
        }
        footer={
          canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                className="w-60"
                placeholder="담당 심사역 선택"
                options={availableOptions}
                value={selected}
                onChange={(v?: string) => setSelected(v)}
                notFoundContent={availableOptions.length ? undefined : '추가할 심사역이 없습니다.'}
              />
              {hasRole ? (
                <Select
                  className="w-28"
                  options={BUSINESS_MANAGER_ROLE_OPTIONS}
                  value={role}
                  onChange={(v: BusinessManagerRole) => setRole(v)}
                />
              ) : null}
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
          ) : null
        }
      />

      <Modal
        open={bulkOpen}
        title={anyLocked ? '참여율 수정 (관리자)' : '참여율 일괄 부여'}
        okText={anyLocked ? '수정' : '부여'}
        confirmLoading={setParticipationBulk.isPending}
        onOk={handleBulkSubmit}
        onCancel={() => setBulkOpen(false)}
        destroyOnClose
      >
        <p className="mb-3 text-xs text-yna-sub">
          투입 기간은 전원 공통입니다. 부여 후에는 관리자를 제외하고 수정·해제할 수 없습니다. 통계는 투입
          기간을 월 단위로 환산해 계산됩니다.
        </p>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-yna-main">투입 기간 *</label>
          <DatePicker.RangePicker
            className="w-full"
            value={bulkPeriod}
            onChange={(r) => setBulkPeriod([r?.[0] ?? null, r?.[1] ?? null])}
          />
        </div>
        <div className="mb-2 flex items-center justify-between text-sm text-yna-main">
          <span>인원별 참여율 *</span>
          <span className={bulkRateSum === 100 ? 'text-yna-sub' : 'text-yna-point'}>
            합계 {bulkRateSum}%
          </span>
        </div>
        <div className="space-y-2">
          {assignedRows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-yna-main">{r.manager?.name ?? '-'}</span>
              <InputNumber
                size="small"
                className="w-28"
                min={0}
                max={100}
                addonAfter="%"
                value={bulkRates[r.id] ?? 0}
                onChange={(v) =>
                  setBulkRates((prev) => ({ ...prev, [r.id]: typeof v === 'number' ? v : 0 }))
                }
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

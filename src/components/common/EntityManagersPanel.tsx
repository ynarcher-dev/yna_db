import { useMemo, useState } from 'react';
import { Select, Button } from 'antd';
import type { TableProps } from 'antd';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useEntityManagers,
  useEntityManagerMutations,
  type EntityManager,
  type ManagerEntityKind,
} from '@/hooks/useEntityManagers';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAppToast } from '@/components/common/useAppToast';
import { RelatedTableCard } from '@/components/common/RelatedTableCard';
import { managerColumns } from '@/lib/listColumns';
import { BUSINESS_MANAGER_ROLE_OPTIONS } from '@/lib/labels';
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
}: {
  kind: ManagerEntityKind;
  entityId: string;
  title?: string;
  canEdit?: boolean;
}) {
  const toast = useAppToast();
  const hasRole = kind === 'business';
  const { managers: rows, isLoading } = useEntityManagers(kind, entityId);
  const { data: managerOptions = [] } = useManagerOptions();
  const { add, updateRole, remove } = useEntityManagerMutations(kind, entityId);
  const [selected, setSelected] = useState<string | undefined>();
  const [role, setRole] = useState<BusinessManagerRole>('operator');

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
    manageColumn,
  ];

  return (
    <RelatedTableCard<Manager>
      title={title}
      columns={columns}
      data={managers}
      isLoading={isLoading}
      emptyText="아직 배정된 담당자가 없습니다."
      getHref={(m) => `/managers/${m.id}`}
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
  );
}

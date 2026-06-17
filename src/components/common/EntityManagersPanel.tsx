import { useMemo, useState } from 'react';
import { Tag, Select, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import {
  useEntityManagers,
  useEntityManagerMutations,
  type ManagerEntityKind,
} from '@/hooks/useEntityManagers';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 담당자(다대다) 배정 패널 — 프로젝트/스타트업 공용 (책임자 created_by 와 별개).
 * 담당 심사역을 여러 명 배정/해제한다. 편집은 전 직원 공통.
 */
export function EntityManagersPanel({
  kind,
  entityId,
  title = '담당자',
}: {
  kind: ManagerEntityKind;
  entityId: string;
  title?: string;
}) {
  const toast = useAppToast();
  const { managers, isLoading } = useEntityManagers(kind, entityId);
  const { data: managerOptions = [] } = useManagerOptions();
  const { add, remove } = useEntityManagerMutations(kind, entityId);
  const [selected, setSelected] = useState<string | undefined>();

  // 이미 배정된 심사역은 추가 후보에서 제외한다.
  const assignedIds = useMemo(() => new Set(managers.map((m) => m.managerId)), [managers]);
  const availableOptions = useMemo(
    () => managerOptions.filter((o) => !assignedIds.has(o.value)),
    [managerOptions, assignedIds],
  );

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(selected, {
      onSuccess: () => {
        toast.success('담당자가 추가되었습니다.');
        setSelected(undefined);
      },
      onError: (err) => toast.error('담당자 추가에 실패했습니다.', err),
    });
  };

  const handleRemove = (joinId: string, name: string) => {
    toast.confirm('담당자 해제', `'${name || '심사역'}' 담당 배정을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(joinId);
        toast.success('담당자가 해제되었습니다.');
      } catch (err) {
        toast.error('담당자 해제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">{title}</h2>

      {isLoading ? (
        <Spin size="small" />
      ) : managers.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {managers.map((m) => (
            <Tag
              key={m.id}
              closable
              onClose={(e) => {
                e.preventDefault();
                handleRemove(m.id, m.managerName);
              }}
              className="flex items-center gap-1 px-2 py-1"
            >
              <Link className="text-yna-point" to={`/managers/${m.managerId}`}>
                {m.managerName || '심사역'}
              </Link>
            </Tag>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-yna-sub">아직 배정된 담당자가 없습니다.</p>
      )}

      <div className="flex items-center gap-2">
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

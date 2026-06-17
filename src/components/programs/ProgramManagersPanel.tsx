import { useMemo, useState } from 'react';
import { Select, Button, Spin, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { useProgramManagers, useProgramManagerMutations } from '@/hooks/useProgramManagers';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAppToast } from '@/components/common/useAppToast';
import {
  PROGRAM_MANAGER_ROLE_OPTIONS,
  PROGRAM_MANAGER_ROLE_COLOR,
  PROGRAM_MANAGER_ROLE_LABEL,
} from '@/lib/labels';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 프로그램 운영 심사역 매핑 패널 (7_programs.md 7.3, 다대다 + 역할).
 * 운영총괄(lead)/운영담당(operator) 역할로 심사역을 배정·역할변경·해제한다. 편집은 전 직원.
 */
export function ProgramManagersPanel({ programId }: { programId: string }) {
  const toast = useAppToast();
  const { managers, isLoading } = useProgramManagers(programId);
  const { data: managerOptions = [] } = useManagerOptions();
  const { add, updateRole, remove } = useProgramManagerMutations(programId);
  const [selected, setSelected] = useState<string | undefined>();
  const [role, setRole] = useState<ProgramManagerRole>('operator');

  const assignedIds = useMemo(() => new Set(managers.map((m) => m.managerId)), [managers]);
  const availableOptions = useMemo(
    () => managerOptions.filter((o) => !assignedIds.has(o.value)),
    [managerOptions, assignedIds],
  );

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(
      { managerId: selected, role },
      {
        onSuccess: () => {
          toast.success('운영 심사역이 배정되었습니다.');
          setSelected(undefined);
          setRole('operator');
        },
        onError: (err) => toast.error('배정에 실패했습니다.', err),
      },
    );
  };

  const handleRoleChange = (id: string, next: ProgramManagerRole) => {
    updateRole.mutate(
      { id, role: next },
      { onError: (err) => toast.error('역할 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (joinId: string, name: string) => {
    toast.confirm('배정 해제', `'${name || '심사역'}' 운영 배정을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(joinId);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">운영 심사역</h2>

      {isLoading ? (
        <Spin size="small" />
      ) : managers.length ? (
        <div className="mb-4 space-y-2">
          {managers.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Tag color={PROGRAM_MANAGER_ROLE_COLOR[m.role]} className="m-0 w-16 text-center">
                {PROGRAM_MANAGER_ROLE_LABEL[m.role]}
              </Tag>
              <Link className="flex-1 text-yna-point" to={`/managers/${m.managerId}`}>
                {m.managerName || '심사역'}
              </Link>
              <Select
                size="small"
                className="w-28"
                options={PROGRAM_MANAGER_ROLE_OPTIONS}
                value={m.role}
                onChange={(v: ProgramManagerRole) => handleRoleChange(m.id, v)}
              />
              <Button
                size="small"
                type="text"
                danger
                aria-label="배정 해제"
                icon={<HiOutlineTrash />}
                onClick={() => handleRemove(m.id, m.managerName)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-yna-sub">아직 배정된 운영 심사역이 없습니다.</p>
      )}

      <div className="flex items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-52"
          placeholder="심사역 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 심사역이 없습니다.'}
        />
        <Select
          className="w-28"
          options={PROGRAM_MANAGER_ROLE_OPTIONS}
          value={role}
          onChange={(v: ProgramManagerRole) => setRole(v)}
        />
        <Button
          type="primary"
          icon={<HiOutlinePlus />}
          disabled={!selected}
          loading={add.isPending}
          onClick={handleAdd}
        >
          배정
        </Button>
      </div>
    </div>
  );
}

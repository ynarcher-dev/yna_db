import { useMemo, useState } from 'react';
import { Table, Select, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useManagerPrograms,
  useManagerProgramMutations,
  type ManagerProgramRow,
} from '@/hooks/useManagerRelations';
import { useProgramOptions } from '@/hooks/usePrograms';
import { ProgramFormDrawer } from '@/components/programs/ProgramFormDrawer';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { programColumns } from '@/lib/listColumns';
import { PROGRAM_MANAGER_ROLE_OPTIONS } from '@/lib/labels';
import type { Program } from '@/types/program';
import type { ProgramManagerRole } from '@/types/database';

/**
 * 심사역 상세 "운영 프로그램" 역방향 편집 패널 (program_managers '쓰는 쪽', 역할 lead/operator).
 * 표시는 프로그램 목록과 동일한 컬럼 + 역할(인라인 변경)·연동 해제. 기존 연결 또는 신규 개설·즉시 매핑.
 */
export function ManagerProgramsPanel({ managerId }: { managerId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = useManagerPrograms(managerId);
  const { data: programOptions = [] } = useProgramOptions();
  const { add, updateRole, remove } = useManagerProgramMutations(managerId);
  const [selected, setSelected] = useState<string | undefined>();
  const [role, setRole] = useState<ProgramManagerRole>('operator');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.program?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => programOptions.filter((o) => !joinedIds.has(o.value)),
    [programOptions, joinedIds],
  );

  // 표시는 목록과 동일한 프로그램 도메인 객체로, 조인 메타(역할·해제)는 프로그램 id 로 역참조한다.
  const programs = useMemo(
    () => rows.map((r) => r.program).filter((p): p is Program => Boolean(p)),
    [rows],
  );
  const metaByProgram = useMemo(() => {
    const m = new Map<string, ManagerProgramRow>();
    rows.forEach((r) => {
      if (r.program) m.set(r.program.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = (programId: string, nextRole: ProgramManagerRole, isNew = false) => {
    add.mutate(
      { programId, role: nextRole },
      {
        onSuccess: () => {
          toast.success(isNew ? '새 프로그램이 개설·연결되었습니다.' : '운영 프로그램이 추가되었습니다.');
          setSelected(undefined);
          setRole('operator');
        },
        onError: (err) =>
          toast.error(
            isNew
              ? '프로그램은 개설됐지만 연결에 실패했습니다. 아래 목록에서 직접 추가해 주세요.'
              : '추가에 실패했습니다.',
            err,
          ),
      },
    );
  };

  const handleRoleChange = (id: string, next: ProgramManagerRole) => {
    updateRole.mutate(
      { id, role: next },
      { onError: (err) => toast.error('역할 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (r: ManagerProgramRow) => {
    toast.confirm('배정 해제', `'${r.program?.name || '프로그램'}' 운영 배정을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 목록 화면과 동일한 프로그램 고유 컬럼 + 이 관계에만 있는 역할·연동해제 컬럼.
  const columns: TableProps<Program>['columns'] = [
    ...programColumns(),
    {
      title: '역할',
      key: 'role',
      width: 120,
      render: (_, p) => {
        const m = metaByProgram.get(p.id);
        return m ? (
          // 행 클릭(상세 이동)과 분리: Select 조작이 네비게이션을 트리거하지 않도록 stopPropagation.
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              className="w-24"
              options={PROGRAM_MANAGER_ROLE_OPTIONS}
              value={m.role}
              onChange={(v: ProgramManagerRole) => handleRoleChange(m.id, v)}
            />
          </div>
        ) : null;
      },
    },
    {
      title: '연동 해제',
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_, p) => {
        const m = metaByProgram.get(p.id);
        return m ? (
          <Button
            size="small"
            type="text"
            danger
            aria-label="배정 해제"
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
        운영 프로그램
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="운영 중인 프로그램이 없습니다." />
      ) : (
        <Table<Program>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={programs}
          pagination={false}
          onRow={(p) => ({
            onClick: () => navigate(`/programs/${p.id}`),
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
          placeholder="프로그램 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 프로그램이 없습니다.'}
        />
        <Select
          className="w-28"
          options={PROGRAM_MANAGER_ROLE_OPTIONS}
          value={role}
          onChange={(v: ProgramManagerRole) => setRole(v)}
        />
        <Space>
          <Button
            type="primary"
            icon={<HiOutlinePlus />}
            disabled={!selected}
            loading={add.isPending}
            onClick={() => selected && handleAdd(selected, role)}
          >
            추가
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>+ 새 프로그램</Button>
        </Space>
      </div>

      <ProgramFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(programId) => handleAdd(programId, 'operator', true)}
      />
    </div>
  );
}

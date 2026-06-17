import { useMemo, useState } from 'react';
import { Table, Select, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useStartupPrograms,
  useStartupProgramMutations,
  type StartupProgramRow,
} from '@/hooks/useProgramStartups';
import { useProgramOptions } from '@/hooks/usePrograms';
import { ProgramFormDrawer } from '@/components/programs/ProgramFormDrawer';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { programColumns } from '@/lib/listColumns';
import { PROGRAM_STARTUP_STATUS_OPTIONS } from '@/lib/labels';
import type { Program } from '@/types/program';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 스타트업 상세 "참여 프로그램" 역방향 편집 패널 (양방향 매핑의 '쓰는 쪽').
 * (a) 기존 프로그램을 골라 연결하거나 (b) 새 프로그램을 개설하면서 즉시 이 스타트업에 매핑한다.
 * 백엔드는 program_startups 쓰기 RLS(0044)·programs 생성(0043)으로 이미 열려 있다.
 */
export function StartupProgramsPanel({ startupId }: { startupId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = useStartupPrograms(startupId);
  const { data: programOptions = [] } = useProgramOptions();
  const { add, updateStatus, remove } = useStartupProgramMutations(startupId);
  const [selected, setSelected] = useState<string | undefined>();
  const [status, setStatus] = useState<ProgramStartupStatus>('applied');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.program?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => programOptions.filter((o) => !joinedIds.has(o.value)),
    [programOptions, joinedIds],
  );

  // 표시는 목록과 동일한 프로그램 도메인 객체로, 조인 메타(상태·해제)는 프로그램 id 로 역참조한다.
  const programs = useMemo(
    () => rows.map((r) => r.program).filter((p): p is Program => Boolean(p)),
    [rows],
  );
  const metaByProgram = useMemo(() => {
    const m = new Map<string, StartupProgramRow>();
    rows.forEach((r) => {
      if (r.program) m.set(r.program.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = (programId: string, nextStatus: ProgramStartupStatus, isNew = false) => {
    add.mutate(
      { programId, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(isNew ? '새 프로그램이 개설·연결되었습니다.' : '참여 프로그램이 추가되었습니다.');
          setSelected(undefined);
          setStatus('applied');
        },
        // (b) 신규생성 직후 매핑이 실패해도 프로그램 자체는 이미 만들어져 있다 → 수동 추가 안내.
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

  const handleStatusChange = (id: string, next: ProgramStartupStatus) => {
    updateStatus.mutate(
      { id, status: next },
      { onError: (err) => toast.error('상태 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (r: StartupProgramRow) => {
    toast.confirm('참여 해제', `'${r.program?.name || '프로그램'}' 참여를 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 목록 화면과 동일한 프로그램 고유 컬럼 + 이 관계에만 있는 보육상태·연동해제 컬럼.
  const columns: TableProps<Program>['columns'] = [
    ...programColumns(),
    {
      title: '보육 상태',
      key: 'status',
      width: 160,
      render: (_, p) => {
        const m = metaByProgram.get(p.id);
        return m ? (
          // 행 클릭(상세 이동)과 분리: Select 조작이 네비게이션을 트리거하지 않도록 stopPropagation.
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              className="w-32"
              options={PROGRAM_STARTUP_STATUS_OPTIONS}
              value={m.status}
              onChange={(v: ProgramStartupStatus) => handleStatusChange(m.id, v)}
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
            aria-label="참여 해제"
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
        참여 프로그램
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="참여한 프로그램이 없습니다." />
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
          options={PROGRAM_STARTUP_STATUS_OPTIONS}
          value={status}
          onChange={(v: ProgramStartupStatus) => setStatus(v)}
        />
        <Space>
          <Button
            type="primary"
            icon={<HiOutlinePlus />}
            disabled={!selected}
            loading={add.isPending}
            onClick={() => selected && handleAdd(selected, status)}
          >
            추가
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>+ 새 프로그램</Button>
        </Space>
      </div>

      <ProgramFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        // (b) 개설 성공 → 새 program id 로 곧바로 이 스타트업에 매핑.
        //     신규 개설은 보육 상태를 항상 '지원(applied)'으로 시작한다(상태는 이후 변경).
        onSaved={(programId) => handleAdd(programId, 'applied', true)}
      />
    </div>
  );
}

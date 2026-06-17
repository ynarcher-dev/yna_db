import { useMemo, useState } from 'react';
import { Table, Select, Button } from 'antd';
import type { TableProps } from 'antd';
import { Link } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { useProgramStartups, useProgramStartupMutations } from '@/hooks/useProgramStartups';
import { useStartupOptions } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { PROGRAM_STARTUP_STATUS_OPTIONS } from '@/lib/labels';
import type { ProgramStartup } from '@/types/programStartup';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 프로그램 참여 스타트업 매핑 테이블 (7_programs.md 7.3). 추가/상태변경/해제는 전 직원.
 * 보육 상태(지원/심사중/선정/수료/중도탈락)를 행에서 인라인으로 바꾼다.
 */
export function ProgramStartupsPanel({ programId }: { programId: string }) {
  const toast = useAppToast();
  const { participants, isLoading } = useProgramStartups(programId);
  const { data: startupOptions = [] } = useStartupOptions();
  const { add, updateStatus, remove } = useProgramStartupMutations(programId);
  const [selected, setSelected] = useState<string | undefined>();
  const [status, setStatus] = useState<ProgramStartupStatus>('applied');

  const joinedIds = useMemo(() => new Set(participants.map((p) => p.startupId)), [participants]);
  const availableOptions = useMemo(
    () => startupOptions.filter((o) => !joinedIds.has(o.value)),
    [startupOptions, joinedIds],
  );

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(
      { startupId: selected, status },
      {
        onSuccess: () => {
          toast.success('참여 스타트업이 추가되었습니다.');
          setSelected(undefined);
          setStatus('applied');
        },
        onError: (err) => toast.error('추가에 실패했습니다.', err),
      },
    );
  };

  const handleStatusChange = (id: string, next: ProgramStartupStatus) => {
    updateStatus.mutate(
      { id, status: next },
      { onError: (err) => toast.error('상태 변경에 실패했습니다.', err) },
    );
  };

  const handleRemove = (p: ProgramStartup) => {
    toast.confirm('참여 해제', `'${p.startupName || '스타트업'}' 참여를 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(p.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  const columns: TableProps<ProgramStartup>['columns'] = [
    {
      title: '스타트업',
      key: 'startup',
      ellipsis: true,
      render: (_, r) => (
        <Link className="text-yna-point" to={`/startups/${r.startupId}`}>
          {r.startupName || '스타트업'}
        </Link>
      ),
    },
    {
      title: '보육 상태',
      key: 'status',
      width: 160,
      render: (_, r) => (
        <Select
          size="small"
          className="w-32"
          options={PROGRAM_STARTUP_STATUS_OPTIONS}
          value={r.status}
          onChange={(v: ProgramStartupStatus) => handleStatusChange(r.id, v)}
        />
      ),
    },
    {
      title: '관리',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          danger
          aria-label="참여 해제"
          icon={<HiOutlineTrash />}
          onClick={() => handleRemove(r)}
        />
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">참여 스타트업</h2>

      {participants.length === 0 && !isLoading ? (
        <EmptyState message="아직 참여 스타트업이 없습니다." />
      ) : (
        <Table<ProgramStartup>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={participants}
          pagination={false}
        />
      )}

      <div className="flex items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-52"
          placeholder="스타트업 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 스타트업이 없습니다.'}
        />
        <Select
          className="w-28"
          options={PROGRAM_STARTUP_STATUS_OPTIONS}
          value={status}
          onChange={(v: ProgramStartupStatus) => setStatus(v)}
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

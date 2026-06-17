import { useMemo, useState } from 'react';
import { Table, Select, Button } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useProgramStartups,
  useProgramStartupMutations,
  type ProgramStartupRow,
} from '@/hooks/useProgramStartups';
import { useStartupOptions } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { startupColumns } from '@/lib/listColumns';
import { PROGRAM_STARTUP_STATUS_OPTIONS } from '@/lib/labels';
import type { Startup } from '@/types/startup';
import type { ProgramStartupStatus } from '@/types/database';

/**
 * 프로그램 참여 스타트업 매핑 패널 (program_startups, 정방향=주인 테이블).
 * 스타트업 목록과 동일한 표 형태 + 보육 상태(인라인 변경)·연동 해제. 추가/상태변경/해제는 전 직원.
 */
export function ProgramStartupsPanel({ programId }: { programId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { participants: rows, isLoading } = useProgramStartups(programId);
  const { data: startupOptions = [] } = useStartupOptions();
  const { add, updateStatus, remove } = useProgramStartupMutations(programId);
  const [selected, setSelected] = useState<string | undefined>();
  const [status, setStatus] = useState<ProgramStartupStatus>('applied');

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.startup?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => startupOptions.filter((o) => !joinedIds.has(o.value)),
    [startupOptions, joinedIds],
  );

  // 표시는 목록과 동일한 스타트업 도메인 객체로, 조인 메타(상태·해제)는 스타트업 id 로 역참조한다.
  const startups = useMemo(
    () => rows.map((r) => r.startup).filter((s): s is Startup => Boolean(s)),
    [rows],
  );
  const metaByStartup = useMemo(() => {
    const m = new Map<string, ProgramStartupRow>();
    rows.forEach((r) => {
      if (r.startup) m.set(r.startup.id, r);
    });
    return m;
  }, [rows]);

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

  const handleRemove = (r: ProgramStartupRow) => {
    toast.confirm('연동 해제', `'${r.startup?.name || '스타트업'}' 참여를 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 스타트업 목록과 동일한 고유 컬럼 + 이 관계에만 있는 보육상태·연동해제 컬럼.
  const columns: TableProps<Startup>['columns'] = [
    ...startupColumns(),
    {
      title: '보육 상태',
      key: 'status',
      width: 160,
      render: (_, s) => {
        const m = metaByStartup.get(s.id);
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
      render: (_, s) => {
        const m = metaByStartup.get(s.id);
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
        참여 스타트업
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="아직 참여 스타트업이 없습니다." />
      ) : (
        <Table<Startup>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={startups}
          pagination={false}
          onRow={(s) => ({
            onClick: () => navigate(`/startups/${s.id}`),
            style: { cursor: 'pointer' },
          })}
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

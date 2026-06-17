import { useMemo, useState } from 'react';
import { Table, Select, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  useManagerStartups,
  useManagerStartupMutations,
  type ManagerStartupRow,
} from '@/hooks/useManagerRelations';
import { useStartupOptions } from '@/hooks/useStartups';
import { StartupFormDrawer } from '@/components/startups/StartupFormDrawer';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { startupColumns } from '@/lib/listColumns';
import type { Startup } from '@/types/startup';

/**
 * 심사역 상세 "담당 스타트업" 역방향 편집 패널 (startup_managers '쓰는 쪽', 역할 없음).
 * 표시는 스타트업 목록과 동일한 컬럼 + 연동 해제. (a) 기존 스타트업 연결 또는 (b) 신규 등록·즉시 매핑.
 */
export function ManagerStartupsPanel({ managerId }: { managerId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = useManagerStartups(managerId);
  const { data: startupOptions = [] } = useStartupOptions();
  const { add, remove } = useManagerStartupMutations(managerId);
  const [selected, setSelected] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.startup?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => startupOptions.filter((o) => !joinedIds.has(o.value)),
    [startupOptions, joinedIds],
  );

  // 표시는 목록과 동일한 스타트업 도메인 객체로, 조인 메타(해제)는 스타트업 id 로 역참조한다.
  const startups = useMemo(
    () => rows.map((r) => r.startup).filter((s): s is Startup => Boolean(s)),
    [rows],
  );
  const metaByStartup = useMemo(() => {
    const m = new Map<string, ManagerStartupRow>();
    rows.forEach((r) => {
      if (r.startup) m.set(r.startup.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = (startupId: string, isNew = false) => {
    add.mutate(startupId, {
      onSuccess: () => {
        toast.success(isNew ? '새 스타트업이 등록·연결되었습니다.' : '담당 스타트업이 추가되었습니다.');
        setSelected(undefined);
      },
      onError: (err) =>
        toast.error(
          isNew
            ? '스타트업은 등록됐지만 연결에 실패했습니다. 아래 목록에서 직접 추가해 주세요.'
            : '추가에 실패했습니다.',
          err,
        ),
    });
  };

  const handleRemove = (r: ManagerStartupRow) => {
    toast.confirm('담당 해제', `'${r.startup?.name || '스타트업'}' 담당을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 목록 화면과 동일한 스타트업 고유 컬럼 + 연동해제 컬럼.
  const columns: TableProps<Startup>['columns'] = [
    ...startupColumns(),
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
            aria-label="담당 해제"
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
        담당 스타트업
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="담당 중인 스타트업이 없습니다." />
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

      <div className="flex flex-wrap items-center gap-2">
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
          <Button onClick={() => setDrawerOpen(true)}>+ 새 스타트업</Button>
        </Space>
      </div>

      <StartupFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(startupId) => handleAdd(startupId, true)}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Button } from 'antd';
import { HiOutlinePlus } from 'react-icons/hi';
import { useProjectEvents, useProjectEventMutations } from '@/hooks/useProjectEvents';
import { useEntityManagers } from '@/hooks/useEntityManagers';
import { ProjectEventFormDrawer } from './ProjectEventFormDrawer';
import { MilestoneGantt, type GanttItem } from '@/components/common/MilestoneGantt';
import { useAppToast } from '@/components/common/useAppToast';
import type { EventStatus } from '@/types/database';
import type { ProjectEvent } from '@/types/projectEvent';

/**
 * 프로젝트 마일스톤 간트차트 (23_gantt_milestone.md 23.3).
 * 사업(BusinessCalendarBlock)과 동일 구조. project_events → system_events 자동 동기화.
 */
export function ProjectCalendarBlock({
  projectId,
  rangeStart,
  rangeEnd,
}: {
  projectId: string;
  rangeStart?: string;
  rangeEnd?: string;
}) {
  const { events } = useProjectEvents(projectId);
  const { patch, reorder } = useProjectEventMutations(projectId);
  const { managers } = useEntityManagers('project', projectId);
  const toast = useAppToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectEvent | undefined>();

  // 담당자 후보 = 프로젝트에 배정된 담당자(선수).
  const managerOptions = useMemo(
    () =>
      managers
        .map((m) => m.manager)
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => ({ value: m.id, label: m.name || '심사역' })),
    [managers],
  );

  // 담당자 id → 이름(배정 목록 기준). 다중 담당자 이름 표시에 사용.
  const managerNameById = useMemo(
    () => Object.fromEntries(managerOptions.map((o) => [o.value, o.label])),
    [managerOptions],
  );

  const ganttItems = useMemo<GanttItem[]>(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        managerNames: e.managerIds.map((id) => managerNameById[id]).filter(Boolean),
        dependencies: e.dependencies,
      })),
    [events, managerNameById],
  );

  const openEdit = (id: string) => {
    const found = events.find((e) => e.id === id);
    if (found) {
      setEditing(found);
      setDrawerOpen(true);
    }
  };

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };

  const handleDateChange = (id: string, startDate: string, endDate: string) => {
    patch.mutate(
      { id, changes: { startDate, endDate } },
      { onError: (err) => toast.error('일정 이동에 실패했습니다.', err) },
    );
  };

  const handleStatusChange = (id: string, status: EventStatus) => {
    patch.mutate(
      { id, changes: { status } },
      { onError: (err) => toast.error('상태 변경에 실패했습니다.', err) },
    );
  };

  const handleReorder = (orderedIds: string[]) => {
    reorder.mutate(orderedIds, {
      onError: (err) => toast.error('순서 변경에 실패했습니다.', err),
    });
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-yna-main">마일스톤 간트차트</h2>
          <p className="mt-0.5 text-xs text-yna-sub">
            바를 드래그해 일정을 옮기고, 좌측 손잡이로 순서를 바꿀 수 있습니다.
          </p>
        </div>
        <Button size="small" type="primary" icon={<HiOutlinePlus />} onClick={openCreate}>
          테스크 추가
        </Button>
      </div>

      <MilestoneGantt
        items={ganttItems}
        onSelect={openEdit}
        onDateChange={handleDateChange}
        onStatusChange={handleStatusChange}
        onReorder={handleReorder}
      />

      <ProjectEventFormDrawer
        open={drawerOpen}
        projectId={projectId}
        event={editing}
        managerOptions={managerOptions}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

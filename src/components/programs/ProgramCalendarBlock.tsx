import { useState } from 'react';
import { Button } from 'antd';
import { HiOutlinePlus } from 'react-icons/hi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventClickArg } from '@fullcalendar/core';
import { useProgramEvents } from '@/hooks/useProgramEvents';
import { ProgramEventFormDrawer } from './ProgramEventFormDrawer';
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL } from '@/lib/labels';
import type { EventType } from '@/types/database';
import type { ProgramEvent } from '@/types/programEvent';

/**
 * 프로그램 마일스톤 캘린더 (7_programs.md 7.3 — FullCalendar 월간 뷰).
 * 일정 등록/수정/삭제는 system_events(대시보드 다가오는 일정)로 자동 동기화된다.
 * 이벤트 클릭 → 수정, '일정 추가' 버튼 → 신규 등록(@fullcalendar/interaction 미사용).
 */
export function ProgramCalendarBlock({ programId }: { programId: string }) {
  const { events } = useProgramEvents(programId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramEvent | undefined>();

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: `${EVENT_TYPE_LABEL[e.eventType]} · ${e.title}`,
    date: e.eventDate,
    color: EVENT_TYPE_COLOR[e.eventType],
  }));

  const onEventClick = (arg: EventClickArg) => {
    const found = events.find((e) => e.id === arg.event.id);
    if (found) {
      setEditing(found);
      setDrawerOpen(true);
    }
  };

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-yna-main">마일스톤 캘린더</h2>
        <Button size="small" type="primary" icon={<HiOutlinePlus />} onClick={openCreate}>
          일정 추가
        </Button>
      </div>

      {/* 유형 색상 범례 */}
      <div className="mb-3 flex flex-wrap gap-3">
        {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs text-yna-sub">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLOR[t] }}
            />
            {EVENT_TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={fcEvents}
        eventClick={onEventClick}
        height="auto"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
        firstDay={0}
      />

      <ProgramEventFormDrawer
        open={drawerOpen}
        programId={programId}
        event={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Segmented, Empty, Select, Tag } from 'antd';
import { MdDragIndicator } from 'react-icons/md';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import { Gantt, ViewMode, type Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import {
  EVENT_STATUS_BAR_COLOR,
  EVENT_STATUS_LABEL,
  EVENT_STATUS_OPTIONS,
  badgeTone,
  EVENT_STATUS_COLOR,
} from '@/lib/labels';
import type { EventStatus } from '@/types/database';

/**
 * 마일스톤 간트차트 (23_gantt_milestone.md) — 사업·프로젝트 공용.
 * 좌측 WBS(테스크명·담당자·기간·상태, 드래그로 순서 변경) + 우측 타임라인(바 드래그로 날짜 조정).
 * 상태별 바 색(뱃지 톤과 동일)으로 진행을 구분한다.
 * 선후관계(dependencies)는 메타로만 보관 — 다른 테스크 이동이 이 테스크를 강제 조정하지 않는다.
 */
export interface GanttItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: EventStatus;
  /** 담당자(선수) 이름 배열 — 다중 지정 */
  managerNames: string[];
  dependencies: string[];
}

/** 상태 색 점 + 라벨 — WBS 상태 Select 의 옵션·선택값 표시(뱃지 색군과 일치). */
function StatusDotLabel({ status, label }: { status: EventStatus; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: EVENT_STATUS_BAR_COLOR[status] }}
      />
      {label}
    </span>
  );
}

const LIST_WIDTH = 680; // 좌측 WBS 총 너비(px) — 테스크명·담당자 칸을 넓힘
const COL = { handle: 28, manager: 200, period: 110, status: 120 }; // 테스크명은 나머지(flex)
const HEADER_BG = '#e8e8e8'; // 데이터 테이블 헤더(theme.Table.headerBg)와 동일 톤

export function MilestoneGantt({
  items,
  onSelect,
  onDateChange,
  onStatusChange,
  onReorder,
}: {
  items: GanttItem[];
  onSelect: (id: string) => void;
  onDateChange: (id: string, startDate: string, endDate: string) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  // 기본 보기는 '월'(발주자 요청). 보기 전환 순서도 월·주·일.
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  // 드래그 재정렬을 부드럽게 보이도록 로컬 순서를 들고, props 변경 시 동기화한다.
  const [order, setOrder] = useState<GanttItem[]>(items);
  useEffect(() => setOrder(items), [items]);
  // 첫 진입 시 차트를 '오늘' 기준으로 보여준다(스크롤 위치 기준일).
  const today = useMemo(() => new Date(), []);

  // 화면 표시는 종료일을 포함(inclusive)하도록 +1일 한 Date 로 그린다. 저장 시 -1일 환산.
  const tasks = useMemo<Task[]>(
    () =>
      order.map((it) => {
        const color = EVENT_STATUS_BAR_COLOR[it.status];
        return {
          id: it.id,
          type: 'task',
          name: it.title,
          start: dayjs(it.startDate).toDate(),
          end: dayjs(it.endDate).add(1, 'day').toDate(),
          progress: 0,
          dependencies: it.dependencies,
          styles: { backgroundColor: color, backgroundSelectedColor: color },
        };
      }),
    [order],
  );

  const handleDateChange = (task: Task) => {
    const startDate = dayjs(task.start).format('YYYY-MM-DD');
    let endDate = dayjs(task.end).subtract(1, 'day').format('YYYY-MM-DD');
    if (endDate < startDate) endDate = startDate;
    onDateChange(task.id, startDate, endDate);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    if (isSelected) onSelect(task.id);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(order);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setOrder(next);
    onReorder(next.map((it) => it.id));
  };

  if (!tasks.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="등록된 테스크가 없습니다. '테스크 추가'로 일정을 등록하세요."
      />
    );
  }

  // 좌측 WBS 헤더 — 테스크 · 담당자 · 기간 · 상태.
  const ListHeader = ({ headerHeight }: { headerHeight: number }) => (
    <div
      className="flex items-center border-b border-yna-border text-xs font-semibold text-yna-sub"
      style={{ height: headerHeight, width: LIST_WIDTH, backgroundColor: HEADER_BG }}
    >
      <span style={{ width: COL.handle }} />
      <span className="flex-1 truncate px-2">테스크</span>
      <span className="truncate px-2" style={{ width: COL.manager }}>담당자</span>
      <span className="truncate px-2" style={{ width: COL.period }}>기간</span>
      <span className="truncate px-2" style={{ width: COL.status }}>상태</span>
    </div>
  );

  // 좌측 WBS 본문 — 드래그 정렬 가능한 테스크 행들.
  const ListTable = ({ rowHeight }: { rowHeight: number }) => (
    <div style={{ width: LIST_WIDTH }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wbs">
          {(dropProvided) => (
            <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
              {order.map((it, index) => (
                <Draggable key={it.id} draggableId={it.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`flex items-center border-b border-yna-border bg-white text-xs text-yna-main ${
                        snapshot.isDragging ? 'shadow-md' : ''
                      }`}
                      style={{ height: rowHeight, ...dragProvided.draggableProps.style }}
                    >
                      <span
                        {...dragProvided.dragHandleProps}
                        className="flex cursor-grab items-center justify-center text-yna-sub hover:text-yna-main"
                        style={{ width: COL.handle }}
                        aria-label="순서 변경"
                      >
                        <MdDragIndicator size={16} />
                      </span>
                      <button
                        type="button"
                        className="flex-1 truncate px-2 text-left hover:text-yna-point"
                        title={it.title}
                        onClick={() => onSelect(it.id)}
                      >
                        {it.title}
                      </button>
                      <span
                        className="truncate px-2 text-yna-sub"
                        style={{ width: COL.manager }}
                        title={it.managerNames.join(', ')}
                      >
                        {it.managerNames.length ? it.managerNames.join(', ') : '-'}
                      </span>
                      <span className="truncate px-2 text-yna-sub" style={{ width: COL.period }}>
                        {dayjs(it.startDate).format('MM.DD')}~{dayjs(it.endDate).format('MM.DD')}
                      </span>
                      <span
                        style={{ width: COL.status }}
                        className="px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          size="small"
                          variant="borderless"
                          className="w-full"
                          value={it.status}
                          options={EVENT_STATUS_OPTIONS}
                          onChange={(v: EventStatus) => onStatusChange(it.id, v)}
                          optionRender={(opt) => (
                            <StatusDotLabel
                              status={opt.value as EventStatus}
                              label={String(opt.label)}
                            />
                          )}
                          labelRender={(props) => (
                            <StatusDotLabel
                              status={props.value as EventStatus}
                              label={String(props.label)}
                            />
                          )}
                        />
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* 상태 범례 */}
        <div className="flex flex-wrap items-center gap-3">
          {EVENT_STATUS_OPTIONS.map((o) => (
            <span key={o.value} className="flex items-center gap-1.5 text-xs text-yna-sub">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: EVENT_STATUS_BAR_COLOR[o.value] }}
              />
              {o.label}
            </span>
          ))}
        </div>
        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={[
            { label: '월', value: ViewMode.Month },
            { label: '주', value: ViewMode.Week },
            { label: '일', value: ViewMode.Day },
          ]}
        />
      </div>

      <div className="yna-gantt overflow-x-auto rounded-lg border border-yna-border">
        <Gantt
          tasks={tasks}
          viewMode={viewMode}
          viewDate={today}
          locale="ko"
          listCellWidth={`${LIST_WIDTH}px`}
          rowHeight={44}
          headerHeight={44}
          columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 160 : 56}
          barCornerRadius={4}
          barFill={58}
          fontSize="12px"
          fontFamily="inherit"
          todayColor="rgba(22, 119, 255, 0.08)"
          onDateChange={handleDateChange}
          onSelect={handleSelect}
          onDoubleClick={(task) => onSelect(task.id)}
          TaskListHeader={ListHeader}
          TaskListTable={ListTable}
        />
      </div>
    </div>
  );
}

/** 상태 배지(목록·요약 표기용). 간트 외부에서 재사용. */
export function EventStatusTag({ status }: { status: EventStatus }) {
  return <Tag {...badgeTone(EVENT_STATUS_COLOR[status])}>{EVENT_STATUS_LABEL[status]}</Tag>;
}

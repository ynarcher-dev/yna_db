import { Tag } from 'antd';
import { HiOutlineCalendar } from 'react-icons/hi';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/formatters';
import { EVENT_TYPE_LABEL, badgeTone } from '@/lib/labels';
import type { UpcomingEvent } from '@/types/dashboard';

/**
 * 다가오는 주요 일정 타임라인 (4_dashboard.md 4.3.2).
 * system_events 기준 event_date 오름차순 5건을 요약 표시한다.
 */
export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) {
    return <EmptyState message="예정된 일정이 없습니다." />;
  }

  return (
    <ul className="divide-y divide-yna-border">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-4 py-3">
          <HiOutlineCalendar size={20} className="shrink-0 text-yna-sub" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-yna-main">{event.title}</p>
            <p className="text-xs text-gray-500">{formatDate(event.eventDate)}</p>
          </div>
          <Tag {...badgeTone('neutral')}>{EVENT_TYPE_LABEL[event.eventType]}</Tag>
        </li>
      ))}
    </ul>
  );
}

import type { EventType } from './database';

/** 프로그램 세부 일정 1건 (program_events, 7_programs.md). system_events 로 자동 동기화됨. */
export interface ProgramEvent {
  id: string;
  title: string;
  eventType: EventType;
  /** 일정 일자 (YYYY-MM-DD) */
  eventDate: string;
  description: string;
  createdAt: string;
}

export interface ProgramEventRow {
  id: string;
  program_id: string;
  title: string;
  event_type: EventType;
  event_date: string;
  description: string | null;
  created_at: string;
}

export function mapProgramEventRow(row: ProgramEventRow): ProgramEvent {
  return {
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    eventDate: row.event_date,
    description: row.description ?? '',
    createdAt: row.created_at,
  };
}

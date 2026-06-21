import type { EventStatus } from './database';

/**
 * 프로젝트 세부 일정(테스크) 1건 (project_events, 23_gantt_milestone.md).
 * 사업(business_events)과 동일한 간트차트 구조 — 시작·종료일, 담당자, 상태, 정렬, 선후관계.
 * 저장/삭제 시 start_date 기준으로 system_events(대시보드 다가오는 일정)에 자동 동기화된다.
 */
export interface ProjectEvent {
  id: string;
  projectId: string;
  title: string;
  /** 테스크 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 테스크 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 담당자(선수) 심사역 id 배열. 다중 지정 가능(없으면 빈 배열) */
  managerIds: string[];
  /** 진행 상태 (대기/진행중/완료/지연) */
  status: EventStatus;
  /** 간트 행 정렬 순서(드래그로 변경) */
  sortOrder: number;
  /** 선행 테스크 id 배열 (선후관계 자율 관리 메타) */
  dependencies: string[];
  /** 테스크 관련 링크(URL) 배열 */
  urls: string[];
  description: string;
  createdAt: string;
}

export interface ProjectEventRow {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  manager_id: string | null;
  manager_ids: string[] | null;
  status: EventStatus | null;
  sort_order: number | null;
  dependencies: string[] | null;
  urls: string[] | null;
  description: string | null;
  created_at: string;
}

export function mapProjectEventRow(row: ProjectEventRow): ProjectEvent {
  const managerIds = row.manager_ids?.length
    ? row.manager_ids
    : row.manager_id
      ? [row.manager_id]
      : [];
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    managerIds,
    status: row.status ?? 'pending',
    sortOrder: row.sort_order ?? 0,
    dependencies: row.dependencies ?? [],
    urls: row.urls ?? [],
    description: row.description ?? '',
    createdAt: row.created_at,
  };
}

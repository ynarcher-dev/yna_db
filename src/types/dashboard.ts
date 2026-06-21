import type { EventType } from './database';

/**
 * 대시보드 요약 타입 (4_dashboard.md 4.2 CeoDashboardSummary).
 * metrics 는 get_dashboard_summary RPC 의 JSONB 반환과 1:1 대응(키 camelCase).
 */
export interface DashboardMetrics {
  totalManagers: number;
  totalStartups: number;
  totalPortfolioValuation: number;
  activeBusinesses: number;
  totalAum: number;
  averageFundExhaustionRate: number;
  totalExperts: number;
  averageMentoringRating: number;
  /** 진행 중 M&A 프로젝트 수 (project_type='m_and_a') */
  activeMaProjects: number;
  /** 진행 중 신사업 프로젝트 수 (project_type='new_business') */
  activeNewBizProjects: number;
  reportSubmissionRate: number;
  totalDepartments: number;
  totalPartners: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
}

export interface CeoDashboardSummary {
  metrics: DashboardMetrics;
  upcomingEvents: UpcomingEvent[];
}

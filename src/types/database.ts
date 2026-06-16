/**
 * 공유 DB 타입 (0_db_schema.md 기준).
 * 0번 단계에서는 시스템 역할 및 핵심 상태 Enum 만 정의하고,
 * 도메인별 테이블 인터페이스는 각 기능 문서(4~12) 개발 시 확장한다.
 */

/** 시스템 역할 — 인사 직급(position)과 분리 (0_db_schema.md app_role) */
export type AppRole = 'admin' | 'manager';

/** 프로젝트 단계 (0_db_schema.md projects.stage) */
export type ProjectStage =
  | 'sourcing'
  | 'register'
  | 'review'
  | 'meeting'
  | 'proposal'
  | 'contract'
  | 'completed'
  | 'canceled';

/** 프로젝트 유형 */
export type ProjectType = 'm_and_a' | 'open_innovation';

/** 프로그램 참여 상태 (program_startups.status) */
export type ProgramStartupStatus =
  | 'applied'
  | 'screening'
  | 'selected'
  | 'completed'
  | 'dropped';

/** 공통 일정 유형 (program_events / system_events) */
export type EventType = 'recruitment' | 'demoday' | 'networking' | 'meeting' | 'ir' | 'event';

/** 전문가 유형 (experts.expert_type) */
export type ExpertType = 'mentor' | 'auditor' | 'advisor';

/** 협력사 유형 (partners.partner_type) */
export type PartnerType = 'government' | 'university' | 'vc' | 'corporation' | 'partner';

/** 스타트업 관리 현황 (startups.management_status). 'other' 는 자유 텍스트 동반 */
export type ManagementStatus = 'sourced' | 'incubated' | 'invested' | 'other';

/** 후속 보고 유형 (startup_followups.report_type) */
export type ReportType = 'regular_quarterly' | 'annual' | 'interim' | 'risk_report';

/**
 * 공유 DB 타입 (0_db_schema.md 기준).
 * 0번 단계에서는 시스템 역할 및 핵심 상태 Enum 만 정의하고,
 * 도메인별 테이블 인터페이스는 각 기능 문서(4~12) 개발 시 확장한다.
 */

/** 시스템 역할 — 인사 직급(position)과 분리 (0_db_schema.md app_role) */
export type AppRole = 'admin' | 'manager';

/**
 * 프로젝트 진행 상태 (projects.stage).
 * 발주자 요청(2026-06-17): 기존 딜 파이프라인(sourcing~contract) 폐기 →
 * 단순 상태(대기/진행중/완료/중단/취소)로 개편. 칸반 보드는 사용하지 않는다.
 */
export type ProjectStage = 'pending' | 'in_progress' | 'completed' | 'suspended' | 'canceled';

/** 프로젝트 유형 (projects.project_type). 'other'=기타(자유 텍스트 동반) */
export type ProjectType = 'm_and_a' | 'new_business' | 'other';

/** 프로젝트 우선순위 (projects.priority) */
export type ProjectPriority = 'high' | 'medium' | 'low';

/**
 * 사업 진행 상태 (businesses.status, 0059). 발주자 확정(2026-06-21):
 * 사업·M&A·신사업 목록을 동일 구조로 통일하기 위해 projects.stage 와 동일한 5단계를 쓴다.
 */
export type BusinessStatus = 'pending' | 'in_progress' | 'completed' | 'suspended' | 'canceled';

/** 사업 구분 (businesses.classification, 0061) — 공공/민간/매출. */
export type BusinessClassification = 'public' | 'private' | 'sales';

/** 사업 참여 상태 (business_startups.status) */
export type BusinessStartupStatus =
  | 'applied'
  | 'screening'
  | 'selected'
  | 'completed'
  | 'dropped';

/** 사업 운영 심사역 역할 (business_managers.role) */
export type BusinessManagerRole = 'lead' | 'operator';

/** 공통 일정 유형 (business_events / system_events) */
export type EventType = 'recruitment' | 'demoday' | 'networking' | 'meeting' | 'ir' | 'event';

/** 프로젝트 일정 유형 (project_events, 23_gantt_milestone.md) */
export type ProjectEventType = 'meeting' | 'contract' | 'report' | 'milestone' | 'other';

/** 일정(테스크) 진행 상태 (business_events·project_events.status, 23_gantt_milestone.md) */
export type EventStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

/** 전문가 유형 (experts.expert_type) */
export type ExpertType = 'mentor' | 'auditor' | 'advisor';

/** 협력사 유형 (partners.partner_type) */
export type PartnerType = 'government' | 'university' | 'vc' | 'corporation' | 'partner';

/** 스타트업 관리 현황 (startups.management_status). 'other' 는 자유 텍스트 동반 */
export type ManagementStatus = 'sourced' | 'incubated' | 'invested' | 'other';

/** 후속 보고 유형 (startup_followups.report_type) */
export type ReportType = 'quarterly' | 'semiannual' | 'annual' | 'interim' | 'risk_report';

/** 투자자 구분 (startup_metrics.investor_type) — 자사/외부 */
export type InvestorType = 'internal' | 'external';

/** 매칭 프로그램 상태 (matching_programs.status) — 모집중/진행중 · 마감 (21_matching_programs.md) */
export type MatchingProgramStatus = 'active' | 'closed';

/** 매칭 신청/연계 진행 상태 (matching_applications.status) (21_matching_programs.md) */
export type MatchingApplicationStatus = 'applied' | 'recommended' | 'selected' | 'rejected';

/** 투자 자료실 카테고리 (invest_archives.category) (22_invest_archives.md) */
export type ArchiveCategory = 'template' | 'report' | 'legal' | 'etc';

/** 업로드 파일 용도 (uploaded_files.purpose) (15_system_schema.md 4장) */
export type FilePurpose =
  | 'followup_report'
  | 'ai_source'
  | 'profile_image'
  | 'startup_logo'
  | 'partner_doc'
  /** 전 도메인 공통 '첨부파일' 카드 업로드 (entity_type/entity_id 로 레코드 연결) */
  | 'attachment';

/**
 * 다운로드 로그 원천 구분 (file_download_logs.source_type) (15_system_schema.md 5장).
 * 다운로드 가능한 카드 섹션이 늘어날 때마다 값을 추가한다.
 */
export type DownloadSourceType =
  | 'startup_followup'
  | 'partner_doc'
  | 'fund_doc'
  | 'project_doc'
  /** 전 도메인 공통 '첨부파일' 카드 (section_key 로 도메인 구분, source_id=레코드 id) */
  | 'attachment';

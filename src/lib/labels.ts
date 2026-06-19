import type { CSSProperties } from 'react';
import type {
  AppRole,
  EventType,
  ExpertType,
  InvestorType,
  ManagementStatus,
  PartnerType,
  ProgramManagerRole,
  ProgramStartupStatus,
  ProjectPriority,
  ProjectStage,
  ProjectType,
  ReportType,
} from '@/types/database';

/**
 * 뱃지 색 규칙 (17_conventions.md 8장 / 5_managers.md 5.3) — 전 도메인 공통 단일 소스.
 * 모든 상태/유형 배지는 antd 프리셋 색 대신 아래 5개 톤 중 하나로 분류하고 `badgeTone()` 으로 렌더한다.
 *
 *  - `red`     : 권한·역할(시스템 등급·운영총괄·작성자 등) **또는** '투자기업'
 *  - `blue`    : 종료된 경우(완료·수료·취소 등 끝난 상태)
 *  - `green`   : 진행중인 경우
 *  - `gold`    : 중간 상태(대기·심사중·탈락 등 진행도 종료도 아닌 상태)
 *  - `neutral` : 그 외 전부 — 흰 배경·회색 글자(유형/카테고리 배지 등)
 *
 * ※ 삭제(danger) 버튼은 이 규칙의 **예외**(빨강 유지). 색 분류만 바꾸려면 아래 `*_COLOR` 맵의 값 한 단어만 고친다.
 */
export type BadgeTone = 'red' | 'blue' | 'green' | 'gold' | 'neutral';

/** `neutral` 톤 커스텀 색 — 흰 배경(#ffffff) · 회색 글자(#8c8c8c) · 회색 테두리(#d9d9d9). antd 프리셋에 없는 조합. */
export const NEUTRAL_BADGE_STYLE: CSSProperties = {
  background: '#ffffff',
  borderColor: '#d9d9d9',
  color: '#8c8c8c',
};

/** BadgeTone → antd `<Tag>` props. neutral 은 style(흰/회), 나머지는 프리셋 color 로 렌더. */
export function badgeTone(tone: BadgeTone): { color?: string; style?: CSSProperties } {
  return tone === 'neutral' ? { style: NEUTRAL_BADGE_STYLE } : { color: tone };
}

/**
 * DB 영문 enum → 한국어 라벨 단일 매핑 (17_conventions.md 5장).
 * 화면 전체에서 일관 표기하기 위해 이곳에서만 정의한다.
 */
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  recruitment: '모집',
  demoday: '데모데이',
  networking: '네트워킹',
  meeting: '미팅',
  ir: 'IR',
  event: '행사',
};

export const EVENT_TYPE_VALUES = [
  'recruitment',
  'demoday',
  'networking',
  'meeting',
  'ir',
  'event',
] as const;

export const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((value) => ({
  value,
  label: EVENT_TYPE_LABEL[value],
}));

/** 일정 유형별 색상 (#HEX, FullCalendar 이벤트 색). 유형 배지 → 규칙상 neutral(회색)로 통일. */
export const EVENT_TYPE_COLOR: Record<EventType, string> = {
  recruitment: '#8c8c8c',
  demoday: '#8c8c8c',
  networking: '#8c8c8c',
  meeting: '#8c8c8c',
  ir: '#8c8c8c',
  event: '#8c8c8c',
};

export const PARTNER_TYPE_LABEL: Record<PartnerType, string> = {
  government: '정부·지자체',
  university: '대학·연구기관',
  vc: '벤처캐피탈',
  corporation: '대기업·중견기업',
  partner: '일반 협력사',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const PARTNER_TYPE_OPTIONS = (Object.keys(PARTNER_TYPE_LABEL) as PartnerType[]).map(
  (value) => ({ value, label: PARTNER_TYPE_LABEL[value] }),
);

/** 협력사 유형별 태그 톤 — 유형 배지라 전부 neutral. */
export const PARTNER_TYPE_COLOR: Record<PartnerType, BadgeTone> = {
  government: 'neutral',
  university: 'neutral',
  vc: 'neutral',
  corporation: 'neutral',
  partner: 'neutral',
};

/** 전문가 유형 한국어 라벨 (9_experts.md) */
export const EXPERT_TYPE_LABEL: Record<ExpertType, string> = {
  mentor: '멘토',
  auditor: '감사',
  advisor: '자문',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const EXPERT_TYPE_OPTIONS = (Object.keys(EXPERT_TYPE_LABEL) as ExpertType[]).map((value) => ({
  value,
  label: EXPERT_TYPE_LABEL[value],
}));

/** 전문가 유형별 태그 톤 — 유형 배지라 전부 neutral. */
export const EXPERT_TYPE_COLOR: Record<ExpertType, BadgeTone> = {
  mentor: 'neutral',
  auditor: 'neutral',
  advisor: 'neutral',
};

/**
 * 투자 유치 단계 (startups.investment_stage). DB 는 varchar 이지만 화면 입력은
 * 아래 고정 값으로 제한한다(6_startups.md 예시: Seed, Pre-A, Series-A 등).
 * value 와 표시 라벨을 동일 문자열로 저장해 목록·필터·상세 표기를 단순화한다.
 */
export const INVESTMENT_STAGE_VALUES = [
  'Seed',
  'Pre-A',
  'Series A',
  'Series B',
  'Series C',
  'Series D 이상',
  'IPO/Exit',
] as const;

export type InvestmentStage = (typeof INVESTMENT_STAGE_VALUES)[number];

/** antd Select 옵션 (값=라벨) */
export const INVESTMENT_STAGE_OPTIONS = INVESTMENT_STAGE_VALUES.map((value) => ({
  value,
  label: value,
}));

/** 투자 단계별 태그 톤 — 유형(단계) 배지라 전부 neutral. */
export const INVESTMENT_STAGE_COLOR: Record<InvestmentStage, BadgeTone> = {
  Seed: 'neutral',
  'Pre-A': 'neutral',
  'Series A': 'neutral',
  'Series B': 'neutral',
  'Series C': 'neutral',
  'Series D 이상': 'neutral',
  'IPO/Exit': 'neutral',
};

/** 관리 현황 허용값 (zod enum / Select 옵션 단일 소스) */
export const MANAGEMENT_STATUS_VALUES = [
  'sourced',
  'incubated',
  'invested',
  'other',
] as const;

/** 관리 현황 한국어 라벨 (startups.management_status). 'other'=기타(자유 텍스트) */
export const MANAGEMENT_STATUS_LABEL: Record<ManagementStatus, string> = {
  sourced: '발굴기업',
  incubated: '보육기업',
  invested: '투자기업',
  other: '기타',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const MANAGEMENT_STATUS_OPTIONS = (
  Object.keys(MANAGEMENT_STATUS_LABEL) as ManagementStatus[]
).map((value) => ({ value, label: MANAGEMENT_STATUS_LABEL[value] }));

/** 관리 현황별 태그 톤 — '투자기업'=red, 보육중=green(진행), 발굴·기타=neutral. */
export const MANAGEMENT_STATUS_COLOR: Record<ManagementStatus, BadgeTone> = {
  sourced: 'neutral',
  incubated: 'green',
  invested: 'red',
  other: 'neutral',
};

/** 후속 보고 유형 허용값 (zod enum / Select 옵션 단일 소스) */
export const REPORT_TYPE_VALUES = [
  'quarterly',
  'semiannual',
  'annual',
  'interim',
  'risk_report',
] as const;

/** 후속 보고 유형 한국어 라벨 (startup_followups.report_type) */
export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  quarterly: '분기 보고',
  semiannual: '반기 보고',
  annual: '연간 보고',
  interim: '수시 보고',
  risk_report: '리스크 보고',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const REPORT_TYPE_OPTIONS = (Object.keys(REPORT_TYPE_LABEL) as ReportType[]).map((value) => ({
  value,
  label: REPORT_TYPE_LABEL[value],
}));

/** 후속 보고 유형별 태그 톤 — 유형 배지라 전부 neutral. */
export const REPORT_TYPE_COLOR: Record<ReportType, BadgeTone> = {
  quarterly: 'neutral',
  semiannual: 'neutral',
  annual: 'neutral',
  interim: 'neutral',
  risk_report: 'neutral',
};

/** 투자자 구분 허용값 / 라벨 (startup_metrics.investor_type) */
export const INVESTOR_TYPE_VALUES = ['internal', 'external'] as const;

export const INVESTOR_TYPE_LABEL: Record<InvestorType, string> = {
  internal: '자사',
  external: '외부',
};

export const INVESTOR_TYPE_OPTIONS = (Object.keys(INVESTOR_TYPE_LABEL) as InvestorType[]).map(
  (value) => ({ value, label: INVESTOR_TYPE_LABEL[value] }),
);

/** 투자자 구분 톤 — 유형(자사/외부) 배지라 전부 neutral. */
export const INVESTOR_TYPE_COLOR: Record<InvestorType, BadgeTone> = {
  internal: 'neutral',
  external: 'neutral',
};

/**
 * 파일 다운로드 목적 (file_download_logs.download_purpose) (17_conventions.md 4장).
 * 사용자는 아래 선택지 중 하나를 고르거나 '기타'에서 자유 사유를 입력한다.
 * value 가 곧 저장되는 목적 원문이며, '기타'는 자유 입력으로 대체된다.
 */
export const DOWNLOAD_PURPOSE_VALUES = [
  '투자 검토',
  '보고서 제출 확인',
  'LP/협력사 공유 준비',
  '내부 백업',
  '기타',
] as const;

export type DownloadPurpose = (typeof DOWNLOAD_PURPOSE_VALUES)[number];

/** 자유 입력으로 대체되는 목적 값 */
export const DOWNLOAD_PURPOSE_OTHER: DownloadPurpose = '기타';

/** antd Select/Radio 옵션 (값=라벨) */
export const DOWNLOAD_PURPOSE_OPTIONS = DOWNLOAD_PURPOSE_VALUES.map((value) => ({
  value,
  label: value,
}));

/**
 * 프로젝트 유형 한국어 라벨 (projects.project_type, 10_projects.md).
 * 발주자 요청(2026-06-17): M&A · 신사업 · 기타. 'other'(기타)는 자유 텍스트(project_type_etc)를
 * 동반하며, 유형 배지 자리에 그 텍스트를 표시한다(스타트업 관리현황 '기타' 패턴).
 */
export const PROJECT_TYPE_VALUES = ['m_and_a', 'new_business', 'other'] as const;

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  m_and_a: 'M&A',
  new_business: '신사업',
  other: '기타',
};

export const PROJECT_TYPE_OPTIONS = (Object.keys(PROJECT_TYPE_LABEL) as ProjectType[]).map(
  (value) => ({ value, label: PROJECT_TYPE_LABEL[value] }),
);

/** 프로젝트 유형 톤 — 유형 배지라 전부 neutral. */
export const PROJECT_TYPE_COLOR: Record<ProjectType, BadgeTone> = {
  m_and_a: 'neutral',
  new_business: 'neutral',
  other: 'neutral',
};

/**
 * 프로젝트 진행 상태 (projects.stage). 단순 상태값(파이프라인/칸반 아님).
 * DB 컬럼명은 stage 를 유지하되 화면 표기는 '진행 상태'로 다룬다.
 */
export const PROJECT_STAGE_VALUES = [
  'pending',
  'in_progress',
  'completed',
  'suspended',
  'canceled',
] as const;

export const PROJECT_STAGE_LABEL: Record<ProjectStage, string> = {
  pending: '대기',
  in_progress: '진행중',
  completed: '완료',
  suspended: '중단',
  canceled: '취소',
};

export const PROJECT_STAGE_OPTIONS = (Object.keys(PROJECT_STAGE_LABEL) as ProjectStage[]).map(
  (value) => ({ value, label: PROJECT_STAGE_LABEL[value] }),
);

/** 진행 상태별 태그 톤 — 진행중=green, 완료·취소(종료)=blue, 대기·중단(중간)=gold. */
export const PROJECT_STAGE_COLOR: Record<ProjectStage, BadgeTone> = {
  pending: 'gold',
  in_progress: 'green',
  completed: 'blue',
  suspended: 'gold',
  canceled: 'blue',
};

/** 프로젝트 우선순위 (projects.priority) */
export const PROJECT_PRIORITY_VALUES = ['high', 'medium', 'low'] as const;

export const PROJECT_PRIORITY_LABEL: Record<ProjectPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const PROJECT_PRIORITY_OPTIONS = (
  Object.keys(PROJECT_PRIORITY_LABEL) as ProjectPriority[]
).map((value) => ({ value, label: PROJECT_PRIORITY_LABEL[value] }));

/** 우선순위 톤 — 권한/진행/종료 의미가 아니라 중요도 → 전부 neutral. */
export const PROJECT_PRIORITY_COLOR: Record<ProjectPriority, BadgeTone> = {
  high: 'neutral',
  medium: 'neutral',
  low: 'neutral',
};

/** 프로그램 운영 심사역 역할 (program_managers.role) */
export const PROGRAM_MANAGER_ROLE_VALUES = ['lead', 'operator'] as const;

export const PROGRAM_MANAGER_ROLE_LABEL: Record<ProgramManagerRole, string> = {
  lead: '운영총괄',
  operator: '운영담당',
};

export const PROGRAM_MANAGER_ROLE_OPTIONS = (
  Object.keys(PROGRAM_MANAGER_ROLE_LABEL) as ProgramManagerRole[]
).map((value) => ({ value, label: PROGRAM_MANAGER_ROLE_LABEL[value] }));

/** 운영 역할 톤 — 운영총괄=red(역할성 권한), 운영담당=neutral. */
export const PROGRAM_MANAGER_ROLE_COLOR: Record<ProgramManagerRole, BadgeTone> = {
  lead: 'red',
  operator: 'neutral',
};

/** 프로그램 참여 스타트업 상태 (program_startups.status) */
export const PROGRAM_STARTUP_STATUS_VALUES = [
  'applied',
  'screening',
  'selected',
  'completed',
  'dropped',
] as const;

export const PROGRAM_STARTUP_STATUS_LABEL: Record<ProgramStartupStatus, string> = {
  applied: '지원',
  screening: '심사중',
  selected: '선정',
  completed: '수료',
  dropped: '중도탈락',
};

export const PROGRAM_STARTUP_STATUS_OPTIONS = (
  Object.keys(PROGRAM_STARTUP_STATUS_LABEL) as ProgramStartupStatus[]
).map((value) => ({ value, label: PROGRAM_STARTUP_STATUS_LABEL[value] }));

/** 참여 상태 톤 — 선정=green(진행), 수료=blue(종료), 지원·심사중·중도탈락=gold(중간). */
export const PROGRAM_STARTUP_STATUS_COLOR: Record<ProgramStartupStatus, BadgeTone> = {
  applied: 'gold',
  screening: 'gold',
  selected: 'green',
  completed: 'blue',
  dropped: 'gold',
};

/**
 * 소속 회사 (departments.company, 그룹이 속한 회사). 발주자 확정(2026-06-17):
 * 와이앤아처 / 와이앤아처벤처스 / 와이앤아처인베스트먼트 3종 고정.
 * DB 는 varchar(CHECK 제약)이며 화면 입력은 아래 값으로 제한한다(값=라벨).
 */
export const COMPANY_VALUES = [
  '와이앤아처',
  '와이앤아처벤처스',
  '와이앤아처인베스트먼트',
] as const;

export type Company = (typeof COMPANY_VALUES)[number];

/** antd Select 옵션 (값=라벨) */
export const COMPANY_OPTIONS = COMPANY_VALUES.map((value) => ({ value, label: value }));

/** 시스템 역할(=등급) 한국어 라벨 (5_managers.md role). manager 는 화면 표기상 '일반'. */
export const APP_ROLE_LABEL: Record<AppRole, string> = {
  admin: '관리자',
  manager: '일반',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const APP_ROLE_OPTIONS = (Object.keys(APP_ROLE_LABEL) as AppRole[]).map((value) => ({
  value,
  label: APP_ROLE_LABEL[value],
}));

/** 시스템 등급 톤 — 관리자=red(권한), 일반=neutral(흰/회). */
export const APP_ROLE_COLOR: Record<AppRole, BadgeTone> = {
  admin: 'red',
  manager: 'neutral',
};

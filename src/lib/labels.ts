import type {
  AppRole,
  EventType,
  ExpertType,
  ManagementStatus,
  PartnerType,
  ReportType,
} from '@/types/database';

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

/** 협력사 유형별 태그 색상 (antd Tag color) */
export const PARTNER_TYPE_COLOR: Record<PartnerType, string> = {
  government: 'blue',
  university: 'purple',
  vc: 'gold',
  corporation: 'geekblue',
  partner: 'default',
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

/** 전문가 유형별 태그 색상 (antd Tag color) */
export const EXPERT_TYPE_COLOR: Record<ExpertType, string> = {
  mentor: 'green',
  auditor: 'gold',
  advisor: 'blue',
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

/** 투자 단계별 태그 색상 (antd Tag color). 단계가 오를수록 진한 색. */
export const INVESTMENT_STAGE_COLOR: Record<InvestmentStage, string> = {
  Seed: 'default',
  'Pre-A': 'cyan',
  'Series A': 'blue',
  'Series B': 'geekblue',
  'Series C': 'purple',
  'Series D 이상': 'magenta',
  'IPO/Exit': 'gold',
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

/** 관리 현황별 태그 색상 (antd Tag color) */
export const MANAGEMENT_STATUS_COLOR: Record<ManagementStatus, string> = {
  sourced: 'blue',
  incubated: 'green',
  invested: 'gold',
  other: 'default',
};

/** 후속 보고 유형 허용값 (zod enum / Select 옵션 단일 소스) */
export const REPORT_TYPE_VALUES = [
  'regular_quarterly',
  'annual',
  'interim',
  'risk_report',
] as const;

/** 후속 보고 유형 한국어 라벨 (startup_followups.report_type) */
export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  regular_quarterly: '분기 정기보고',
  annual: '연간 보고',
  interim: '수시 보고',
  risk_report: '리스크 보고',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const REPORT_TYPE_OPTIONS = (Object.keys(REPORT_TYPE_LABEL) as ReportType[]).map((value) => ({
  value,
  label: REPORT_TYPE_LABEL[value],
}));

/** 후속 보고 유형별 태그 색상 (antd Tag color) */
export const REPORT_TYPE_COLOR: Record<ReportType, string> = {
  regular_quarterly: 'blue',
  annual: 'geekblue',
  interim: 'default',
  risk_report: 'red',
};

/** 시스템 역할 한국어 라벨 (5_managers.md role) */
export const APP_ROLE_LABEL: Record<AppRole, string> = {
  admin: '관리자',
  manager: '심사역',
};

/** antd Select 옵션 (라벨 매핑 단일 소스에서 파생) */
export const APP_ROLE_OPTIONS = (Object.keys(APP_ROLE_LABEL) as AppRole[]).map((value) => ({
  value,
  label: APP_ROLE_LABEL[value],
}));

/** 시스템 역할별 태그 색상 (antd Tag color) */
export const APP_ROLE_COLOR: Record<AppRole, string> = {
  admin: 'red',
  manager: 'blue',
};

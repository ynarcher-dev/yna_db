import type { ManagementStatus } from './database';
import { normalizeSections, type StartupSections } from '@/lib/startupSections';

/** 시계열 메모/회의록 1건 (startups.memos 항목). */
export interface StartupMemo {
  /** 일자 (YYYY-MM-DD) */
  date: string;
  /** 내용 (회의록·메모) */
  content: string;
}

/** 핵심 팀원 1명 (team_profile.members 항목). */
export interface TeamMember {
  name: string;
  /** 직책 (예: CTO) */
  role: string;
  /** 핵심 경력 */
  background: string;
}

/** 비즈니스 설명 (startups.business_profile JSONB). */
export interface BusinessProfile {
  /** 한 줄 소개 / 핵심 아이템 */
  oneLiner: string;
  /** 비즈니스 모델 (수익 구조) */
  businessModel: string;
  /** 타겟 시장 & 고객 */
  targetMarket: string;
  /** 경쟁 우위 / 차별점 */
  competitiveEdge: string;
}

/** 팀 역량 설명 (startups.team_profile JSONB). */
export interface TeamProfile {
  /** 대표/창업자 역량 */
  founderStrength: string;
  /** 핵심 팀원 */
  members: TeamMember[];
  /** 핵심 역량 키워드 태그 */
  capabilities: string[];
}

export const EMPTY_BUSINESS: BusinessProfile = {
  oneLiner: '',
  businessModel: '',
  targetMarket: '',
  competitiveEdge: '',
};

export const EMPTY_TEAM: TeamProfile = {
  founderStrength: '',
  members: [],
  capabilities: [],
};

/** 부분/누락 가능한 raw jsonb → 안전한 BusinessProfile. */
export function normalizeBusiness(raw: Partial<BusinessProfile> | null | undefined): BusinessProfile {
  return {
    oneLiner: raw?.oneLiner ?? '',
    businessModel: raw?.businessModel ?? '',
    targetMarket: raw?.targetMarket ?? '',
    competitiveEdge: raw?.competitiveEdge ?? '',
  };
}

/** 부분/누락 가능한 raw jsonb → 안전한 TeamProfile. */
export function normalizeTeam(raw: Partial<TeamProfile> | null | undefined): TeamProfile {
  return {
    founderStrength: raw?.founderStrength ?? '',
    members: Array.isArray(raw?.members)
      ? raw!.members.map((m) => ({
          name: m?.name ?? '',
          role: m?.role ?? '',
          background: m?.background ?? '',
        }))
      : [],
    capabilities: Array.isArray(raw?.capabilities) ? raw!.capabilities.filter(Boolean) : [],
  };
}

/** 주주 구성 항목 (startups.shareholders JSONB, 6_startups.md). */
export interface Shareholder {
  name: string;
  /** 보유 주식 수 */
  shares: number;
  /** 지분율 (%) */
  percentage: number;
}

/** 스타트업 (camelCase 화면 모델, 6_startups.md Startup) */
export interface Startup {
  id: string;
  name: string;
  /** 대표자명 */
  ceoName: string;
  /** 로고 이미지 URL. 없으면 빈 문자열 */
  logoUrl: string;
  /** 브랜드 테마 컬러 (#HEX). 기본 #515151 */
  brandColor: string;
  /** 기업 설명 및 비즈니스 모델 */
  description: string;
  /** 투자 유치 단계 (Seed, Pre-A, Series A 등) */
  investmentStage: string;
  /** 관리 현황 (발굴/보육/투자/기타) */
  managementStatus: ManagementStatus;
  /** 관리 현황이 '기타'일 때의 자유 텍스트. 그 외엔 빈 문자열 */
  managementStatusEtc: string;
  /** 주주 구성 및 지분비율 */
  shareholders: Shareholder[];
  /** 비즈니스 설명 */
  businessProfile: BusinessProfile;
  /** 팀 역량 설명 */
  teamProfile: TeamProfile;
  /** 비즈니스·팀 역량 최종 수정 시각. 없으면 빈 문자열 */
  businessProfileUpdatedAt: string;
  /** 주주 구성 최종 수정 시각. 없으면 빈 문자열 */
  shareholdersUpdatedAt: string;
  /** 시계열 메모/회의록 */
  memos: StartupMemo[];
  /** 메모 최종 수정 시각. 없으면 빈 문자열 */
  memosUpdatedAt: string;
  /** 비즈니스 현황 시계열 텍스트 (성장 지표 영역) */
  businessStatus: StartupMemo[];
  /** 기업진단 내용 (임시 수동 입력). 없으면 빈 문자열 → 화면은 '준비중' */
  diagnosis: string;
  /** 기업진단 최종 수정 시각. 없으면 빈 문자열 */
  diagnosisUpdatedAt: string;
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: StartupSections;
  /** 담당 심사역(다대다 startup_managers) 이름 목록. 목록 표시용 */
  managerNames: string[];
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/** DB row (snake_case). startup_managers=담당 심사역(다대다), author=책임자(created_by) 임베드 결과 */
export interface StartupRow {
  id: string;
  name: string;
  ceo_name: string;
  logo_url: string | null;
  brand_color: string | null;
  description: string | null;
  investment_stage: string;
  management_status: ManagementStatus;
  management_status_etc: string | null;
  shareholders: Shareholder[] | null;
  business_profile: Partial<BusinessProfile> | null;
  team_profile: Partial<TeamProfile> | null;
  business_profile_updated_at: string | null;
  shareholders_updated_at: string | null;
  memos: StartupMemo[] | null;
  memos_updated_at: string | null;
  business_status: StartupMemo[] | null;
  diagnosis: string | null;
  diagnosis_updated_at: string | null;
  sections: Partial<Record<string, boolean>> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  /** 담당 심사역(다대다) 임베드 결과. 목록/상세 조회 시 함께 로드 */
  startup_managers: { manager: { name: string } | null }[] | null;
  author: { name: string } | null;
}

export function mapStartupRow(row: StartupRow): Startup {
  return {
    id: row.id,
    name: row.name,
    ceoName: row.ceo_name,
    logoUrl: row.logo_url ?? '',
    brandColor: row.brand_color ?? '#515151',
    description: row.description ?? '',
    investmentStage: row.investment_stage,
    managementStatus: row.management_status,
    managementStatusEtc: row.management_status_etc ?? '',
    shareholders: row.shareholders ?? [],
    businessProfile: normalizeBusiness(row.business_profile),
    teamProfile: normalizeTeam(row.team_profile),
    businessProfileUpdatedAt: row.business_profile_updated_at ?? '',
    shareholdersUpdatedAt: row.shareholders_updated_at ?? '',
    memos: row.memos ?? [],
    memosUpdatedAt: row.memos_updated_at ?? '',
    businessStatus: row.business_status ?? [],
    diagnosis: row.diagnosis ?? '',
    diagnosisUpdatedAt: row.diagnosis_updated_at ?? '',
    sections: normalizeSections(row.sections),
    managerNames: (row.startup_managers ?? [])
      .map((sm) => sm.manager?.name ?? '')
      .filter(Boolean),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

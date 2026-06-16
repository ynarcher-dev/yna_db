import type { ManagementStatus } from './database';

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
  /** 담당 심사역 id. 없으면 빈 문자열 */
  managerId: string;
  /** 담당 심사역 이름 (managers 임베드). 없으면 빈 문자열 */
  managerName: string;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/** DB row (snake_case). manager=담당 심사역, author=작성자(created_by) 임베드 결과 */
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
  manager_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  manager: { name: string } | null;
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
    managerId: row.manager_id ?? '',
    managerName: row.manager?.name ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

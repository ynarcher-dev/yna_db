import { normalizeBusinessSections, type BusinessSections } from '@/lib/businessSections';
import type { BusinessStatus } from '@/types/database';

/** 사업 (camelCase 화면 모델, 7_businesses.md). 기수별 AC 배치/정부지원사업. */
export interface Business {
  id: string;
  name: string;
  /** 기수 (1, 2, 3 …) */
  generation: number;
  /** 진행 상태 (0056, projects.stage 와 동일한 5단계) */
  status: BusinessStatus;
  /** 운영 예산 (원) */
  budget: number;
  /** 매출 (원, 0 이상) */
  revenue: number;
  /** 이익 (원, 실제 회사 유입액. 손실이면 음수) */
  profit: number;
  /** 사업 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 사업 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 참가 스타트업 모집 마감일 (YYYY-MM-DD). 없으면 빈 문자열 */
  recruitmentDeadline: string;
  /** 사업 상세 설명 */
  description: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 책임자(created_by, 등록자) id. 삭제 권한 게이트(책임자+관리자)에 사용. 없으면 빈 문자열 */
  createdById: string;
  /** 책임자 이름. 없으면 빈 문자열 */
  authorName: string;
  /** 운영 심사역(다대다 business_managers) 이름 목록. 목록 표시용 */
  managerNames: string[];
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: BusinessSections;
}

export interface BusinessRow {
  id: string;
  name: string;
  generation: number;
  status: BusinessStatus;
  budget: number | string;
  revenue: number | string;
  profit: number | string;
  start_date: string;
  end_date: string;
  recruitment_deadline: string | null;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  sections: Partial<Record<string, boolean>> | null;
  author: { name: string } | null;
  business_managers: { manager: { name: string } | null }[] | null;
}

export function mapBusinessRow(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    generation: row.generation,
    status: row.status,
    budget: Number(row.budget) || 0,
    revenue: Number(row.revenue) || 0,
    profit: Number(row.profit) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    recruitmentDeadline: row.recruitment_deadline ?? '',
    description: row.description ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.created_by ?? '',
    authorName: row.author?.name ?? '',
    managerNames: (row.business_managers ?? [])
      .map((pm) => pm.manager?.name ?? '')
      .filter(Boolean),
    sections: normalizeBusinessSections(row.sections),
  };
}

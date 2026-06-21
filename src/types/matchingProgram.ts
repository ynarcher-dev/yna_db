import {
  normalizeMatchingProgramSections,
  type MatchingProgramSections,
} from '@/lib/matchingProgramSections';
import type { MatchingProgramStatus } from '@/types/database';

/**
 * 매칭 프로그램 (camelCase 화면 모델, 21_matching_programs.md).
 * TIPS·LIPS 등 정부/기관 주관 지원사업 매칭 프로그램의 운영 현황.
 */
export interface MatchingProgram {
  id: string;
  name: string;
  /** 주관/지원 기관 (예: 중소벤처기업부) */
  agency: string;
  /** 시행 연도 */
  year: number;
  /** 지원 한도/매칭 예산 규모 (원) */
  budget: number;
  status: MatchingProgramStatus;
  /** 상세 요건 및 소개 */
  description: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 책임자(created_by, 등록자) 이름. 없으면 빈 문자열 */
  authorName: string;
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: MatchingProgramSections;
}

export interface MatchingProgramRow {
  id: string;
  name: string;
  agency: string | null;
  year: number;
  budget: number | string;
  status: MatchingProgramStatus;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  sections: Partial<Record<string, boolean>> | null;
  author: { name: string } | null;
}

export function mapMatchingProgramRow(row: MatchingProgramRow): MatchingProgram {
  return {
    id: row.id,
    name: row.name,
    agency: row.agency ?? '',
    year: row.year,
    budget: Number(row.budget) || 0,
    status: row.status,
    description: row.description ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
    sections: normalizeMatchingProgramSections(row.sections),
  };
}

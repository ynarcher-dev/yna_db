import { normalizeProgramSections, type ProgramSections } from '@/lib/programSections';

/** 프로그램 (camelCase 화면 모델, 7_programs.md). 기수별 AC 배치/정부지원사업. */
export interface Program {
  id: string;
  name: string;
  /** 기수 (1, 2, 3 …) */
  generation: number;
  /** 운영 예산 (원) */
  budget: number;
  /** 프로그램 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 프로그램 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 참가 스타트업 모집 마감일 (YYYY-MM-DD). 없으면 빈 문자열 */
  recruitmentDeadline: string;
  /** 프로그램 상세 설명 */
  description: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 책임자(created_by, 등록자) id. 삭제 권한 게이트(책임자+관리자)에 사용. 없으면 빈 문자열 */
  createdById: string;
  /** 책임자 이름. 없으면 빈 문자열 */
  authorName: string;
  /** 운영 심사역(다대다 program_managers) 이름 목록. 목록 표시용 */
  managerNames: string[];
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: ProgramSections;
}

export interface ProgramRow {
  id: string;
  name: string;
  generation: number;
  budget: number | string;
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
  program_managers: { manager: { name: string } | null }[] | null;
}

export function mapProgramRow(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    generation: row.generation,
    budget: Number(row.budget) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    recruitmentDeadline: row.recruitment_deadline ?? '',
    description: row.description ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.created_by ?? '',
    authorName: row.author?.name ?? '',
    managerNames: (row.program_managers ?? [])
      .map((pm) => pm.manager?.name ?? '')
      .filter(Boolean),
    sections: normalizeProgramSections(row.sections),
  };
}

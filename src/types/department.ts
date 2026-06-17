import { normalizeDepartmentSections, type DepartmentSections } from '@/lib/departmentSections';

/** 소속 본부/부서 (camelCase 화면 모델, 11_departments.md Department) */
export interface Department {
  id: string;
  name: string;
  /** 설립일 (YYYY-MM-DD). 없으면 빈 문자열 */
  establishedAt: string;
  /** 본부 역할·업무 설명. 없으면 빈 문자열 */
  description: string;
  /** 상세 카드 섹션 표시/숨김 맵. 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: DepartmentSections;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/**
 * DB row (snake_case). author 는 created_by FK 임베드 결과.
 * leader_id(본부장)·부서원·투자성과 연계는 Phase 4(심사역/스타트업 도메인)에서 다룬다.
 */
export interface DepartmentRow {
  id: string;
  name: string;
  established_at: string | null;
  description: string | null;
  sections: Partial<Record<string, boolean>> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author: { name: string } | null;
}

export function mapDepartmentRow(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    establishedAt: row.established_at ?? '',
    description: row.description ?? '',
    sections: normalizeDepartmentSections(row.sections),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

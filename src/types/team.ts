import type { Company } from '@/lib/labels';

/**
 * 팀 (camelCase 화면 모델). 소속 관리의 **단위** — 팀 한 건이 곧 하나의 '부서'로 동작한다.
 * 그룹(departments)에 속하고, 그룹은 회사(company)에 속한다. 운영 기간(시작~종료, 종료 비면 '운영중').
 * 심사역(소속 멤버)은 team_id 로 이 팀에 배정된다.
 */
export interface Team {
  id: string;
  /** 소속 그룹 id (departments.id) */
  departmentId: string;
  /** 소속 그룹명 (departments 임베드) */
  groupName: string;
  /** 소속 회사 (그룹의 회사) */
  company: Company;
  /** 팀명 (예: 1팀, 2팀, 3팀). 없으면 빈 문자열(회사+그룹 단위 소속) */
  name: string;
  /** 운영 시작일 (YYYY-MM-DD). 없으면 빈 문자열 */
  operatingStart: string;
  /** 운영 종료일 (YYYY-MM-DD). 없으면 빈 문자열(=운영중) */
  operatingEnd: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/** DB row (snake_case). department/author 는 FK 임베드 결과. */
export interface TeamRow {
  id: string;
  department_id: string;
  name: string | null;
  operating_start: string | null;
  operating_end: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  department: { name: string; company: string } | null;
  author: { name: string } | null;
}

export function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    departmentId: row.department_id,
    groupName: row.department?.name ?? '',
    company: (row.department?.company as Company) ?? '와이앤아처',
    name: row.name ?? '',
    operatingStart: row.operating_start ?? '',
    operatingEnd: row.operating_end ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

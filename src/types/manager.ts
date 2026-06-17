import type { AppRole } from './database';
import { normalizeBiography, type Biography } from './biography';
import { normalizeManagerSections, type ManagerSections } from '@/lib/managerSections';

/** 심사역 (camelCase 화면 모델, 5_managers.md Manager) */
export interface Manager {
  id: string;
  name: string;
  /** 직급 (예: 대표, 파트너, 수석심사역) */
  position: string;
  /** 시스템 권한 역할 */
  role: AppRole;
  /** 프로필 이미지 URL. 없으면 빈 문자열 */
  profileImageUrl: string;
  /** 소개 (홈페이지 노출용). 없으면 빈 문자열 */
  greeting: string;
  specialties: string[];
  biography: Biography;
  phone: string;
  email: string;
  /** 소속 팀 id. 없으면 빈 문자열 */
  teamId: string;
  /** 소속 팀명 (teams 임베드). 없으면 빈 문자열 */
  teamName: string;
  /** 소속 그룹 id (departments.id = 팀의 상위 그룹). 없으면 빈 문자열 */
  departmentId: string;
  /** 소속 그룹명 (departments 임베드). 없으면 빈 문자열 */
  departmentName: string;
  /** 소속 회사명 (그룹의 회사). 없으면 빈 문자열 */
  companyName: string;
  /** 상세 카드 섹션 표시/숨김 맵(Admin 전용 설정). 비활성 섹션은 상세 화면에서 숨긴다 */
  sections: ManagerSections;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(계정 발급자) 이름. 현재는 미임베드 → 빈 문자열('관리자' 표시) */
  authorName: string;
}

/** DB row (snake_case). department 는 department_id FK 임베드 결과 */
export interface ManagerRow {
  id: string;
  name: string;
  position: string;
  role: AppRole;
  profile_image_url: string | null;
  greeting: string | null;
  specialties: string[] | null;
  biography: Biography | null;
  phone: string | null;
  email: string;
  team_id: string | null;
  department_id: string | null;
  sections: Partial<Record<string, boolean>> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  /** 소속 그룹(부서) 임베드 — 그룹명·회사 */
  department: { name: string; company: string } | null;
  /** 소속 팀 임베드 — 팀명 */
  team: { name: string } | null;
}

export function mapManagerRow(row: ManagerRow): Manager {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    role: row.role,
    profileImageUrl: row.profile_image_url ?? '',
    greeting: row.greeting ?? '',
    specialties: row.specialties ?? [],
    biography: normalizeBiography(row.biography),
    phone: row.phone ?? '',
    email: row.email,
    teamId: row.team_id ?? '',
    teamName: row.team?.name ?? '',
    departmentId: row.department_id ?? '',
    departmentName: row.department?.name ?? '',
    companyName: row.department?.company ?? '',
    sections: normalizeManagerSections(row.sections),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: '',
  };
}

import type { AppRole } from './database';
import { normalizeBiography, type Biography } from './biography';

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
  /** 소속 본부 id. 없으면 빈 문자열 */
  departmentId: string;
  /** 소속 본부명 (departments 임베드). 없으면 빈 문자열 */
  departmentName: string;
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
  department_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  department: { name: string } | null;
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
    departmentId: row.department_id ?? '',
    departmentName: row.department?.name ?? '',
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: '',
  };
}

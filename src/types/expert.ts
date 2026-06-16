import type { ExpertType } from './database';
import { normalizeBiography, type Biography } from './biography';

/** 외부 전문가 (camelCase 화면 모델, 9_experts.md Expert) */
export interface Expert {
  id: string;
  name: string;
  /** 소속 회사/기관 */
  company: string;
  /** 직책 */
  position: string;
  phone: string;
  email: string;
  expertType: ExpertType;
  /** 관심 분야 키워드 태그 (예: AI, 특허, 법률) */
  specialties: string[];
  /** 매칭 가능 여부 */
  isAvailable: boolean;
  /** 프로필 이미지 URL. 없으면 빈 문자열 */
  profileImageUrl: string;
  /** 소개 (홈페이지 노출용). 없으면 빈 문자열 */
  greeting: string;
  /** 약력 (학력/경력/자격증) */
  biography: Biography;
  deletedAt?: string;
  createdAt: string;
  /** 최종반영일 (마지막 수정 시각) */
  updatedAt: string;
  /** 작성자(심사역) 이름. 없으면 빈 문자열 */
  authorName: string;
}

/** DB row (snake_case). author 는 created_by FK 임베드 결과 */
export interface ExpertRow {
  id: string;
  name: string;
  company: string;
  position: string;
  phone: string | null;
  email: string;
  expert_type: ExpertType;
  specialties: string[] | null;
  is_available: boolean;
  profile_image_url: string | null;
  greeting: string | null;
  biography: Biography | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author: { name: string } | null;
}

export function mapExpertRow(row: ExpertRow): Expert {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    position: row.position,
    phone: row.phone ?? '',
    email: row.email,
    expertType: row.expert_type,
    specialties: row.specialties ?? [],
    isAvailable: row.is_available,
    profileImageUrl: row.profile_image_url ?? '',
    greeting: row.greeting ?? '',
    biography: normalizeBiography(row.biography),
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author?.name ?? '',
  };
}

/** 멘토링 평점 집계 (view_expert_ratings, 9_experts.md 9.3 연계 통계) */
export interface ExpertRating {
  mentoringCount: number;
  averageRating: number | null;
}

export interface ExpertRatingRow {
  expert_id: string;
  mentoring_count: number;
  average_rating: number | null;
}

export function mapExpertRatingRow(row: ExpertRatingRow): ExpertRating {
  return {
    mentoringCount: Number(row.mentoring_count ?? 0),
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
  };
}

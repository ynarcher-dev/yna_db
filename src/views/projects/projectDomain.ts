import type { ProjectType } from '@/types/database';

/**
 * 프로젝트 도메인 분리 설정 (project_split_plan.md).
 * 단일 '프로젝트 관리'를 M&A / 신사업 두 페이지로 나누되, 목록·상세·폼 컴포넌트는
 * 공유하고 유형(projectType)·경로·타이틀만 이 설정으로 주입한다.
 */
export interface ProjectDomain {
  /** 이 페이지가 고정 노출하는 프로젝트 유형 */
  projectType: Extract<ProjectType, 'm_and_a' | 'new_business'>;
  /** 헤더/메뉴 타이틀 ("M&A 관리") */
  title: string;
  /** 짧은 라벨 ("M&A"/"신사업") — 연계 카드 제목·대시보드 등 좁은 자리용 */
  shortLabel: string;
  /** 목록 기준 경로 (상세는 `${basePath}/:id`) */
  basePath: string;
}

export const MA_PROJECT_DOMAIN: ProjectDomain = {
  projectType: 'm_and_a',
  title: 'M&A 관리',
  shortLabel: 'M&A',
  basePath: '/ma-projects',
};

export const NEW_BIZ_PROJECT_DOMAIN: ProjectDomain = {
  projectType: 'new_business',
  title: '신사업 관리',
  shortLabel: '신사업',
  basePath: '/new-biz-projects',
};

/** M&A·신사업 두 도메인 (연계 패널·대시보드에서 동일 순서로 순회). */
export const PROJECT_DOMAINS: ProjectDomain[] = [MA_PROJECT_DOMAIN, NEW_BIZ_PROJECT_DOMAIN];

/**
 * 프로젝트 유형 → 상세 페이지 기준 경로.
 * 역방향 연계 패널(스타트업·심사역·협력사 상세)에서 프로젝트 행 링크를 만들 때 사용한다.
 * '기타' 등 분리 메뉴가 없는 유형은 M&A 페이지로 폴백한다.
 */
export function projectBasePath(type: ProjectType): string {
  return type === 'new_business' ? NEW_BIZ_PROJECT_DOMAIN.basePath : MA_PROJECT_DOMAIN.basePath;
}

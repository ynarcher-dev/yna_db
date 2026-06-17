import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 심사역 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반).
 * 프로필 카드(이름·직급·소속)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 'Phase 4 담당 스타트업·프로그램·프로젝트' Alert 는 플레이스홀더라 토글 대상이 아니다.
 *
 * 표시 설정은 **Admin 전용**(직급·소속과 동일) — 본인 수정 RPC(update_my_profile)는
 * 허용 컬럼만 갱신하므로 sections 를 건드리지 않는다(폼은 admin 모드에서만 토글 노출).
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const MANAGER_SECTIONS = defineSections(
  ['biography', 'intro', 'startups', 'projects', 'programs', 'attachments'] as const,
  {
    biography: '약력',
    intro: '소개',
    startups: '담당 스타트업 (연동)',
    projects: '담당 프로젝트 (연동)',
    programs: '운영 프로그램 (연동)',
    attachments: '첨부파일',
  },
);

export type ManagerSectionKey = (typeof MANAGER_SECTIONS.keys)[number];
export type ManagerSections = SectionVisibility<ManagerSectionKey>;

export const DEFAULT_MANAGER_SECTIONS = MANAGER_SECTIONS.defaults;
export const normalizeManagerSections = MANAGER_SECTIONS.normalize;

import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 협력사 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반).
 * 프로필 카드(기업/기관명·연락처)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 'Phase 4 공동 참여 프로젝트' Alert 는 플레이스홀더라 토글 대상이 아니다.
 */
export const PARTNER_SECTIONS = defineSections(
  ['interactionLog', 'projects', 'businesses', 'attachments'] as const,
  {
    interactionLog: '교류 협력 이력',
    projects: '참여 프로젝트 (연동)',
    businesses: '참여 사업 (연동)',
    attachments: '첨부파일',
  },
);

export type PartnerSectionKey = (typeof PARTNER_SECTIONS.keys)[number];
export type PartnerSections = SectionVisibility<PartnerSectionKey>;

export const DEFAULT_PARTNER_SECTIONS = PARTNER_SECTIONS.defaults;
export const normalizePartnerSections = PARTNER_SECTIONS.normalize;

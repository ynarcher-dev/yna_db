import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 사업 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반, 17_conventions 7장).
 * 개요 카드(사업명·기수·예산·기간)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const BUSINESS_SECTIONS = defineSections(
  ['managers', 'startups', 'partners', 'calendar', 'attachments'] as const,
  {
    managers: '운영 심사역',
    startups: '참여 스타트업',
    partners: '참여 협력사',
    calendar: '마일스톤 캘린더',
    attachments: '첨부파일',
  },
);

export type BusinessSectionKey = (typeof BUSINESS_SECTIONS.keys)[number];
export type BusinessSections = SectionVisibility<BusinessSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_BUSINESS_SECTIONS = BUSINESS_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 BusinessSections. */
export const normalizeBusinessSections = BUSINESS_SECTIONS.normalize;

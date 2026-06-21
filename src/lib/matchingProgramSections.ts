import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 매칭 프로그램 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반, 17_conventions 7장).
 * 프로그램 현황 카드(프로그램명·기관·예산·상태)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const MATCHING_PROGRAM_SECTIONS = defineSections(
  ['applications', 'attachments'] as const,
  {
    applications: '매칭 신청/연계',
    attachments: '첨부파일',
  },
);

export type MatchingProgramSectionKey = (typeof MATCHING_PROGRAM_SECTIONS.keys)[number];
export type MatchingProgramSections = SectionVisibility<MatchingProgramSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_MATCHING_PROGRAM_SECTIONS = MATCHING_PROGRAM_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 MatchingProgramSections. */
export const normalizeMatchingProgramSections = MATCHING_PROGRAM_SECTIONS.normalize;

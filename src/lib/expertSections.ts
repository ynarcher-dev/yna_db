import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 전문가 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반).
 * 프로필 카드(이름·소속·연락처)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 'Phase 4 자문 매칭 히스토리' Alert 는 플레이스홀더라 토글 대상이 아니다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const EXPERT_SECTIONS = defineSections(
  ['biography', 'intro', 'mentoringRating', 'attachments'] as const,
  {
    biography: '약력',
    intro: '소개',
    mentoringRating: '멘토링 만족도',
    attachments: '첨부파일',
  },
);

export type ExpertSectionKey = (typeof EXPERT_SECTIONS.keys)[number];
export type ExpertSections = SectionVisibility<ExpertSectionKey>;

export const DEFAULT_EXPERT_SECTIONS = EXPERT_SECTIONS.defaults;
export const normalizeExpertSections = EXPERT_SECTIONS.normalize;

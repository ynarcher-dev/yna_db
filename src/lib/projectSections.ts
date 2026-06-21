import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 프로젝트 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반, 17_conventions 7장).
 * 기본 개요 카드(프로젝트명·유형·상태·기간)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const PROJECT_SECTIONS = defineSections(
  ['managers', 'startups', 'partners', 'calendar', 'attachments'] as const,
  {
    managers: '담당자',
    startups: '매칭 스타트업',
    partners: '대기업 · 협력사',
    calendar: '마일스톤 간트차트',
    attachments: '첨부파일',
  },
);

export type ProjectSectionKey = (typeof PROJECT_SECTIONS.keys)[number];
export type ProjectSections = SectionVisibility<ProjectSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_PROJECT_SECTIONS = PROJECT_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 ProjectSections. */
export const normalizeProjectSections = PROJECT_SECTIONS.normalize;

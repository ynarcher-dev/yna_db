import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 소속(부서) 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반).
 * 개요 카드(부서명·설립일·설명)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 현재 토글 대상 보조 섹션은 첨부파일뿐이며, Phase 4 에서 부서원/투자성과 블록이 추가되면 키를 늘린다.
 */
export const DEPARTMENT_SECTIONS = defineSections(['attachments'] as const, {
  attachments: '첨부파일',
});

export type DepartmentSectionKey = (typeof DEPARTMENT_SECTIONS.keys)[number];
export type DepartmentSections = SectionVisibility<DepartmentSectionKey>;

export const DEFAULT_DEPARTMENT_SECTIONS = DEPARTMENT_SECTIONS.defaults;
export const normalizeDepartmentSections = DEPARTMENT_SECTIONS.normalize;

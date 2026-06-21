import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 투자 자료실 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반, 17_conventions 7장).
 * 본문(content)·식별 정보는 항상 표시. 토글 대상은 첨부파일 카드뿐이다(소속 도메인과 동일 구조).
 */
export const INVEST_ARCHIVE_SECTIONS = defineSections(['attachments'] as const, {
  attachments: '첨부파일',
});

export type InvestArchiveSectionKey = (typeof INVEST_ARCHIVE_SECTIONS.keys)[number];
export type InvestArchiveSections = SectionVisibility<InvestArchiveSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_INVEST_ARCHIVE_SECTIONS = INVEST_ARCHIVE_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 InvestArchiveSections. */
export const normalizeInvestArchiveSections = INVEST_ARCHIVE_SECTIONS.normalize;

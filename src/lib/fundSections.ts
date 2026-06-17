import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 펀드 상세 카드 섹션 표시/숨김 설정 (공통 sectionVisibility 기반, 17_conventions 7장).
 * 재무 정보 카드(결성액·잔액·소진율)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const FUND_SECTIONS = defineSections(
  ['lp', 'capitalCalls', 'investments', 'attachments'] as const,
  {
    lp: 'LP 구성',
    capitalCalls: 'Capital Call',
    investments: '피투자 포트폴리오',
    attachments: '첨부파일',
  },
);

export type FundSectionKey = (typeof FUND_SECTIONS.keys)[number];
export type FundSections = SectionVisibility<FundSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_FUND_SECTIONS = FUND_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 FundSections. */
export const normalizeFundSections = FUND_SECTIONS.normalize;

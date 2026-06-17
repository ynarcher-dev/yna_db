import { defineSections, type SectionVisibility } from './sectionVisibility';

/**
 * 스타트업 상세 카드 섹션 표시/숨김 설정 (전 도메인 공통 인프라 sectionVisibility 기반).
 * 프로필 카드(기업명·로고·심사역)는 핵심 식별 정보라 토글 대상에서 제외한다.
 * 키 순서 = 상세 화면 렌더 순서.
 */
export const STARTUP_SECTIONS = defineSections(
  [
    'managers',
    'businessTeam',
    'metrics',
    'shareholders',
    'diagnosis',
    'newsroom',
    'followups',
    'memo',
    'programs',
    'projects',
    'attachments',
  ] as const,
  {
    managers: '담당 심사역 (연동)',
    businessTeam: '비즈니스 & 팀 역량',
    metrics: '성장 지표',
    shareholders: '주주 구성',
    diagnosis: '기업진단',
    newsroom: '뉴스룸',
    followups: '후속 보고',
    memo: '메모 · 회의록',
    programs: '참여 프로그램 (연동)',
    projects: '참여 프로젝트 (연동)',
    attachments: '첨부파일',
  },
);

export type StartupSectionKey = (typeof STARTUP_SECTIONS.keys)[number];
export type StartupSections = SectionVisibility<StartupSectionKey>;

/** 신규 등록 기본값(전체 표시). */
export const DEFAULT_STARTUP_SECTIONS = STARTUP_SECTIONS.defaults;

/** 부분/누락 가능한 raw jsonb → 안전한 StartupSections. */
export const normalizeSections = STARTUP_SECTIONS.normalize;

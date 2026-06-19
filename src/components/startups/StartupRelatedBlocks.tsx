import { StartupProgramsPanel } from '@/components/startups/StartupProgramsPanel';
import { StartupProjectsPanel } from '@/components/startups/StartupProjectsPanel';
import type { StartupSections } from '@/lib/startupSections';

/**
 * 스타트업 상세 연계 블록 (정방향 표시 전용, 읽기 전용).
 * 참여 프로그램·프로젝트를 표시만 한다 — 매핑·신규생성·연동해제는 제공하지 않는다.
 * 매핑 편집은 각 상대 도메인 상세(프로그램·프로젝트의 '참여/매칭 스타트업' 카드)에서 한다.
 * 각 섹션 토글로 표시/숨김. 투자 재원·금액은 성장 지표의 '투자현황'(startup_metrics)이 담는다.
 */
export function StartupRelatedBlocks({
  startupId,
  sections,
}: {
  startupId: string;
  sections: StartupSections;
}) {
  return (
    <>
      {sections.programs ? <StartupProgramsPanel startupId={startupId} /> : null}
      {sections.projects ? <StartupProjectsPanel startupId={startupId} /> : null}
    </>
  );
}

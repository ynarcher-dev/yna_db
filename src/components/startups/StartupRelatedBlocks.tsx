import { StartupProgramsPanel } from '@/components/startups/StartupProgramsPanel';
import { StartupProjectsPanel } from '@/components/startups/StartupProjectsPanel';
import type { StartupSections } from '@/lib/startupSections';

/**
 * 스타트업 상세 역방향 연계 블록 (양방향 매핑의 '쓰는 쪽').
 * 참여 프로그램·프로젝트를 이곳에서 직접 매핑(연결·신규생성)한다. 각 섹션 토글로 표시/숨김.
 * 투자 재원·금액은 성장 지표의 '투자현황'(startup_metrics)이 담으므로 펀드 블록은 두지 않는다.
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

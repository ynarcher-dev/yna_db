import { ManagerStartupsPanel } from '@/components/managers/ManagerStartupsPanel';
import { ManagerProjectsPanel } from '@/components/managers/ManagerProjectsPanel';
import { ManagerProgramsPanel } from '@/components/managers/ManagerProgramsPanel';
import type { ManagerSections } from '@/lib/managerSections';

/**
 * 심사역 상세 역방향 연계 블록 (양방향 매핑의 '쓰는 쪽').
 * 담당 스타트업·프로젝트(역할 없음)와 운영 프로그램(역할)을 이곳에서 직접 매핑(연결·신규생성)한다.
 * 표시는 각 도메인 목록과 동일한 표 형태 + 연동 해제 (PATTERNS 18.1). 각 섹션 토글로 표시/숨김.
 */
export function ManagerRelatedBlocks({
  managerId,
  sections,
}: {
  managerId: string;
  sections: ManagerSections;
}) {
  return (
    <>
      {sections.startups ? <ManagerStartupsPanel managerId={managerId} /> : null}
      {sections.projects ? <ManagerProjectsPanel managerId={managerId} /> : null}
      {sections.programs ? <ManagerProgramsPanel managerId={managerId} /> : null}
    </>
  );
}

import { ManagerStartupsPanel } from '@/components/managers/ManagerStartupsPanel';
import { ManagerProjectsPanel } from '@/components/managers/ManagerProjectsPanel';
import { ManagerBusinessesPanel } from '@/components/managers/ManagerBusinessesPanel';
import type { ManagerSections } from '@/lib/managerSections';

/**
 * 심사역 상세 연계 블록 (정방향 표시 전용, 읽기 전용).
 * 담당 스타트업·프로젝트·운영 사업을 표시만 한다 — 매핑·신규생성·연동해제는 제공하지 않는다.
 * 매핑 편집은 각 상대 도메인 상세(스타트업의 '담당 심사역', 프로젝트·사업의 담당자 카드)에서 한다.
 * 표시는 각 도메인 목록과 동일한 표 형태 + 행 클릭 시 상세 이동. 각 섹션 토글로 표시/숨김.
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
      {sections.businesses ? <ManagerBusinessesPanel managerId={managerId} /> : null}
    </>
  );
}

import { PartnerProjectsPanel } from '@/components/partners/PartnerProjectsPanel';
import { PartnerBusinessesPanel } from '@/components/partners/PartnerBusinessesPanel';
import type { PartnerSections } from '@/lib/partnerSections';

/**
 * 협력사 상세 역방향 연계 블록 (양방향 매핑의 '쓰는 쪽').
 * 참여 프로젝트(project_partners)·참여 사업(business_partners)을 이곳에서 직접 매핑(연결·신규생성)한다.
 * 표시는 각 도메인 목록과 동일한 표 형태 + 연동 해제 (PATTERNS 18.1). 각 섹션 토글로 표시/숨김.
 */
export function PartnerRelatedBlocks({
  partnerId,
  sections,
}: {
  partnerId: string;
  sections: PartnerSections;
}) {
  return (
    <>
      {sections.projects ? <PartnerProjectsPanel partnerId={partnerId} /> : null}
      {sections.businesses ? <PartnerBusinessesPanel partnerId={partnerId} /> : null}
    </>
  );
}

import { SectionHeader } from './SectionHeader';
import type { Startup } from '@/types/startup';

/**
 * 뉴스룸 박스 (기업진단 아래).
 * 추후 네이버 뉴스 API 를 연동해 해당 스타트업 관련 뉴스를 노출할 예정.
 * 현재는 기업진단과 동일한 카드 형태로 자리만 잡아두며, 데이터가 없으면 placeholder 를 노출한다.
 */
export function NewsroomBlock({ startup: _startup }: { startup: Startup }) {
  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader title="뉴스룸" />
      <div className="flex h-32 items-center justify-center rounded-md bg-yna-bg">
        <p className="text-sm text-yna-sub">네이버 뉴스 API 연동 예정</p>
      </div>
    </div>
  );
}

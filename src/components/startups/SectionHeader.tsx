import type { ReactNode } from 'react';
import { formatDate } from '@/lib/formatters';

/**
 * 스타트업 상세 섹션 카드 공통 헤더.
 * 좌측 제목 + 우측(최종 수정일 · 액션 버튼).
 * updatedAt prop 이 전달되면(빈 문자열 포함) 항상 '최종 수정 …'을 노출한다.
 * (값이 없으면 '-'. 수정일을 쓰지 않는 섹션은 prop 을 아예 넘기지 않는다.)
 */
export function SectionHeader({
  title,
  updatedAt,
  action,
}: {
  title: string;
  updatedAt?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-yna-main">{title}</h2>
      <div className="flex items-center gap-3">
        {updatedAt !== undefined ? (
          <span className="text-xs text-yna-sub">최종 수정 {formatDate(updatedAt)}</span>
        ) : null}
        {action}
      </div>
    </div>
  );
}

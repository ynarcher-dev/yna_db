import { Empty } from 'antd';
import type { ReactNode } from 'react';

/**
 * 조회 결과 없음 상태 (0_ui_ux.md 1.2)
 * 무채색 아이콘 + 한국어 안내 메시지 + 권한이 있을 때만 CTA 버튼을 하단에 제공.
 */
interface EmptyStateProps {
  /** 직관적인 한국어 안내 메시지 */
  message?: string;
  /** 권한이 있을 때 제공하는 행동 유도 버튼 (CTA) */
  action?: ReactNode;
}

export function EmptyState({
  message = '표시할 데이터가 없습니다.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span className="text-yna-sub">{message}</span>}
      />
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

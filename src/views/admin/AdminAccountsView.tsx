import { Alert } from 'antd';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * 계정 관리 화면 (`/admin/accounts`, Admin 전용 — 14_auth.md 14.3.4).
 * Phase 1 에서는 라우트·역할 가드(403) 확립까지만 다루며,
 * 신규 계정 생성/역할 변경/소프트 삭제는 Edge Function(admin-create-user 등)
 * 구축 이후 단계에서 목록·모달과 함께 연결한다.
 */
export function AdminAccountsView() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-yna-main">계정 관리</h1>
      <Alert
        type="info"
        showIcon
        className="mb-6"
        message="Admin 전용 화면"
        description="계정 생성·역할 변경·비활성화는 서버측 Edge Function 연동이 필요하여 다음 단계에서 제공됩니다. 현재는 접근 권한(Admin 전용) 가드만 적용되어 있습니다."
      />
      <div className="rounded-lg border border-yna-border bg-white">
        <EmptyState message="계정 목록은 준비 중입니다." />
      </div>
    </div>
  );
}

import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';

/** 404 화면 (17_conventions.md 1장 — 미정의 경로). */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border border-yna-border bg-white">
      <EmptyState
        message="요청하신 페이지를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/')}>
            대시보드로 이동
          </Button>
        }
      />
    </div>
  );
}

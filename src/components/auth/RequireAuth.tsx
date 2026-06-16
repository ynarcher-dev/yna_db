import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';

/**
 * 인증 가드 (17_conventions.md 1장, 14_auth.md 14.2).
 * - 세션 초기화 전: 전체 화면 스피너.
 * - 미인증: /login 으로 리다이렉트(원래 경로를 state.from 으로 전달).
 * - 최초 비밀번호 변경 강제: /onboarding/password 로 리다이렉트.
 * 통과 시 하위 라우트(<Outlet/>)를 렌더한다.
 */
export function RequireAuth() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (mustChangePassword) {
    return <Navigate to="/onboarding/password" replace />;
  }

  return <Outlet />;
}

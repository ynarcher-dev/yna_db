import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Forbidden } from '@/views/Forbidden';
import type { AppRole } from '@/types/database';

/**
 * 역할 가드 (17_conventions.md 1장, 2_policies.md 2.2).
 * RequireAuth 내부에 중첩해 사용하며, 역할 미달 시 403 화면을 렌더한다.
 * (예: /admin/* 는 role="admin" 으로 감싼다.)
 */
export function RequireRole({ role }: { role: AppRole }) {
  const userRole = useAuthStore((s) => s.role);
  if (userRole !== role) return <Forbidden />;
  return <Outlet />;
}

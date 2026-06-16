import { Tag } from 'antd';
import { APP_ROLE_COLOR, APP_ROLE_LABEL } from '@/lib/labels';
import type { AppRole } from '@/types/database';

/** 시스템 역할 배지 (5_managers.md — 관리자/심사역). */
export function RoleTag({ role }: { role: AppRole }) {
  return <Tag color={APP_ROLE_COLOR[role]}>{APP_ROLE_LABEL[role]}</Tag>;
}

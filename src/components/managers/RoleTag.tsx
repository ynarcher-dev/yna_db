import { Tag } from 'antd';
import { APP_ROLE_COLOR, APP_ROLE_LABEL, badgeTone } from '@/lib/labels';
import type { AppRole } from '@/types/database';

/**
 * 등급 배지 (5_managers.md 5.3 — 관리자 / 일반).
 * 색은 뱃지 톤 규칙(labels.ts badgeTone)을 따른다: 관리자=red(권한), 일반=neutral(흰/회).
 */
export function RoleTag({ role }: { role: AppRole }) {
  return <Tag {...badgeTone(APP_ROLE_COLOR[role])}>{APP_ROLE_LABEL[role]}</Tag>;
}

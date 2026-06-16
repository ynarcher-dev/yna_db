import type { IconType } from 'react-icons';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
  HiOutlineCollection,
  HiOutlineGlobeAlt,
} from 'react-icons/hi';

/**
 * 사이드바 내비게이션 정의 (1_overview.md 1.1, 경로는 17_conventions.md 1장 IA 기준).
 * 대시보드 + 8개 관리 메뉴. 목록은 복수형 경로, 상세/탭은 각 도메인 문서에서 확장한다.
 */
export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: IconType;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: '대시보드', icon: HiOutlineViewGrid },
  { key: 'managers', path: '/managers', label: '심사역 관리', icon: HiOutlineUserGroup },
  { key: 'startups', path: '/startups', label: '스타트업 관리', icon: HiOutlineOfficeBuilding },
  { key: 'programs', path: '/programs', label: '프로그램 관리', icon: HiOutlineCalendar },
  { key: 'funds', path: '/funds', label: '펀드 관리', icon: HiOutlineCurrencyDollar },
  { key: 'experts', path: '/experts', label: '전문가 관리', icon: HiOutlineAcademicCap },
  { key: 'projects', path: '/projects', label: '프로젝트 관리', icon: HiOutlineClipboardList },
  { key: 'departments', path: '/departments', label: '소속 관리', icon: HiOutlineCollection },
  { key: 'partners', path: '/partners', label: '협력사 관리', icon: HiOutlineGlobeAlt },
];

/** 현재 경로에 해당하는 메뉴 key (사이드바 활성 표시용). '/' 은 정확히 일치할 때만 대시보드. */
export function getActiveKey(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  const item = NAV_ITEMS.find((n) => n.path !== '/' && pathname.startsWith(n.path));
  return item?.key ?? '';
}

/** 현재 경로에 해당하는 헤더 타이틀. */
export function getNavTitle(pathname: string): string {
  if (pathname === '/') return '대시보드';
  const item = NAV_ITEMS.find((n) => n.path !== '/' && pathname.startsWith(n.path));
  return item?.label ?? '와이앤아처 PMS';
}

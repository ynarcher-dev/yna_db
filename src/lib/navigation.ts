import type { IconType } from 'react-icons';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
  HiOutlineLightBulb,
  HiOutlineCollection,
  HiOutlineGlobeAlt,
  HiOutlineLink,
  HiOutlineArchive,
  HiOutlineDatabase,
  HiOutlineBriefcase,
  HiOutlineTrendingUp,
  HiOutlineAdjustments,
  HiOutlineBeaker,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineCube,
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

export interface NavGroup {
  key: string;
  label: string;
  icon: IconType;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'db-management',
    label: 'DB관리',
    icon: HiOutlineDatabase,
    items: [
      { key: 'managers', path: '/managers', label: '심사역 관리', icon: HiOutlineUserGroup },
      { key: 'startups', path: '/startups', label: '스타트업 관리', icon: HiOutlineOfficeBuilding },
      { key: 'experts', path: '/experts', label: '전문가 관리', icon: HiOutlineAcademicCap },
      { key: 'partners', path: '/partners', label: '협력사 관리', icon: HiOutlineGlobeAlt },
    ],
  },
  {
    key: 'work-management',
    label: '업무관리',
    icon: HiOutlineBriefcase,
    items: [
      { key: 'businesses', path: '/businesses', label: '사업 관리', icon: HiOutlineCalendar },
      { key: 'ma-projects', path: '/ma-projects', label: 'M&A 관리', icon: HiOutlineClipboardList },
      {
        key: 'new-biz-projects',
        path: '/new-biz-projects',
        label: '신사업 관리',
        icon: HiOutlineLightBulb,
      },
    ],
  },
  {
    key: 'investment-management',
    label: '투자관리',
    icon: HiOutlineTrendingUp,
    items: [
      { key: 'funds', path: '/funds', label: '펀드 관리', icon: HiOutlineCurrencyDollar },
      {
        key: 'matching-programs',
        path: '/matching-programs',
        label: '매칭 프로그램 관리',
        icon: HiOutlineLink,
      },
      {
        key: 'invest-archives',
        path: '/invest-archives',
        label: '투자 자료실',
        icon: HiOutlineArchive,
      },
    ],
  },
  {
    key: 'business-management',
    label: '경영관리',
    icon: HiOutlineAdjustments,
    items: [
      { key: 'departments', path: '/departments', label: '소속 관리', icon: HiOutlineCollection },
    ],
  },
  {
    key: 'toolbox',
    label: '도구 모음',
    icon: HiOutlineCube,
    items: [
      { key: 'toolbox-ready', path: '/toolbox/ready', label: '준비 중', icon: HiOutlineLightBulb },
    ],
  },
  {
    key: 'labs',
    label: '실험실',
    icon: HiOutlineBeaker,
    items: [
      { key: 'labs-ready', path: '/labs/ready', label: '준비 중', icon: HiOutlineLightBulb },
    ],
  },
  {
    key: 'admin-menu',
    label: '관리자 메뉴',
    icon: HiOutlineShieldCheck,
    items: [
      { key: 'admin-settings', path: '/admin/settings', label: '관리자 설정', icon: HiOutlineCog },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: '대시보드', icon: HiOutlineViewGrid },
  ...NAV_GROUPS.flatMap((group) => group.items),
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

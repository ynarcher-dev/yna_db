import type { ThemeConfig } from 'antd';

/**
 * Ant Design 전역 테마 토큰 (0_design_system.md 3.2)
 * - 브랜드 포인트 컬러를 Primary 로, 메인 그레이를 기본 텍스트로 지정.
 * - 라운드 규격은 0_ui_ux.md 2.2 (버튼/인풋 rounded-md ≈ 8px).
 */
export const antdTheme: ThemeConfig = {
  token: {
    fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
    colorPrimary: '#e22213', // 브랜드 포인트 컬러
    colorBgContainer: '#ffffff',
    colorTextBase: '#515151', // 메인 그레이
    colorBorder: '#e5e5e5', // yna-border
    colorBgLayout: '#f5f5f5', // yna-bg
    borderRadius: 8,
  },
  components: {
    Button: {
      colorPrimaryHover: '#e22213',
      colorLinkHover: '#e22213',
    },
    // 테이블 헤더: 전 컬럼 동일한 회색. 정렬 컬럼만 강조되지 않도록 통일.
    Table: {
      headerBg: '#e8e8e8',
      headerSortActiveBg: '#e8e8e8',
      headerSortHoverBg: '#dedede',
      bodySortBg: 'transparent',
    },
    // 사이드바: 메인 그레이 배경 + 포인트 컬러 활성/호버 (1_overview.md, 0_design_system.md)
    Menu: {
      darkItemBg: '#515151',
      darkSubMenuItemBg: '#515151',
      darkItemColor: 'rgba(255, 255, 255, 0.85)',
      darkItemSelectedBg: '#e22213',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: 'rgba(226, 34, 19, 0.18)',
      darkItemHoverColor: '#ffffff',
    },
  },
};

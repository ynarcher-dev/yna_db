/** @type {import('tailwindcss').Config} */
// 0_design_system.md 3.1 — yna 컬러 토큰 + Pretendard fontFamily 확장
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        yna: {
          main: '#515151', // 사이드바/메인 텍스트/기본 무채색
          point: '#e22213', // 포인트/강조/Hover·Active
          bg: '#f5f5f5', // 전체 레이아웃 배경, 테이블 헤더
          border: '#e5e5e5', // 카드/테이블/탭 경계선
          sub: '#8c8c8c', // 서브 그레이 (Empty State 등)
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
      },
    },
  },
  // AntD와의 스타일 충돌(reset)을 피하기 위해 preflight는 유지하되 우선순위 주의
  corePlugins: {
    preflight: true,
  },
  plugins: [],
};

# 🎨 와이앤아처 PMS 디자인 시스템 (0_design_system.md)

본 문서는 **와이앤아처 데이터베이스(PMS)**의 일관된 UI/UX 디자인 시스템 규격을 정의합니다. 모든 컴포넌트와 페이지는 본 시스템의 스타일 토큰을 준수하여 개발되어야 합니다.

---

## 1. 폰트 타이포그래피 (Typography)

*   **기본 폰트**: **Pretendard**
    - 한국어 가독성에 최적화된 Pretendard 폰트를 전체 시스템의 기본 서체로 적용합니다.
*   **웹폰트 연결 (HTML/CSS)**:
    ```html
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
    ```
*   **CSS Font-Family 설정**:
    ```css
    font-family: "Pretendard Variable", Pretendard, sans-serif;
    ```

---

## 2. 컬러 시스템 (Color System)

| 구분 | 색상값 (HEX) | 적용 대상 및 가이드 |
| :--- | :--- | :--- |
| **Main Color** (메인) | `#515151` | 사이드바 배경, 메인 텍스트, 헤더 타이틀, 기본 무채색 컴포넌트 아웃라인 |
| **Point Color** (포인트) | `#e22213` | 중요 강조 텍스트, 활성화 배지, 알림 배지, 주요 확인 버튼 |
| **Hover / Active** (상태) | `#e22213` | 마우스 오버(Hover) 시 포인트 컬러 `#e22213` 로 전환하여 인터랙션 강조 |
| **Support Gray** (서브 배경) | `#f5f5f5` | 전체 레이아웃 배경, 비활성 입력 폼, 표(Table) 헤더 배경 |
| **Border Gray** (경계선) | `#e5e5e5` | 카드, 테이블, 탭 메뉴의 얇은 경계선 구성 |

---

## 3. 개발 프레임워크별 적용 가이드

### 3.1 Tailwind CSS 설정 (`tailwind.config.js`)
Tailwind CSS 환경에서 일관된 토큰을 클래스명으로 쓸 수 있도록 테마 설정을 확장합니다.

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        yna: {
          main: '#515151',
          point: '#e22213',
          bg: '#f5f5f5',
          border: '#e5e5e5',
        }
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
      }
    }
  }
}
```

*   **실제 적용 예시**:
    - 메인 컬러 배경 적용: `bg-yna-main`
    - 호버 시 포인트 컬러 전환 버튼: `bg-yna-main hover:bg-yna-point text-white transition-colors`
    - 포인트 컬러 텍스트 강조: `text-yna-point font-semibold`

### 3.2 Ant Design 테마 토컨 설정 (`ConfigProvider`)
Ant Design을 사용할 경우, 전역 테마 토큰 설정을 통해 메인 및 포인트 컬러를 주입합니다.

```tsx
import { ConfigProvider } from 'antd';

const App = () => (
  <ConfigProvider
    theme={{
      token: {
        fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
        colorPrimary: '#e22213', // 브랜드 포인트 컬러를 기본 Primary로 지정
        colorBgContainer: '#ffffff',
        colorTextBase: '#515151', // 기본 텍스트 색상을 메인 그레이로 지정
      },
      components: {
        Button: {
          colorPrimaryHover: '#e22213',
          colorLinkHover: '#e22213',
        },
      },
    }}
  >
    <YourRoutes />
  </ConfigProvider>
);
```

---

## 4. 컴포넌트 인터랙션 가이드

*   **호버 효과 (Hover State)**:
    - 네비게이션 메뉴 아이템, 하이퍼링크, 일반 버튼 등에 마우스 포인터를 올렸을 때 `#e22213` 컬러로 즉각 혹은 부드럽게(`transition duration-200`) 색상이 전환되도록 설계합니다.
*   **포커스 효과 (Focus State)**:
    - 입력 폼(Input), 선택 박스(Select) 등이 포커스 되었을 때 테두리를 `#e22213` 포인트 컬러로 하이라이트 처리합니다.

# 🧰 19. 프로젝트 부트스트랩 가이드 (19_bootstrap.md)

본 문서는 빈 저장소에서 개발에 착수하기 위한 초기 스캐폴드, 의존성, 폴더 구조, 시드 데이터, 테스트·품질 게이트를 정의합니다. [0_rules.md](0_rules.md)의 스택·폴더·500줄 규칙을 전제로 합니다.

---

## 1. 프로젝트 생성

```bash
npm create vite@latest yna-pms -- --template react-ts
cd yna-pms
npm i
```

---

## 2. 핵심 의존성

```bash
# 데이터/상태
npm i @supabase/supabase-js zustand @tanstack/react-query react-router-dom
# 폼/검증
npm i react-hook-form zod @hookform/resolvers
# UI/스타일
npm i antd @ant-design/icons react-icons
npm i -D tailwindcss postcss autoprefixer
# 차트/캘린더/칸반
npm i recharts @fullcalendar/react @fullcalendar/daygrid @hello-pangea/dnd
# 보고서/유틸
npm i pptxgenjs dayjs
# 품질
npm i -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks vitest @testing-library/react @testing-library/jest-dom
```

* **데이터 패칭**: [0_rules.md](0_rules.md)는 Supabase 직접 연동을 명시합니다. 캐싱·로딩·에러 상태를 표준화하기 위해 React Query로 Supabase 호출을 감싸 [17_conventions.md](17_conventions.md)의 목록 규약을 구현합니다.

---

## 3. 폴더 구조

[0_rules.md](0_rules.md) 3대 폴더(components/hooks/views)를 기준으로 확장합니다.

```
src/
  ├─ components/   # 재사용 UI (100~200줄): 버튼, 모달, 테이블, 카드, 차트 래퍼
  │   ├─ common/   #   AppShell(사이드바·헤더), Skeleton, EmptyState, ErrorToast
  │   └─ {domain}/ #   도메인별 표시 컴포넌트
  ├─ views/        # 완성형 페이지 (300~400줄): 라우트 단위 화면
  ├─ hooks/        # 데이터/로직 (200줄): useStartups, useDashboardSummary 등
  ├─ stores/       # Zustand: authStore, uiStore
  ├─ schemas/      # zod 검증 스키마
  ├─ lib/          # supabaseClient, formatters, labels, pptx/
  ├─ routes/       # 라우터 정의, RequireAuth/RequireRole 가드
  └─ types/        # 공유 TS 인터페이스 (각 docs의 interface 반영)
```

---

## 4. 환경 설정

* `.env.local`: [13_deployment.md](13_deployment.md) 2장의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`(+ 필요 시 `VITE_API_BASE_URL`)만 둡니다. 비밀키는 절대 `VITE_` 접두사로 노출하지 않습니다.
* `tailwind.config.js`: [0_design_system.md](0_design_system.md) 3.1의 `yna` 컬러 토큰·Pretendard fontFamily 확장.
* `index.html`: Pretendard 웹폰트 `<link>` 추가([0_design_system.md](0_design_system.md) 1장).
* Ant Design `ConfigProvider`: 동일 문서 3.2 테마 토큰 주입을 `App` 루트에 적용.

---

## 5. DB 초기화 순서

Supabase SQL Editor에서 아래 순서로 실행합니다.

1. [0_db_schema.md](0_db_schema.md) 2장 — 마스터 테이블 DDL + 프로젝트 단계 Trigger.
2. [0_db_schema.md](0_db_schema.md) 3장 — 전체 RLS 활성화 + `current_user_role()` + CRUD 정책(전 테이블 [2_policies.md](2_policies.md) 2.2 매트릭스대로).
3. [15_system_schema.md](15_system_schema.md) — 시스템 테이블 + RLS.
4. [16_aggregations.md](16_aggregations.md) — View/RPC + `system_events` 유니크 제약 + 동기화 Trigger + GRANT.
5. 시드 데이터(6장) 투입.
6. Edge Functions 배포([14_auth.md](14_auth.md) 14.4, [17_conventions.md](17_conventions.md) 4장).

> [!IMPORTANT]
> 첫 Admin 계정은 자가 가입이 막혀 있으므로, 최초 1회는 Supabase 콘솔에서 `auth` 사용자 생성 후 해당 `managers` 행의 `role`을 `admin`으로 직접 지정하는 부트스트랩이 필요합니다. 이후 계정은 모두 `/admin/accounts`에서 발급합니다.

---

## 6. 시드 데이터 원칙

* 개발·데모용 최소 시드: 부서 2개, 심사역 3명(Admin 1·Manager 2), 스타트업 5개(+분기별 metrics 3스냅샷씩), 펀드 1개, 사업 1개, 전문가 3명, 프로젝트 2개, 협력사 2개.
* 시드는 `supabase/seed.sql`로 버전 관리하고, 외래키 의존 순서(departments → managers → startups → ...)를 지킵니다.
* 운영 DB에는 시드를 투입하지 않습니다.

---

## 7. 품질 게이트 (배포 전 필수)

[13_deployment.md](13_deployment.md) 4장 체크리스트와 연동합니다.

```bash
npm run lint        # ESLint + 500줄 초과 경고 규칙
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run build       # vite build
```

* **500줄 규칙 강제**: ESLint `max-lines` 규칙(`{ max: 500, skipBlankLines: true, skipComments: true }`)을 추가해 작성 중 경고를 받습니다([0_rules.md](0_rules.md) 규칙 1·3).
* CI는 위 4단계가 모두 성공할 때만 `main` 배포를 진행합니다([13_deployment.md](13_deployment.md) 3장).

---

## 8. 1차 개발 순서 권장

1. 공통 셸(AppShell: 사이드바·헤더) + 라우터 + 인증 가드([1_overview.md](1_overview.md), [14_auth.md](14_auth.md), [17_conventions.md](17_conventions.md)).
2. 로그인·온보딩 → 대시보드(읽기 전용 RPC) 골격.
3. CRUD 단순 도메인부터: 협력사 → 전문가 → 부서 → 심사역.
4. 관계 복잡 도메인: 스타트업(시계열·후속보고) → 사업(캘린더·매핑) → 펀드 → 프로젝트(칸반·타임라인).
5. 스마트 기능: PPTX 추출([18_pptx_spec.md](18_pptx_spec.md)) → AI 파트너([3_smart_features.md](3_smart_features.md), [15_system_schema.md](15_system_schema.md)).

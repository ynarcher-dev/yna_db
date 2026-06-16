# 🗺️ 20. 개발 실행 로드맵 (20_roadmap.md)

본 문서는 흩어진 명세를 **순차 개발 대본**으로 묶은 실행 로드맵입니다. [19_bootstrap.md](19_bootstrap.md) 8장이 개요라면, 본 문서는 단계별 **완료 기준(DoD) · 선행 의존성 · 참조 문서 · AI 코딩 태스크 단위**를 제공합니다. 바이브 코딩 시 한 번에 한 태스크씩 지시하는 것을 권장합니다([0_rules.md](0_rules.md): 500줄·기능별 분할).

---

## 0. 사용법

* 각 Phase는 위에서 아래로 순서대로 진행합니다. **이전 Phase의 DoD를 만족하기 전에는 다음으로 넘어가지 않습니다.**
* 각 태스크는 "동사 + 산출물 + 위치" 형태로 쪼개 한 개씩 구현·검증합니다.
* 모든 Phase 종료 시 공통 검증 게이트(맨 아래 G장)를 통과해야 합니다.

---

## Phase 0 — 기반 구축 (Infra & Scaffold)
* **목표**: 빈 화면이라도 빌드·배포·DB 연결이 살아있는 상태.
* **선행**: 없음.
* **참조**: [19_bootstrap.md](19_bootstrap.md), [0_rules.md](0_rules.md), [0_design_system.md](0_design_system.md), [13_deployment.md](13_deployment.md)
* **태스크**:
  1. Vite+React+TS 프로젝트 생성, 의존성 설치([19_bootstrap.md](19_bootstrap.md) 1~2장).
  2. 폴더 구조 생성([19_bootstrap.md](19_bootstrap.md) 3장) + ESLint `max-lines:500`·Prettier 설정.
  3. Tailwind `yna` 토큰·Pretendard 폰트·AntD `ConfigProvider` 적용([0_design_system.md](0_design_system.md)).
  4. `src/lib/supabaseClient.ts` + `.env.local` 연결.
  5. DB 초기화 1~4단계 실행([19_bootstrap.md](19_bootstrap.md) 5장): 마스터/RLS/시스템 테이블/집계 View·Trigger.
  6. 최초 Admin 부트스트랩(콘솔 수동 1회) + 시드 투입.
* **DoD**: `npm run build` 성공 / Supabase에서 `get_dashboard_summary` 호출 시 JSON 반환 / S3+CloudFront 빈 페이지 배포 확인.

---

## Phase 1 — 공통 셸 & 인증 (Shell & Auth)
* **목표**: 로그인하면 사이드바·헤더가 있는 빈 셸로 들어오는 상태.
* **선행**: Phase 0.
* **참조**: [1_overview.md](1_overview.md), [14_auth.md](14_auth.md), [17_conventions.md](17_conventions.md), [2_policies.md](2_policies.md)
* **태스크**:
  1. `authStore`(Zustand) + Supabase 세션 동기화.
  2. 라우터 정의 + `<RequireAuth>` / `<RequireRole>` 가드([17_conventions.md](17_conventions.md) 1장).
  3. `AppShell`(사이드바 9메뉴 + 헤더 + 알림 종 배지 placeholder) — 컴포넌트 분할로 500줄 준수.
  4. 로그인 / 최초 비밀번호 설정 / 비밀번호 재설정 화면([14_auth.md](14_auth.md) 14.3).
  5. 공통 상태 컴포넌트: `Skeleton`, `EmptyState`, `ErrorToast`, `ConfirmModal`([0_ui_ux.md](0_ui_ux.md)).
* **DoD**: 시드 계정으로 로그인→대시보드 셸 진입 / 미인증 시 `/login` 리다이렉트 / Manager가 `/admin/accounts` 접근 시 403.

---

## Phase 2 — 대시보드 (읽기 전용)
* **목표**: 9대 도메인 요약 + 다가오는 일정이 실데이터로 표시.
* **선행**: Phase 1.
* **참조**: [4_dashboard.md](4_dashboard.md), [16_aggregations.md](16_aggregations.md)
* **태스크**:
  1. `useDashboardSummary` 훅 — `get_dashboard_summary(currentPeriod)` 호출.
  2. 3×3 도메인 카드 그리드 + 호버 인터랙션 + 각 상세 페이지 링크.
  3. 다가오는 일정 5건(`system_events`) 타임라인 섹션.
* **DoD**: 9개 카드가 시드 데이터 수치로 채워짐 / 카드 클릭 시 해당 메뉴로 이동 / 0건 도메인은 0으로 정상 표시.

---

## Phase 3 — 단순 CRUD 도메인
* **목표**: 관계가 단순한 도메인부터 목록·상세·등록/수정·소프트삭제 완성으로 **CRUD 패턴을 표준화**.
* **선행**: Phase 1(대시보드와 병행 가능).
* **참조**: [12_partners.md](12_partners.md), [9_experts.md](9_experts.md), [11_departments.md](11_departments.md), [5_managers.md](5_managers.md), [17_conventions.md](17_conventions.md), [2_policies.md](2_policies.md)
* **순서**: 협력사 → 전문가 → 소속(부서) → 심사역.
* **태스크(도메인마다 반복)**:
  1. `useListQuery` 기반 목록(검색·필터·정렬·페이지네이션) 화면([17_conventions.md](17_conventions.md) 2장).
  2. 상세 화면 + 연계 탭(해당 docs의 "연계 UI 블록").
  3. zod 스키마 + 등록/수정 폼([17_conventions.md](17_conventions.md) 3장).
  4. RBAC 적용: Manager 작성 가능 여부·삭제 차단을 화면과 RLS 양쪽에서 확인([2_policies.md](2_policies.md) 2.2).
  5. 도메인 특화 요소: 전문가 평점(`view_expert_ratings`), 부서 통계(`view_department_stats`), 심사역 본인 프로필 수정 RPC.
* **DoD**: 4개 도메인 모두 CRUD 동작 / Manager 계정으로 삭제 버튼 비노출·RLS 거부 확인 / 빈/로딩/에러 상태 표준 적용.

---

## Phase 4 — 복합 도메인
* **목표**: 시계열·매핑·캘린더·칸반 등 고난도 위젯 완성.
* **선행**: Phase 3(CRUD 패턴 확정).
* **참조**: [6_startups.md](6_startups.md), [7_programs.md](7_programs.md), [8_funds.md](8_funds.md), [10_projects.md](10_projects.md), [16_aggregations.md](16_aggregations.md)
* **순서·핵심 태스크**:
  1. **스타트업**: 기본 CRUD → `startup_metrics` 시계열 차트(Recharts) → `startup_followups` 마일스톤/제출 트래커 → 주주 파이차트.
  2. **프로그램**: CRUD → `program_events` FullCalendar 연동(동기화 Trigger 확인) → 운영 심사역/참여 스타트업 매핑.
  3. **펀드**: CRUD(Admin 전용) → 소진율 바·LP 도넛 → `capital_calls`·`fund_investments` 테이블.
  4. **프로젝트**: 칸반 보드(@hello-pangea/dnd) → 단계 변경 시 `project_timelines` 트랜잭션 기록 확인 → 스타트업/협력사 매핑 패널 → 타임라인 로거.
* **DoD**: 시계열 차트가 record_date 순으로 렌더 / 칸반 카드 이동 시 timeline 자동 기록 / program_events 등록이 대시보드 일정에 반영 / 펀드 작성은 Admin만.

---

## Phase 5 — 스마트 기능
* **목표**: PPTX 추출 + AI 대화형 파트너.
* **선행**: Phase 4(스타트업 데이터 완성).
* **참조**: [18_pptx_spec.md](18_pptx_spec.md), [3_smart_features.md](3_smart_features.md), [15_system_schema.md](15_system_schema.md), [17_conventions.md](17_conventions.md) 4장
* **태스크**:
  1. **PPTX**: `src/lib/pptx/` 분할 구조 → 스타트업 상세 "보고서 출력" 버튼 → 4슬라이드 생성([18_pptx_spec.md](18_pptx_spec.md)).
  2. **파일 업로드 파이프라인**: `issue-upload-url` Edge Function + Presigned 업/다운로드 + `uploaded_files` 기록([17_conventions.md](17_conventions.md) 4장).
  3. **AI 파트너**: 대화 UI(`/assistant`) → 문서 업로드/임베딩(Edge Function) → `match_document_chunks` RAG + DB 교차 조회 → 응답·인용 표시 → 세션/메시지 저장([15_system_schema.md](15_system_schema.md)).
  4. **알림**: `notifications` 생성 Trigger(후속보고 기한·단계변경) + 헤더 배지 실데이터 연결.
* **DoD**: 편집 가능한 PPTX 다운로드(텍스트/표/네이티브 차트, Pretendard) / AI가 업로드 문서+DB를 근거로 답변·출처 표기 / 임시파일 만료 정리 동작 / 배지 카운트 정확.

---

## G. 공통 검증 게이트 (모든 Phase 종료 시)

[13_deployment.md](13_deployment.md) 4장과 연동합니다.

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

* [ ] 모든 소스 파일 500줄 이하([0_rules.md](0_rules.md)).
* [ ] 신규 화면에 로딩(스켈레톤)·빈 화면·에러 상태 적용([0_ui_ux.md](0_ui_ux.md)).
* [ ] 신규 테이블/기능의 RBAC를 Admin·Manager 두 계정으로 교차 검증([2_policies.md](2_policies.md)).
* [ ] 모든 Supabase 호출에 `try-catch` + 사용자 피드백([0_rules.md](0_rules.md) 3장).
* [ ] 비밀키가 `VITE_`로 노출되지 않음, 민감 작업은 Edge Function 경유([13_deployment.md](13_deployment.md)).

---

## 의존성 요약 (한눈에)

```mermaid
graph TD
    P0[Phase 0 기반] --> P1[Phase 1 셸·인증]
    P1 --> P2[Phase 2 대시보드]
    P1 --> P3[Phase 3 단순 CRUD]
    P3 --> P4[Phase 4 복합 도메인]
    P4 --> P5[Phase 5 스마트 기능]
    P2 -.참조.-> P4
```

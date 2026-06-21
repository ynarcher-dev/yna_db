# 24. 전체 구현 현황 점검 및 작업 운영 가이드

## 24.1 목적

이 문서는 현재 코드에 구현된 화면·도메인·마이그레이션을 문서와 대조한 기준표입니다. 앞으로 기능을 추가하거나 애자일하게 수정할 때는 **코드 변경과 동시에 관련 `.md` 문서 및 미적용 마이그레이션을 갱신**해 누락과 얇은 SQL 파일 증가를 줄입니다.

---

## 24.2 현재 구현 화면 전수 조사

기준 파일: [AppRoutes.tsx](../src/routes/AppRoutes.tsx), [navigation.ts](../src/lib/navigation.ts)

| 영역 | 경로 | 구현 파일 | 문서 | 상태 |
| :--- | :--- | :--- | :--- | :--- |
| 인증 | `/login` | `views/auth/LoginView.tsx` | [14_auth.md](14_auth.md) | 구현 |
| 인증 | `/onboarding/password` | `views/auth/OnboardingPasswordView.tsx` | [14_auth.md](14_auth.md) | 구현 |
| 인증 | `/reset-password` | `views/auth/ResetPasswordView.tsx` | [14_auth.md](14_auth.md) | 구현 |
| 대시보드 | `/` | `views/DashboardView.tsx` | [4_dashboard.md](4_dashboard.md), [16_aggregations.md](16_aggregations.md) | 구현 |
| 심사역 관리 | `/managers`, `/managers/:id` | `views/managers/*` | [5_managers.md](5_managers.md) | 구현 |
| 스타트업 관리 | `/startups`, `/startups/:id` | `views/startups/*` | [6_startups.md](6_startups.md) | 구현 |
| 전문가 관리 | `/experts`, `/experts/:id` | `views/experts/*` | [9_experts.md](9_experts.md) | 구현 |
| 협력사 관리 | `/partners`, `/partners/:id` | `views/partners/*` | [12_partners.md](12_partners.md) | 구현 |
| 사업 관리 | `/businesses`, `/businesses/:id` | `views/businesses/*` | [7_businesses.md](7_businesses.md) | 구현 |
| M&A 관리 | `/ma-projects`, `/ma-projects/:id` | `views/projects/Ma*` | [10_projects.md](10_projects.md) | 구현 |
| 신사업 관리 | `/new-biz-projects`, `/new-biz-projects/:id` | `views/projects/NewBiz*` | [10_projects.md](10_projects.md) | 구현 |
| 펀드 관리 | `/funds`, `/funds/:id` | `views/funds/*` | [8_funds.md](8_funds.md) | 구현 |
| 매칭 프로그램 관리 | `/matching-programs`, `/matching-programs/:id` | `views/matchingPrograms/*` | [21_matching_programs.md](21_matching_programs.md) | 구현 |
| 투자 자료실 | `/invest-archives`, `/invest-archives/:id` | `views/investArchives/*` | [22_invest_archives.md](22_invest_archives.md) | 구현 |
| 소속 관리 | `/departments`, `/departments/:id` | `views/teams/*` | [11_departments.md](11_departments.md) | 구현(경로명 유지, 화면은 팀 기준) |
| 관리자 계정 | `/admin/accounts` | `views/admin/AdminAccountsView.tsx` | [14_auth.md](14_auth.md) | 구현 |
| 도구 모음 | `/toolbox/ready` | `PlaceholderPage` | 없음 | 플레이스홀더 |
| 실험실 | `/labs/ready` | `PlaceholderPage` | 없음 | 플레이스홀더 |
| 관리자 설정 | `/admin/settings` | `PlaceholderPage` | 없음 | 플레이스홀더 |

---

## 24.3 문서 대조 결과

* 구현된 주요 업무 도메인은 모두 대응 문서가 있습니다.
* [23_gantt_milestone.md](23_gantt_milestone.md)는 보강 요청이 누적되며 최초 설계와 달라졌으므로, 현재 기준은 **진행률 폐지 → 상태값**, **단일 담당자 → 복수 담당자**, **테스크 첨부·URL**, **수동 정렬**입니다.
* 플레이스홀더 메뉴(`/toolbox/ready`, `/labs/ready`, `/admin/settings`)는 아직 명세 문서가 없습니다. 실제 구현을 시작할 때만 별도 문서로 승격합니다.
* 코드 파일 길이 규칙 점검 결과 [labels.ts](../src/lib/labels.ts)가 500줄을 초과했습니다. 기능 변경은 아니므로 이번 정리에서 리팩토링하지 않고, 다음 라벨 추가 작업 전 분리를 권장합니다.

---

## 24.4 마이그레이션 정리 결과

* 간트 마일스톤 관련 `0064_gantt_milestone_revise.sql`, `0065_gantt_milestone_attachments.sql`는 [0063_gantt_milestone_schema.sql](../supabase/migrations/0063_gantt_milestone_schema.sql)에 통합했습니다.
* 따라서 새 DB에는 `0063` 하나만 실행하면 간트 마일스톤의 최종 스키마가 반영됩니다.
* 이미 과거 `0063`만 실행한 DB가 있다면, 통합본을 다시 실행하면 `IF NOT EXISTS`·`DROP IF EXISTS` 기반으로 보강 컬럼과 제약을 맞춥니다.

### 24.4.1 마이그레이션 통합 가능성 판단

마이그레이션 파일 수를 줄이는 방법은 있지만, **이미 Supabase SQL Editor에서 RUN 한 파일을 과거 이력에서 삭제·수정하면 운영 DB와 저장소 이력이 어긋날 수 있습니다.** 따라서 아래 기준으로만 통합합니다.

| 상황 | 통합 가능 여부 | 권장 방식 |
| :--- | :--- | :--- |
| 아직 어떤 DB에도 RUN 하지 않은 기능 보강 SQL | 가능 | 새 번호를 만들지 않고 기존 기능 파일에 흡수 |
| 로컬/개발 DB만 쓰고 언제든 DB를 새로 만들 수 있음 | 가능 | `0001_schema.sql` 중심의 새 baseline을 만들고 기존 얇은 파일을 archive로 이동하는 방식 검토 |
| 운영/공유 DB에 이미 번호 순서대로 RUN 됨 | 제한적 | 기존 파일은 유지하고, 이후 변경만 forward-only 새 번호로 추가 |
| 기능 이름이 바뀐 경우(예: program → business) | 과거 파일명 통합 비권장 | `0055`처럼 forward-only 리네임을 두고, 문서에서 옛 명칭 유지 이유를 설명 |

현재 저장소는 `0001`~`0063` 중 일부가 이미 RUN 완료로 표시되어 있으므로, **전체 파일을 물리적으로 하나로 합치는 작업은 권장하지 않습니다.** 대신 앞으로는 아래 방식으로 파일 증가를 억제합니다.

* 같은 기능의 수정 요청은 DB 미적용 상태라면 기존 최신 파일에 합칩니다.
* DB 적용 이후 수정은 새 번호를 만들되, 한 화면/도메인의 보강사항을 한 파일로 묶습니다.
* 큰 정리가 필요하면 `supabase/migrations_archive/` 같은 보관 폴더를 만들고, 신규 설치용 `baseline`과 운영 이력용 `incremental`을 분리하는 별도 작업으로 진행합니다.

---

## 24.5 앞으로의 작업 운영 규칙

1. **작업 시작 전**
   * 관련 도메인 문서 1개와 공통 문서([PATTERNS.md](PATTERNS.md), 필요 시 [17_conventions.md](17_conventions.md))를 먼저 확인합니다.
   * 새 화면이면 [24.2](#242-현재-구현-화면-전수-조사)에 경로·문서·상태를 추가합니다.

2. **개발 중**
   * 구현 변경이 화면 동작, 데이터 모델, 권한, 라우팅, 마이그레이션 중 하나라도 바꾸면 같은 턴에 관련 `.md`를 갱신합니다.
   * 즉석 수정 요청은 기존 문서의 `구현 메모` 또는 `변경 이력` 성격의 문단에 흡수합니다. 작은 수정마다 새 문서를 만들지 않습니다.

3. **마이그레이션 작성**
   * 아직 DB에 적용하지 않은 동일 기능 SQL이 있으면 새 번호를 만들지 말고 해당 파일에 보강합니다.
   * 이미 적용된 SQL을 바꾸면 운영 DB와 문서가 어긋나므로, 적용 이후의 변경은 새 번호를 만듭니다.
   * 새 번호를 만들 때는 기능 단위로 묶습니다. 단일 컬럼·라벨·옵션 변경만으로 얇은 파일을 만들지 않고, 같은 화면의 보강사항을 한 파일에 모읍니다.

4. **작업 종료 전**
   * `docs/index.md`, [PROGRESS.md](PROGRESS.md), 이 문서의 전수 조사표 중 변경이 필요한 곳을 갱신합니다.
   * SQL 파일을 만들거나 통합했다면 `supabase/README.md`와 [PROGRESS.md](PROGRESS.md)의 마이그레이션 표도 함께 갱신합니다.
   * 가능하면 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` 중 변경 범위에 맞는 검증을 실행합니다.

---

## 24.6 문서 분리·통합 기준

* **도메인별 상세 명세**: 화면·데이터·권한이 독립적인 기능은 `NN_{domain}.md`로 둡니다.
* **공통 구현 규칙**: 여러 도메인에 반복되는 목록/상세/폼/RLS/첨부/섹션 토글은 [PATTERNS.md](PATTERNS.md)에 통합합니다.
* **진행 현황**: 완료 여부와 DB 적용 여부는 [PROGRESS.md](PROGRESS.md)만 최신으로 유지합니다.
* **전체 점검표**: 실제 구현 화면과 문서 대응 여부는 본 문서만 최신으로 유지합니다.

# 11. 소속 관리 (Departments → 회사·그룹·팀)

## 11.1 기능 정의 및 목적
* **목적**: 사내 조직을 **회사 > 그룹 > 팀** 3단계 계층으로 관리하고, 팀(소속 단위)별 인원과 담당 스타트업 통계를 요약 조회합니다.
* **소속 계층 개편(발주자 확정 2026-06-17)**: 기존 "본부/부서(departments)" 단일 계층을 **회사 > 그룹 > 팀**으로 확장했습니다.
  * **회사**: 와이앤아처 / 와이앤아처벤처스 / 와이앤아처인베스트먼트 (**고정 3종**).
  * **그룹**: 기존 `departments` 테이블을 그대로 사용(화면 라벨만 "그룹"). 한 그룹은 한 회사에 속합니다(`departments.company`).
  * **팀**: 신설 `teams` 테이블. 소속 관리의 **단위** — 팀 한 건이 곧 하나의 '부서'로 동작하며, **소속 관리 목록의 한 행 = 한 팀**입니다. 팀은 그룹에 속합니다.
* **화면 라벨·경로**: 메뉴/타이틀은 **'소속 관리'**, 경로는 `/departments`를 유지하되 목록·상세 화면은 **팀** 기준으로 렌더합니다(DB 테이블명은 영문 유지, 화면 표기만 변경 — [PATTERNS.md](PATTERNS.md) 14장).
* **관리 방식(발주자 재확정 2026-06-17)**: **'기본팀' 자동 생성/편입은 하지 않습니다.** 팀이 없는 심사역은 `team_id`를 비워 두고(=소속 팀 없음), 화면에서도 팀명을 노출하지 않습니다. 팀 배정은 Admin 이 팀을 만든 뒤 상세의 '소속 멤버' 패널에서 직접 합니다.

---

## 11.2 데이터 모델 요건

### 1) 그룹 — `departments`
한 회사에 속하는 조직 단위(화면 라벨 "그룹").

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 그룹 고유 식별자 |
| `name` | `varchar(100)` | 그룹명 (예: 글로벌액셀러레이팅본부, 투자본부) |
| `company` | `varchar(50)` | **소속 회사**(고정 3종 CHECK 제약, `0050`). 기존 그룹은 대표 회사(와이앤아처)로 백필 |
| `established_at` | `date` | 설립일 |
| `description` | `text` | 그룹 역할 및 업무 설명 |
| `leader_id` | `uuid` | 본부장(`managers.id`). 임명/표시 UI 는 후속(현재 미구현) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

* **유일성**: `(company, name)` 조합으로 그룹명 중복을 막습니다(`0050`).

### 2) 팀 — `teams` (소속 관리의 단위, `0051`~`0053`)

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 팀 고유 식별자 |
| `department_id` | `uuid` | 소속 **그룹**(`departments.id`). 그룹 삭제 시 `ON DELETE CASCADE` |
| `name` | `varchar(100)` | 팀명 (예: 1팀). **선택값(nullable, `0053`)** — 비우면 회사+그룹 단위 소속으로, 화면에서 팀명을 노출하지 않음 |
| `operating_start` | `date` | 운영 시작일 |
| `operating_end` | `date` | 운영 종료일. 비면 **운영중** |
| `created_by` | `uuid` | 작성자(`managers.id`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` / `updated_at` | `timestamp` | 등록/최종 수정 일시(트리거 자동 갱신) |

* **유일성**: `(department_id, name) WHERE deleted_at IS NULL AND name IS NOT NULL` — 같은 그룹 안 팀명 중복 방지(**팀명이 NULL 인 행은 다수 허용**, `0053`).

### 3) 심사역 소속 — `managers.team_id` (`0052`)
* 심사역(소속 멤버)은 `team_id`로 팀에 배정됩니다. 기존 `managers.department_id`(그룹)는 유지하되, **`team_id`가 바뀌면 그 팀의 그룹으로 `department_id`를 자동 동기화**하는 트리거가 있습니다 → 그룹 기준 집계(`view_department_stats`)·목록 소속 필터가 무변경으로 동작.
* 팀이 없는 심사역은 `team_id`가 NULL(소속 팀 없음).

### 4) 타 페이지 연계성 (Connectivity & Relations)
*   **소속 멤버 연계**: `managers.team_id` -> 해당 팀에 속한 심사역 목록(팀 상세 '소속 멤버' 패널).
*   **본부장 연계**: `departments.leader_id`(`managers.id`) -> 그룹 본부장 매핑(임명/표시 UI 후속).
*   **소속원 포트폴리오 집계 연계**: 소속 심사역들이 담당하는 `startups`·`startup_metrics` 조인 집계(`view_department_stats`) -> 소속 스타트업 총합 가치·매출 통계.

### 🏷️ TypeScript Interface: `Team`
```typescript
interface Team {
  id: string;
  departmentId: string;   // 소속 그룹 id (departments.id)
  groupName: string;      // 소속 그룹명 (departments 임베드)
  company: Company;       // 소속 회사 (고정 3종)
  name: string;           // 팀명. 없으면 '' (회사+그룹 단위 소속)
  operatingStart: string; // 없으면 ''
  operatingEnd: string;   // 없으면 '' (= 운영중)
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;     // 작성자(심사역) 이름. 없으면 ''
}
```

---

## 11.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **소속(팀) 목록**: 한 행 = 한 팀. 컬럼 = **No. · 회사 · 그룹명 · 팀명 · 운영기간(운영중 Tag) · 작성자 · 등록일 · 수정일 · 관리**. 툴바 = 팀명 검색 + **회사** 필터. ([TeamsListView](../src/views/teams/TeamsListView.tsx))
*   **팀 등록/수정 폼 (Admin 전용)**: 회사(고정 3종 Select) + **그룹명(기존 선택 또는 신규 입력 → 자동 생성)** + 팀명(선택) + 운영 기간(선택, 종료일은 시작일 이후). ([TeamForm](../src/components/teams/TeamForm.tsx) · [schemas/team.ts](../src/schemas/team.ts))
*   **팀 상세 개요 카드**: 회사·그룹·팀명·운영 기간 표기.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **소속 멤버 패널**(`TeamMembersPanel`): 팀에 배정된 심사역 목록. 멤버 추가/해제는 Admin.
*   **본부 투자 성과 비교 (Connected Chart)**: 소속 심사역이 담당하는 스타트업들의 기업 가치 총합·합산 매출을 카드 위젯·가로 비교 바로 연계 출력(`view_department_stats`).

---

## 11.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 회사·그룹·팀 및 통계 조회 가능)
* **작성·수정·삭제(소프트)**: **Admin 전용** (팀/그룹 생성·수정·삭제, 멤버 배정). Manager 는 작성 액션 미노출. (기존 소속=Admin 전용 정책 계승, [PATTERNS.md](PATTERNS.md) 8장)

---

## 11.5 적용 마이그레이션
| 파일 | 내용 |
| :--- | :--- |
| `0050_departments_company.sql` | 그룹(`departments`)에 `company` 추가(고정 3종 CHECK) + `(company,name)` UNIQUE |
| `0051_teams.sql` | 팀(`teams`) 테이블 신설(소속 단위) + RLS(Admin) |
| `0052_managers_team.sql` | `managers.team_id` 추가 + `team_id → department_id` 자동 동기화 트리거 |
| `0053_teams_name_optional.sql` | 팀명(`teams.name`) nullable 보정 + 유일성 인덱스 재정의(NULL 팀명 다수 허용) |

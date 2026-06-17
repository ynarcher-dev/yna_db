# 6. 스타트업 관리 (Startups)

## 6.1 기능 정의 및 목적
* **목적**: 스타트업의 기업 기본 정보, 지표 변동 추이(시계열), 정기 보고서 제출 현황 및 리스크(Follow-up)를 종합적으로 추적합니다.

---

## 6.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `startups`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 기업 고유 식별자 |
| `name` | `varchar(100)` | 기업명 |
| `ceo_name` | `varchar(50)` | 대표자명 |
| `logo_url` | `text` | 로고 이미지 S3 경로 |
| `brand_color` | `varchar(7)` | 브랜드 테마 컬러 (#HEX) |
| `description` | `text` | 기업 설명 및 비즈니스 모델 |
| `investment_stage` | `varchar(30)` | 투자 유치 단계 (Seed, Pre-A, Series-A 등) |
| `shareholders` | `jsonb` | 주주 구성 및 지분비율 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **담당 심사역 연계**: **다대다** `startup_managers` 조인(`managers.id`) -> 한 스타트업에 담당 심사역 여러 명. 책임자(`created_by`)와 별개. (초기 단수 `manager_id` 컬럼은 잔존하나 앱 미사용 — 2026-06-17 다대다 확정·전환, 6.5 참조.)
*   **성장 지표 연계**: `startup_metrics.startup_id` -> 분기별 기업가치, 매출액, 고용 인원 시계열 데이터 조회
*   **후속 보고 연계**: `startup_followups.startup_id` -> 보고 대상 기간(`reporting_period`), 제출 기한(`due_date`), 제출 현황 및 마일스톤 조회
*   **참여 프로그램 연계**: `program_startups` 조인 테이블 -> 스타트업이 참여 중인 배치 사업 조회
*   **프로젝트 연계**: `project_startups` 조인 테이블 -> 스타트업이 매핑된 M&A / OI 프로젝트 조회

### 🏷️ TypeScript Interface: `Startup`
```typescript
interface Startup {
  // [고유 속성]
  id: string;
  name: string;
  ceoName: string;
  logoUrl?: string;
  brandColor?: string;
  description: string;
  investmentStage: string;
  shareholders: { name: string; shares: number; percentage: number }[];
  deletedAt?: string;
  createdAt: string;

  // [연계 데이터]
  managerId: string;
}
```

---

## 6.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **스타트업 프로필 카드 (목록/상세)**: 로고, 기업명, 대표자명, 투자 단계 배지를 카드 형태로 출력. 브랜드 컬러(`#HEX`)를 카드 보더 또는 배경 액센트로 활용.
*   **주주 구성 표 및 원형 차트 (PIE)**: 지분 구성을 시각적으로 분할해 주는 파이 차트 블록.
*   **기본 프로필 등록/수정 폼**: 기업 기본 인적 사항 및 주주 정보 추가/제외 에디터 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **담당 심사역 매핑 패널**: 스타트업 상세 우측에 담당 심사역 프로필 및 연락처 노출, 클릭 시 심사역 상세로 이동.
*   **시계열 지표 트렌드 차트 (Detail Tab 1)**: `startup_metrics`에서 누적된 데이터를 차트(Line/Bar)로 렌더링. (매출, 고용, 가치 변화 추이)
*   **정기 보고 및 마일스톤 트래커 (Detail Tab 2)**: `startup_followups` 테이블을 연계하여 보고 대상 분기, 제출 기한, 재무 자료 다운로드 링크와 마일스톤 달성 여부 체크리스트를 표출합니다. 제출률은 해당 기간에 생성된 제출 대상 건수를 분모로 계산합니다. 첨부파일 다운로드가 가능한 이 카드는 [17_conventions.md](17_conventions.md) 4장의 공통 규약에 따라 다운로드 시 목적을 입력받고 `file_download_logs`(다운로드한 사용자·시각·목적)에 **DB 로만 기록**합니다(현행 정책상 화면에는 이력을 노출하지 않습니다).
*   **뉴스룸 (Newsroom)**: 기업진단 아래의 카드 섹션. 추후 **네이버 뉴스 API** 를 연동해 해당 스타트업 관련 뉴스를 노출할 예정. 현재는 기업진단과 동일한 카드 형태로 자리만 잡아두고 placeholder("네이버 뉴스 API 연동 예정")를 노출한다(수동 입력·DB 컬럼 없음 → 자동 연동이라 수정 버튼·최종수정일 없음).
*   **참여 프로그램 & 프로젝트 목록 (Detail Tab 3)**: 참여했던 지원 사업 및 진행 중인 M&A 딜/오픈이노베이션 이력 표출.

> **카드 섹션 표시/숨김**: 위 보조 카드 섹션(비즈니스&팀·성장지표·주주·기업진단·뉴스룸·후속관리·메모)은 등록·기본 수정 폼의 토글로 표시/숨김할 수 있다(전 도메인 공통 규약, [17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장). 프로필/식별 카드는 항상 표시. 저장은 `startups.sections` jsonb 단일 컬럼.

---

## 6.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 스타트업 정보 및 시계열 지표, 후속 보고 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (스타트업 등록, 시계열 지표 작성 및 후속 보고 등록 가능). **현행은 작성자 한정이 아니라 전 직원(Admin·Manager) 공통** — `created_by`(작성자)는 표시·기록용일 뿐 편집 권한과 무관(RLS `startups_update_staff` 가 역할 기준). 변경 가능성은 6.5 참조.
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

---

## 6.5 결정 이력 (Resolved Decisions)

| 항목 | 결정(2026-06-17) | 반영 |
| :--- | :--- | :--- |
| **담당 심사역 수** | **다대다 채택** — 책임자(`created_by`, 등록자 1인) + 담당자(`startup_managers` 다대다, 역할 구분 없음) + 관리자 3계층 | `0038_startup_managers.sql`(조인+백필), 폼에서 단수 Select 제거→상세 `EntityManagersPanel`, 목록 다중 이름·조인 필터, `view_department_stats` 재정의. 프로젝트(`project_managers`)와 동일 모델. |
| **게시글 삭제 권한** | **책임자 + 관리자** (수정은 전 직원 공통 유지) | 프로젝트에 우선 적용(`projects_update_staff`). 스타트업 등 기존 도메인 삭제는 **현행 관리자 전용 유지**(추후 일괄 조정 시 동일 패턴 적용). |
| **게시글 수정 권한 축소** | **보류 유지** — '작성자/담당자 한정'으로 좁힐지는 미정 | 현재 전 직원(Admin·Manager) 공통. RLS+UI 게이트 교체만으로 가능(데이터 변경 없음). |

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
*   **담당 심사역 연계**: `manager_id` (`managers.id` 외래키 참조) -> 담당 심사역 정보 조회
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
*   **정기 보고 및 마일스톤 트래커 (Detail Tab 2)**: `startup_followups` 테이블을 연계하여 보고 대상 분기, 제출 기한, 재무 자료 다운로드 링크와 마일스톤 달성 여부 체크리스트를 표출합니다. 제출률은 해당 기간에 생성된 제출 대상 건수를 분모로 계산합니다.
*   **참여 프로그램 & 프로젝트 목록 (Detail Tab 3)**: 참여했던 지원 사업 및 진행 중인 M&A 딜/오픈이노베이션 이력 표출.

---

## 6.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 스타트업 정보 및 시계열 지표, 후속 보고 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (스타트업 등록, 시계열 지표 작성 및 후속 보고 등록 가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

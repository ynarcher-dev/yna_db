# 7. 프로그램 관리 (Programs)

## 7.1 기능 정의 및 목적
* **목적**: 기수별 액셀러레이팅(AC) 배치 프로그램 및 정부 지원 사업의 공고, 모집 일정, 지원 예산과 행사를 체계적으로 관리합니다.

---

## 7.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `programs`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 프로그램 고유 식별자 |
| `name` | `varchar(150)` | 프로그램명 |
| `generation` | `integer` | 기수 (예: 1, 2, 3) |
| `budget` | `numeric(15, 2)` | 정부 지원 및 운영 예산 |
| `start_date` | `date` | 프로그램 시작일 |
| `end_date` | `date` | 프로그램 종료일 |
| `recruitment_deadline` | `date` | 참가 스타트업 모집 마감일 |
| `description` | `text` | 프로그램 상세 설명 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **참여 스타트업 연계**: `program_startups` 조인 테이블 (`program_id`, `startup_id` 참조) -> 특정 배치 기수에 참여한 스타트업 목록 및 보육 상태(`status`) 연동
*   **운영 심사역 연계**: `program_managers` 조인 테이블 (`program_id`, `manager_id`, `role`) -> 프로그램 책임자 및 운영 담당 심사역 연동
*   **일정 달력 연계**: `program_events` 테이블 -> 프로그램에 할당된 캘린더 스케줄 일정(데모데이, 멘토링데이 등) 연동

### 🏷️ TypeScript Interface: `Program`
```typescript
interface Program {
  // [고유 속성]
  id: string;
  name: string;
  generation: number;
  budget: number;
  startDate: string;
  endDate: string;
  recruitmentDeadline: string;
  description: string;
  deletedAt?: string;
  createdAt: string;
}
```

---

## 7.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **프로그램 상세 개요 정보 뷰**: 지원사업명, 기수 정보, 지원 예산 규모 및 공고 소개문 출력 블록.
*   **프로그램 신규 등록/수정 폼**: 날짜 선택기(Date Picker)를 통한 모집 마감일 및 프로그램 진행 기간 설정 폼 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **프로그램 마일스톤 캘린더 (Connected Calendar)**: `program_events` 데이터를 기반으로 모집 마감일, 데모데이 등의 세부 행사 일정을 주/월 단위 달력(`FullCalendar`)에 연계 렌더링.
*   **운영 심사역 매핑 패널**: `program_managers`를 기반으로 책임자와 운영 담당자를 추가·변경하고 심사역 상세 화면과 상호 이동할 수 있도록 구성.
*   **참여 스타트업 매핑 리스트 테이블**: `program_startups` 조인을 통해 소속된 스타트업 목록을 테이블로 표출하고, 스타트업 추가 검색 모달 및 상태값(심사중, 선정 등) 제어 블록 제공.

---

## 7.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 지원 프로그램 일정 및 매핑 정보 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (프로그램 개설, 일정 등록 및 보육 기업 매핑 가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

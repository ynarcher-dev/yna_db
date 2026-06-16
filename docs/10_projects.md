# 10. 프로젝트 관리 (Projects)

## 10.1 기능 정의 및 목적
* **목적**: 인수합병(M&A) 중개 딜 및 대기업-스타트업 간의 오픈 이노베이션(OI) 매칭 프로젝트를 단계별로 가시화하여 관리합니다.

---

## 10.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `projects`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 프로젝트 고유 식별자 |
| `name` | `varchar(150)` | 프로젝트명 |
| `project_type` | `varchar(30)` | 프로젝트 유형 (m_and_a, open_innovation) |
| `stage` | `varchar(30)` | 진행 단계 (sourcing, register, review, meeting, proposal, contract, completed, canceled) |
| `priority` | `varchar(10)` | 우선순위 (high, medium, low) |
| `start_date` | `date` | 프로젝트 개시일 |
| `end_date` | `date` | 프로젝트 예상 종료일 |
| `description` | `text` | 프로젝트 상세 설명 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **담당 심사역 연계**: `manager_id` (`managers.id` 외래키 참조) -> 담당 심사역 정보 연동
*   **매칭 스타트업 연계**: `project_startups` 조인 테이블 -> 딜에 참여하는 피투자 스타트업(`startups` 테이블) 목록 연동
*   **대기업/협력사 연계**: `project_partners` 조인 테이블 -> M&A 인수 기업 혹은 OI 대기업 협력사(`partners` 테이블) 목록 연동
*   **타임라인 로그 연계**: `project_timelines.project_id` -> 단계가 변동될 때의 변경 전후 단계, 변경자(`changed_by`), 일자 및 비고 로그 연동

### 🏷️ TypeScript Interface: `Project`
```typescript
interface Project {
  // [고유 속성]
  id: string;
  name: string;
  projectType: 'm_and_a' | 'open_innovation';
  stage: 'sourcing' | 'register' | 'review' | 'meeting' | 'proposal' | 'contract' | 'completed' | 'canceled';
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate?: string;
  description: string;
  deletedAt?: string;
  createdAt: string;

  // [연계 데이터]
  managerId: string;
}
```

---

## 10.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **칸반 보드 및 진행 단계 컬럼 (Kanban Board)**: 진행 상태 7개(`sourcing`~`completed`)를 컬럼으로 배치하고, `canceled`는 별도 보관 필터로 제공합니다. 카드 이동 시 프로젝트 단계 변경과 타임라인 기록을 하나의 DB 트랜잭션으로 처리합니다.
*   **프로젝트 기본 개요 카드**: 딜 설명, 투자 유형, 예상 종료일 요약 표시 블록.
*   **프로젝트 생성/정보 수정 폼**: 딜 기본 양식 및 우선순위 설정 폼 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **딜 담당 심사역 및 파트너/스타트업 매핑 패널**: 
  - 프로젝트 상세화면 상단에 담당자(`manager_id`) 연계 표시.
  - 매칭 스타트업 및 대기업 협력사 리스트를 좌우 패널로 배치하고, 매핑 추가/해제 기능 제공.
*   **진척 이력 타임라인 로거 (Connected Timeline)**: `project_timelines` 테이블의 변경 이력을 변경자 정보와 함께 불러와 타임라인 그래픽 컴포넌트로 렌더링합니다. 클라이언트가 타임라인을 별도로 삽입하지 않고 DB 함수 또는 Trigger가 단계 변경과 함께 기록합니다.

---

## 10.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 프로젝트 정보 및 타임라인 이력 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (신규 프로젝트 생성, 파트너/스타트업 매핑 및 칸반 단계 변경 가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

# 23. 사업 및 프로젝트 마일스톤 간트차트 (Gantt Chart Milestone)

## 23.1 기능 정의 및 목적
* **목적**: 기존의 월간 달력 형태(`FullCalendar`)의 마일스톤 캘린더를 실무 협업이 가능한 **간트차트(Gantt Chart) 형태**로 개편합니다. 이는 **사업 관리(Businesses)** 뿐만 아니라 **프로젝트 관리(Projects - M&A, 신사업, 기타)**에도 동일하게 적용됩니다.
* **주요 요건**:
  - 사업 및 프로젝트에 참여 중인 담당 심사역(선수)들에게 개별 테스크를 할당하고 기간 및 진행 상황을 관리합니다.
  - 간트차트의 전체 기간은 **사업/프로젝트의 시작일 ~ 종료일** 범위로 자동 제한되어 렌더링됩니다.
  - 좌측에는 테스크 정보와 담당자(선수) 목록이 포함된 **WBS(Work Breakdown Structure) 테이블**이 위치하며, 우측에는 일정을 한눈에 보는 **타임라인 차트**가 표시됩니다.
  - 테스크 간의 **선후관계(의존성)는 데이터베이스 수준에서 기록할 수 있게 지원하되, 비즈니스 로직이나 UI 단에서 일정을 강제 조정(Cascade Move 등)하지 않고 자율적으로 관리**하도록 유연하게 설계합니다.

---

## 23.2 데이터 모델 요건

### 1) 사업 일정 테이블 확장 (`business_events` 테이블)
기존 `business_events` 테이블을 확장하여 간트차트 및 테스크 관리에 필요한 필드들을 추가합니다.

* **테이블명**: `business_events`
* **추가 및 변경 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `start_date` | `date` | 테스크 시작일 (기존 `event_date` 데이터를 `start_date`로 이관 후 `event_date`는 deprecated 처리 또는 하위 호환 유지) |
| `end_date` | `date` | 테스크 종료일 |
| `manager_id` | `uuid` (FK) | 담당자 ID (`managers.id`, nullable) |
| `progress` | `smallint` | 진행률 (0 ~ 100, 기본값 `0`, `CHECK (progress BETWEEN 0 AND 100)`) |
| `dependencies` | `uuid[]` | 선행 테스크 ID 배열 (선후관계 자율 관리를 위한 메타데이터 보관용, nullable) |

> **선행 조건**: `start_date <= end_date` 제약 조건 추가.

---

### 2) 프로젝트 일정 테이블 신설 (`project_events` 테이블)
프로젝트(M&A, 신사업, 기타) 도메인에도 간트차트 일정을 도입하기 위해 새롭게 일정을 관리할 `project_events` 테이블을 구축합니다.

* **테이블명**: `project_events`
* **스키마 구조**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 프로젝트 일정 고유 식별자 |
| `project_id` | `uuid` (FK) | 대상 프로젝트 ID (`projects.id` REFERENCES, `ON DELETE CASCADE`) |
| `title` | `varchar(150)` | 테스크/마일스톤 명 |
| `event_type` | `varchar(30)` | 일정 유형 (`meeting` 회의, `contract` 계약, `report` 보고, `milestone` 이정표, `other` 기타 등) |
| `start_date` | `date` | 테스크 시작일 |
| `end_date` | `date` | 테스크 종료일 |
| `manager_id` | `uuid` (FK) | 담당자 ID (`managers.id`, nullable) |
| `progress` | `smallint` | 진행률 (0 ~ 100, 기본값 `0`, `CHECK (progress BETWEEN 0 AND 100)`) |
| `dependencies` | `uuid[]` | 선행 테스크 ID 배열 (선후관계 자율 관리를 위한 메타데이터 보관용, nullable) |
| `description` | `text` | 상세 설명 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시 (공통 `set_updated_at` 트리거 적용) |

> **선행 조건**: `start_date <= end_date` 제약 조건 및 대시보드 `system_events`와의 자동 동기화 트리거(`sync_project_event_to_system`) 구현.

---

### 3) TypeScript 인터페이스 추가 및 확장

#### 🧩 `src/types/businessEvent.ts` (사업용)
```typescript
export interface BusinessEvent {
  id: string;
  businessId: string;
  title: string;
  eventType: EventType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  managerId?: string;
  managerName?: string; // 조인 정보
  progress: number; // 0 ~ 100
  dependencies?: string[];
  description: string;
  createdAt: string;
}
```

#### 🧩 `src/types/projectEvent.ts` (프로젝트용)
```typescript
export interface ProjectEvent {
  id: string;
  projectId: string;
  title: string;
  eventType: 'meeting' | 'contract' | 'report' | 'milestone' | 'other';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  managerId?: string;
  managerName?: string; // 조인 정보
  progress: number; // 0 ~ 100
  dependencies?: string[];
  description: string;
  createdAt: string;
}
```

---

## 23.3 화면 기획 요건

### 1) 간트차트 컴포넌트 (`gantt-task-react` 활용)
* **공통 레이아웃 구성**:
  * **좌측 (WBS 테이블)**: 테스크명, 담당자(선수), 진행률(%), 기간(시작일 ~ 종료일)을 표시합니다.
  * **우측 (타임라인 차트)**:
    * 사업/프로젝트의 시작일(`startDate`)과 종료일(`endDate`)을 기준으로 차트 영역의 범위를 제한하여 렌더링합니다.
    * 오늘 일정을 직관적으로 파악할 수 있도록 **현재 시점 세로 점선(Today Line)**을 표시합니다.
    * 담당자(선수)별로 다른 바(Bar) 색상을 지정하거나 테스크 상태에 따라 시각적인 차이를 부여합니다.
* **인터랙션 및 자율 관리**:
  * 마우스 드래그를 통해 테스크의 시작일, 종료일, 진행률을 조절할 수 있습니다.
  * **선후관계 자율성**: `dependencies` 정보가 등록되어 있더라도 다른 테스크의 날짜 이동에 의해 이 테스크의 날짜가 강제 조정되지 않아야 하며, 개별 테스크는 타임라인 상에서 독립적이고 자유롭게 움직일 수 있어야 합니다.

### 2) 프로젝트 상세 페이지 연계 (`ProjectDetailView.tsx`)
* 프로젝트 상세에서 일정을 켜고 끌 수 있는 `calendar` 섹션을 `sections` JSONB 설정에 추가합니다.
  * `sections.calendar ? <ProjectCalendarBlock projectId={project.id} /> : null`
* 테스크 생성 및 수정 시, **담당 선수** 목록은 해당 프로젝트에 배정된 담당자(`project_managers`) 목록에서 바인딩하여 드롭다운 선택창으로 제공합니다.
* 날짜 입력 시 프로젝트 진행 기간(`startDate` ~ `endDate`)을 벗어나지 않도록 DatePicker 범위를 검증 및 차단합니다.

---

## 23.4 권한 및 RLS 정책
* **읽기 (Select)**: 로그인한 인증된 전체 사용자 (`authenticated`)
* **등록/수정/삭제 (Insert/Update/Delete)**:
  * **사업 일정**: 해당 사업에 배정되어 있는 매니저(담당 선수들) 및 `admin` 권한을 가진 사용자.
  * **프로젝트 일정**: 해당 프로젝트에 배정되어 있는 매니저(`project_managers` 담당 선수들) 및 `admin` 권한을 가진 사용자.
  * 각각의 RLS 정책을 명확히 구현하여 소속 담당자 외 임의의 수정/삭제를 차단합니다.

---

## 23.5 구현 가이드 (개발 에이전트 참고용)

1. **DB 마이그레이션**:
   - `supabase/migrations/0063_gantt_milestone_schema.sql` 파일을 생성합니다.
   - `business_events` 테이블 컬럼 추가 및 기존 데이터 마이그레이션 (`event_date` 값을 `start_date`, `end_date`로 안전하게 이전).
   - `project_events` 테이블 신설 및 RLS 정책 생성.
   - `project_events` 생성/변경/삭제 시 대시보드 일정 테이블인 `system_events`에 동기화되는 `sync_project_event_to_system` 함수 및 트리거 작성.
2. **패키지 추가**:
   - `npm i gantt-task-react`
3. **컴포넌트 리팩토링 및 신설**:
   - [BusinessCalendarBlock.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/components/businesses/BusinessCalendarBlock.tsx)를 `gantt-task-react` 기반의 간트차트로 리팩토링합니다.
   - 프로젝트용 간트차트 컴포넌트인 `src/components/projects/ProjectCalendarBlock.tsx`를 신설합니다.
   - 달력 뷰와 간트차트 뷰를 탭(`Tabs`)으로 전환하여 볼 수 있도록 두 컴포넌트 모두 구조를 개선하여 유연성을 강화하는 것을 강력하게 권장합니다.
4. **API 연동 및 훅**:
   - `useProjectEvents` 및 관련 CRUD 훅(API 연동)을 작성합니다.
   - 프로젝트 상세 조회(`useProject`) 시 `sections.calendar` 필드가 반환되고, 폼을 통해 관리될 수 있도록 수정합니다.

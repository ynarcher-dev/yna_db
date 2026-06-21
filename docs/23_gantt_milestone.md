# 23. 사업 마일스톤 간트차트 (Gantt Chart Milestone)

## 23.1 기능 정의 및 목적
* **목적**: 기존의 월간 달력 형태(`FullCalendar`)의 마일스톤 캘린더를 실무 협업이 가능한 **간트차트(Gantt Chart) 형태**로 개편합니다.
* **주요 요건**:
  - 사업에 참여 중인 담당 심사역(선수)들에게 개별 테스크를 할당하고 기간 및 진행 상황을 관리합니다.
  - 간트차트의 전체 기간은 **사업 시작일 ~ 사업 종료일** 범위로 자동 제한되어 렌더링됩니다.
  - 좌측에는 테스크 정보와 담당자(선수) 목록이 포함된 **WBS(Work Breakdown Structure) 테이블**이 위치하며, 우측에는 일정을 한눈에 보는 **타임라인 차트**가 표시됩니다.
  - 테스크 간의 **선후관계(의존성)는 데이터베이스 수준에서 기록할 수 있게 지원하되, 비즈니스 로직이나 UI 단에서 일정을 강제 조정(Cascade Move 등)하지 않고 자율적으로 관리**하도록 유연하게 설계합니다.

---

## 23.2 데이터 모델 요건

기존 `business_events` 테이블을 확장하여 간트차트 및 테스크 관리에 필요한 필드들을 추가합니다.

### 1) DB 스키마 수정 (`business_events` 테이블 확장)
* **테이블명**: `business_events` (또는 하위 호환성을 유지하며 컬럼을 추가합니다)
* **추가 및 변경 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `start_date` | `date` | 테스크 시작일 (기존 `event_date` 데이터를 `start_date`로 이관 후 `event_date`는 deprecated 처리 또는 하위 호환 유지) |
| `end_date` | `date` | 테스크 종료일 |
| `manager_id` | `uuid` (FK) | 담당자 ID (`managers.id`, nullable) |
| `progress` | `smallint` | 진행률 (0 ~ 100, 기본값 `0`, `CHECK (progress BETWEEN 0 AND 100)`) |
| `dependencies` | `uuid[]` | 선행 테스크 ID 배열 (선후관계 자율 관리를 위한 메타데이터 보관용, nullable) |

> **선행 조건**: `start_date <= end_date` 제약 조건 추가.

### 2) TypeScript 인터페이스 확장 (`src/types/businessEvent.ts`)

```typescript
export interface BusinessEvent {
  id: string;
  businessId: string;
  title: string;
  eventType: EventType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  managerId?: string; // 담당 매니저 ID
  managerName?: string; // 담당 매니저 이름 (조인 정보)
  progress: number; // 0 ~ 100
  dependencies?: string[]; // 선행 테스크 ID 목록
  description: string;
  createdAt: string;
}
```

---

## 23.3 화면 기획 요건

### 1) 간트차트 컴포넌트 구현
* **선택 라이브러리**: **`gantt-task-react`** 라이브러리를 사용하여 구현합니다.
  * Ant Design의 UI 스타일 가이드(Harmonious HSL 색상 테마)에 맞추어 스타일 커스터마이징을 수행합니다.
* **레이아웃 구성**:
  * **좌측 (WBS 테이블)**: 테스크명, 담당자(선수), 진행률(%), 기간(시작일 ~ 종료일)을 표시합니다.
  * **우측 (타임라인 차트)**:
    * 사업의 시작일(`business.startDate`)과 종료일(`business.endDate`)을 기준으로 차트 영역의 범위를 제한하여 렌더링합니다.
    * 오늘 일정을 직관적으로 파악할 수 있도록 **현재 시점 세로 점선(Today Line)**을 표시합니다.
    * 담당자(선수)별로 다른 바(Bar) 색상을 지정하거나 테스크 상태에 따라 시각적인 차이를 부여합니다.
* **인터랙션 및 자율 관리**:
  * 마우스 드래그를 통해 테스크의 시작일, 종료일, 진행률을 조절할 수 있습니다.
  * **선후관계 자율성**: `dependencies` 정보가 등록되어 있더라도 다른 테스크의 날짜 이동에 의해 이 테스크의 날짜가 강제 조정되지 않아야 하며, 개별 테스크는 타임라인 상에서 독립적이고 자유롭게 움직일 수 있어야 합니다.

### 2) 테스크 등록/수정 팝업 폼 (Drawer)
* 테스크 생성 및 수정 시, 다음 입력 항목을 제공합니다:
  * **테스크 명** 및 **설명**
  * **기간**: 데이트 피커(DatePicker.RangePicker)를 사용하여 시작일과 종료일을 지정합니다. (사업 진행 기간을 초과할 수 없도록 제한 적용)
  * **담당 선수**: 사업 매니저 목록(`business_managers`)에서 조인된 담당자 목록을 드롭다운 선택창으로 제공합니다.
  * **선행 테스크 (의존성)**: 현재 등록된 다른 테스크 목록을 다중 선택(`Select mode="multiple"`)하여 지정할 수 있는 옵션 필드를 제공하되, 화면상의 강제 제약은 두지 않습니다.
  * **진행 상태 및 진행률**: `Slider`나 `InputNumber`를 통해 진행률을 0% ~ 100% 범위로 지정합니다.

---

## 23.4 권한 및 RLS 정책
* **읽기 (Select)**: 로그인한 인증된 전체 사용자 (`authenticated`)
* **등록/수정/삭제 (Insert/Update/Delete)**:
  * 해당 사업에 배정되어 있는 매니저(담당 선수들) 및 `admin` 권한을 가진 사용자만 테스크를 생성, 변경 및 삭제할 수 있도록 RLS 정책 및 프론트엔드 예외 처리를 적용합니다.

---

## 23.5 구현 가이드 (개발 에이전트 참고용)

1. **DB 마이그레이션**:
   - `supabase/migrations/` 경로에 신규 SQL 마이그레이션 파일(예: `0063_business_events_gantt.sql`)을 생성하여 기존 `business_events` 테이블에 필요한 컬럼(`start_date`, `end_date`, `manager_id`, `progress`, `dependencies`)을 추가하고 제약조건(`CHECK`)을 설정합니다.
   - 기존의 `event_date`에 저장되어 있던 일정을 신규 `start_date` 및 `end_date`로 안전하게 복사하는 마이그레이션 로직을 작성합니다.
2. **패키지 추가**:
   - `gantt-task-react` 라이브러리를 추가 설치합니다. (`npm i gantt-task-react`)
3. **컴포넌트 리팩토링**:
   - 기존 [BusinessCalendarBlock.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/components/businesses/BusinessCalendarBlock.tsx)를 백업하거나 해당 컴포넌트 내부의 FullCalendar를 `gantt-task-react` 컴포넌트로 개편합니다.
   - 혹은 달력 뷰와 간트차트 뷰를 탭(`Tabs`)으로 전환하여 볼 수 있도록 구조를 개선하여 유연성을 강화하는 것을 추천합니다.
4. **API 연동**:
   - `useBusinessEvents` 훅 및 mutations 훅을 수정된 데이터 모델에 맞춰 갱신합니다.

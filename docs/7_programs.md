# 7. 프로그램 관리 (Programs)

## 7.1 기능 정의 및 목적
* **목적**: 기수별 액셀러레이팅(AC) 배치 프로그램 및 정부 지원 사업의 공고, 모집 일정, 지원 예산과 행사를 체계적으로 관리합니다.

> **구현 메모(2026-06-17)**: 담당자는 **책임자(등록자, `created_by`) + 운영 심사역(다대다 `program_managers`, 역할 운영총괄/운영담당) + 관리자** 모델. 삭제(소프트) = 책임자 + 관리자. 일정은 FullCalendar 월간 뷰로 표시하며 등록/수정/삭제 시 `system_events`(대시보드 다가오는 일정)로 자동 동기화된다.

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
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김(운영심사역·참여스타트업·캘린더·첨부) |
| `created_by` | `uuid` | **책임자**(등록자, `managers.id`). 등록 시 `auth.uid()` 자동. 삭제 권한 게이트 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시(트리거 자동 갱신) |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **참여 스타트업 연계**: `program_startups` 조인 (`program_id`, `startup_id`, `status`) -> 참여 스타트업 + 보육 상태(지원/심사중/선정/수료/중도탈락). 상세에서 상태 인라인 변경.
*   **운영 심사역 연계(다대다)**: `program_managers` 조인 (`program_id`, `manager_id`, `role`) -> 운영 심사역 여러 명 + 역할(**lead=운영총괄 / operator=운영담당**). 책임자(`created_by`)와 별개.
*   **참여 협력사 연계**: `program_partners` 조인 (`program_id`, `partner_id`, 0046) -> 프로그램에 참여/연동된 협력 기관. 프로그램 상세 '참여 협력사' 패널(정방향, 협력사 목록 동일 표)에서 연결/해제. 협력사 상세에는 '참여 프로그램 (연동)'(역방향)으로 노출.
*   **일정 달력 연계**: `program_events` -> 프로그램 세부 일정. **0003 동기화 트리거로 `system_events`(대시보드 일정) 자동 갱신.**
*   **역방향 노출**: 참여 스타트업/운영 심사역/참여 협력사는 각자 상세(스타트업·심사역·협력사)의 역방향 패널에서도 이 프로그램으로 링크된다(양방향).

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
  recruitmentDeadline: string;   // 없으면 ''
  description: string;
  sections: ProgramSections;     // 카드 섹션 표시/숨김
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  // [연계 데이터]
  createdById: string;           // 책임자(created_by) — 삭제 권한 게이트
  authorName: string;            // 책임자 이름
  managerNames: string[];        // 운영 심사역(다대다) 이름 목록(목록 표시용)
}
```

---

## 7.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **프로그램 상세 개요 정보 뷰**: 지원사업명, 기수 정보, 지원 예산 규모 및 공고 소개문 출력 블록.
*   **프로그램 신규 등록/수정 폼**: 날짜 선택기(Date Picker)를 통한 모집 마감일 및 프로그램 진행 기간 설정 폼 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **마일스톤 캘린더 (`ProgramCalendarBlock`)**: `program_events`를 **FullCalendar 월간 뷰**(dayGridMonth)로 렌더. 이벤트 클릭→수정, '일정 추가' 버튼→신규 등록(`@fullcalendar/interaction` 미설치라 날짜 클릭 추가는 미사용). 유형별 색상 범례 표시. 저장/삭제 시 대시보드 일정 자동 동기화.
*   **운영 심사역 매핑 패널 (`ProgramManagersPanel`)**: `program_managers` 다대다. **심사역 목록과 동일한 표 형태**(`managerColumns`) + **운영 역할**(운영총괄/운영담당, 인라인 변경, 시스템 역할 컬럼과 구분)·연동 해제, 심사역 상세로 링크. (정방향이라 테두리 강조 없음)
*   **참여 스타트업 매핑 패널 (`ProgramStartupsPanel`)**: `program_startups` 테이블. **스타트업 목록과 동일한 표 형태**(`startupColumns`) + 보육 상태 인라인 변경·연동 해제 + 스타트업 추가(Select) + 스타트업 상세로 링크.
*   **참여 협력사 매핑 패널 (`ProgramPartnersPanel`)**: `program_partners` 테이블(0046). 협력사 목록과 동일한 표 + 협력사 추가(Select)·연동 해제 + 협력사 상세로 링크. (정방향이라 테두리 강조 없음)

> **카드 섹션 표시/숨김(공통 규약)**: 위 보조 카드 섹션(마일스톤 캘린더·심사역 매핑·참여 스타트업 등)은 등록·기본 수정 폼의 토글로 표시/숨김할 수 있어야 합니다. 상세 구현 시 [17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장을 따라 `lib/programSections.ts` + `sections` jsonb 컬럼 + 폼 토글 + 상세 조건 렌더를 포함합니다(프로필/개요 카드는 항상 표시). 또한 전 도메인 공통 **첨부파일 카드**(`EntityFilesBlock`, [PATTERNS.md](PATTERNS.md) 16장)를 상세에 포함하고 `attachments` 섹션 키로 토글합니다.

---

## 7.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 프로그램 일정 및 매핑 정보 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager 공통 (프로그램 개설, 일정 등록, 운영 심사역·참여 스타트업 매핑)
* **삭제 (Delete, 소프트)**: **책임자(`created_by` 본인) + 관리자(Admin)** — 프로젝트와 동일 모델로 통일(`programs_update_staff` WITH CHECK + 화면 버튼 게이트).
* **하위 조인 쓰기**(`program_managers`·`program_startups`·`program_events`): 조회=전 직원, 추가/변경/해제=전 직원(Admin·Manager). (`0044`)

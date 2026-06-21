# 7. 사업 관리 (Businesses)

## 7.1 기능 정의 및 목적
* **목적**: 기수별 액셀러레이팅(AC) 배치 사업 및 정부 지원 사업의 진행 상태, 매출·이익, 운영 담당자, 참여 스타트업/협력사, 마일스톤 일정을 체계적으로 관리합니다.

> **구현 메모(2026-06-21)**: 담당자는 **책임자(등록자, `created_by`) + 운영 심사역(다대다 `business_managers`, 역할 운영총괄/운영담당) + 관리자** 모델. 단, 책임자가 담당자에 자동 편입되는 규칙은 [0054_remove_author_as_manager.sql](../supabase/migrations/0054_remove_author_as_manager.sql)로 폐지되어 담당자는 자유롭게 추가/해제한다. 삭제(소프트) = 책임자 + 관리자. 일정은 마일스톤 간트차트/캘린더 블록으로 표시하며 등록/수정/삭제 시 `system_events`(대시보드 다가오는 일정)로 자동 동기화된다.

> **명칭 변경(2026-06-21)**: 도메인 명칭을 **"프로그램 관리" → "사업 관리"**(영문 식별자 `program*` → `business*`)로 전면 통일했다. 물리 테이블·컬럼·정책·트리거·함수 + 저장 데이터 값(`system_events.source_type`·`uploaded_files.entity_type`='program'→'business', 집계키 `activePrograms`→`activeBusinesses`)까지 [0055_rename_programs_to_business.sql](../supabase/migrations/0055_rename_programs_to_business.sql)로 마이그레이션. 과거 마이그레이션(0001~0054)은 forward-only 원칙으로 옛 명칭을 그대로 유지한다.

---

## 7.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `businesses`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 사업 고유 식별자 |
| `name` | `varchar(150)` | 사업명 |
| `generation` | `integer` | 기수 (예: 1, 2, 3) |
| `classification` | `varchar(20)` | 사업 구분 (`public` 공공, `private` 민간, `sales` 매출) |
| `status` | `varchar(30)` | 진행 상태 (`pending`, `in_progress`, `completed`, `suspended`, `canceled`) |
| `revenue` | `numeric(15, 2)` | 매출 |
| `profit` | `numeric(15, 2)` | 이익(손실이면 음수 가능) |
| `start_date` | `date` | 사업 시작일 |
| `end_date` | `date` | 사업 종료일 |
| `description` | `text` | 사업 상세 설명 |
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김(운영심사역·참여스타트업·캘린더·첨부) |
| `created_by` | `uuid` | **책임자**(등록자, `managers.id`). 등록 시 `auth.uid()` 자동. 삭제 권한 게이트 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시(트리거 자동 갱신) |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **참여 스타트업 연계**: `business_startups` 조인 (`business_id`, `startup_id`, `status`) -> 참여 스타트업 + 보육 상태(지원/심사중/선정/수료/중도탈락). 상세에서 상태 인라인 변경.
*   **운영 심사역 연계(다대다)**: `business_managers` 조인 (`business_id`, `manager_id`, `role`) -> 운영 심사역 여러 명 + 역할(**lead=운영총괄 / operator=운영담당**). 책임자(`created_by`)와 별개.
*   **참여 협력사 연계**: `business_partners` 조인 (`business_id`, `partner_id`, 0046) -> 사업에 참여/연동된 협력 기관. 사업 상세 '참여 협력사' 패널(정방향, 협력사 목록 동일 표)에서 연결/해제. 협력사 상세에는 '참여 사업 (연동)'(역방향)으로 노출.
*   **마일스톤 일정 연계**: `business_events` -> 사업 세부 테스크/일정. [0063_gantt_milestone_schema.sql](../supabase/migrations/0063_gantt_milestone_schema.sql) 기준으로 시작/종료일, 진행 상태, 수동 정렬, 복수 담당자, URL, 테스크 첨부를 지원하며 `system_events`(대시보드 일정)를 자동 갱신한다.
*   **역방향 노출**: 참여 스타트업/운영 심사역/참여 협력사는 각자 상세(스타트업·심사역·협력사)의 역방향 패널에서도 이 사업으로 링크된다(양방향).

### 🏷️ TypeScript Interface: `Business`
```typescript
interface Business {
  // [고유 속성]
  id: string;
  name: string;
  generation: number;
  classification: 'public' | 'private' | 'sales';
  status: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'canceled';
  revenue: number;
  profit: number;
  startDate: string;
  endDate: string;
  description: string;
  sections: BusinessSections;     // 카드 섹션 표시/숨김
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
*   **사업 상세 개요 정보 뷰**: 사업명, 구분, 기수, 매출, 이익, 진행 기간, 책임자, 등록/수정일, 설명을 출력합니다.
*   **사업 신규 등록/수정 폼**: 사업명, 구분, 진행 상태, 기수, 매출, 이익, 사업 진행 기간, 설명, 상세 섹션 표시/숨김을 입력합니다. 과거 예산(`budget`)·모집마감(`recruitment_deadline`)은 UI에서 사용하지 않습니다.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **마일스톤 블록 (`BusinessCalendarBlock`)**: `business_events`를 간트차트/일정 관리 UI로 렌더. 테스크 추가·수정, 바 드래그 일정 이동, 상태 변경, 수동 정렬, 복수 담당자, URL/첨부 연계를 지원합니다. 저장/삭제 시 대시보드 일정 자동 동기화.
*   **운영 심사역 매핑 패널 (`EntityManagersPanel kind="business"`)**: `business_managers` 다대다. **심사역 목록과 동일한 표 형태**(`managerColumns`) + **운영 역할**(운영총괄/운영담당, 인라인 변경, 시스템 역할 컬럼과 구분) + 참여율/투입기간(0062) + 연동 해제, 심사역 상세로 링크.
*   **참여 스타트업 매핑 패널 (`BusinessStartupsPanel`)**: `business_startups` 테이블. **스타트업 목록과 동일한 표 형태**(`startupColumns`) + 보육 상태 인라인 변경·연동 해제 + 스타트업 추가(Select) + 스타트업 상세로 링크.
*   **참여 협력사 매핑 패널 (`BusinessPartnersPanel`)**: `business_partners` 테이블(0046). 협력사 목록과 동일한 표 + 협력사 추가(Select)·연동 해제 + 협력사 상세로 링크. (정방향이라 테두리 강조 없음)

> **카드 섹션 표시/숨김(공통 규약)**: 위 보조 카드 섹션(마일스톤 캘린더·심사역 매핑·참여 스타트업 등)은 등록·기본 수정 폼의 토글로 표시/숨김할 수 있어야 합니다. 상세 구현 시 [17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장을 따라 `lib/businessSections.ts` + `sections` jsonb 컬럼 + 폼 토글 + 상세 조건 렌더를 포함합니다(프로필/개요 카드는 항상 표시). 또한 전 도메인 공통 **첨부파일 카드**(`EntityFilesBlock`, [PATTERNS.md](PATTERNS.md) 16장)를 상세에 포함하고 `attachments` 섹션 키로 토글합니다.

---

## 7.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 사업 일정 및 매핑 정보 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager 공통 (사업 개설, 일정 등록, 운영 심사역·참여 스타트업 매핑)
* **삭제 (Delete, 소프트)**: **책임자(`created_by` 본인) + 관리자(Admin)** — 프로젝트와 동일 모델로 통일(`businesses_update_staff` WITH CHECK + 화면 버튼 게이트).
* **하위 조인 쓰기**(`business_managers`·`business_startups`·`business_events`): 조회=전 직원, 추가/변경/해제=전 직원(Admin·Manager). (`0044`)

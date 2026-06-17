# 10. 프로젝트 관리 (Projects)

## 10.1 기능 정의 및 목적
* **목적**: 인수합병(M&A) 중개 딜, 신사업, 기타 매칭 프로젝트를 진행 상태별로 관리합니다.

> **개편 이력(발주자 요청, 2026-06-17)**: 초기 기획의 8단계 딜 파이프라인·칸반 보드는 폐기되었습니다. 진행은 **단순 상태값**(대기/진행중/완료/중단/취소)으로 관리하며, 유형은 **M&A·신사업·기타(자유입력)**로 정리했습니다. 담당자는 **책임자(등록자) + 담당자(다대다) + 관리자** 모델을 따릅니다.

---

## 10.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `projects`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 프로젝트 고유 식별자 |
| `name` | `varchar(150)` | 프로젝트명 |
| `project_type` | `varchar(30)` | 프로젝트 유형 (`m_and_a`, `new_business`, `other`) |
| `project_type_etc` | `varchar(50)` | 유형이 `other`(기타)일 때의 자유 입력값. 그 외엔 NULL |
| `stage` | `varchar(30)` | 진행 상태 (`pending`, `in_progress`, `completed`, `suspended`, `canceled`). 기본 `pending` |
| `priority` | `varchar(10)` | 우선순위 (high, medium, low) |
| `start_date` | `date` | 프로젝트 개시일 |
| `end_date` | `date` | 프로젝트 예상 종료일 |
| `description` | `text` | 프로젝트 상세 설명 |
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김 토글 맵(담당자·매칭 스타트업·협력사·첨부파일) |
| `created_by` | `uuid` | **책임자**(등록자, `managers.id`). 등록 시 `auth.uid()` 자동 기록. 삭제 권한 게이트 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시(트리거 자동 갱신) |

> **참고**: 초기 스키마의 단수 `manager_id` 컬럼은 다대다 담당자(`project_managers`)로 대체되어 앱에서 사용하지 않습니다(컬럼은 잔존).

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **담당자(다대다) 연계**: `project_managers` 조인 테이블 -> 한 프로젝트에 **담당 심사역 여러 명** 배정(`managers` 테이블). 책임자(`created_by`)와 별개.
*   **매칭 스타트업 연계**: `project_startups` 조인 테이블 -> 딜에 참여하는 피투자 스타트업(`startups` 테이블) 목록 연동
*   **대기업/협력사 연계**: `project_partners` 조인 테이블 -> M&A 인수 기업 혹은 협력 대기업(`partners` 테이블) 목록 연동
*   **(보류) 타임라인 로그**: `project_timelines`(0001) + 상태변경 감사 트리거는 잔존하나, 단순 상태값 개편으로 **현재 화면에는 노출하지 않음**(추후 상태 변경 이력 UI가 필요하면 재활용).

### 🏷️ TypeScript Interface: `Project`
```typescript
interface Project {
  // [고유 속성]
  id: string;
  name: string;
  projectType: 'm_and_a' | 'new_business' | 'other';
  projectTypeEtc: string;       // 기타일 때 자유 입력값, 그 외 ''
  stage: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'canceled';
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate: string;              // 없으면 ''
  description: string;
  sections: ProjectSections;    // 카드 섹션 표시/숨김
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  // [연계 데이터]
  createdById: string;          // 책임자(created_by) — 삭제 권한 게이트
  authorName: string;           // 책임자 이름
  managerNames: string[];       // 담당자(다대다) 이름 목록(목록 표시용)
}
```

---

## 10.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **목록 (List)**: 검색(프로젝트명) · 필터(유형·진행상태·우선순위) · 정렬 · 페이지네이션을 URL 상태로 직렬화. 공통 메타 컬럼(No./책임자/등록일/수정일/관리) + 담당자 컬럼. (※ **칸반 보드는 폐기** — 단순 상태값으로 관리하므로 드래그앤드롭 파이프라인 불필요.)
*   **프로젝트 기본 개요 카드**: 프로젝트명 + 유형 배지(기타면 자유 입력값 표시) + 진행상태 배지 + 우선순위 배지 + 개시일/예상 종료일/책임자/등록·수정일 + 설명.
*   **프로젝트 생성/정보 수정 폼 (Drawer)**: 프로젝트명·유형(기타 선택 시 자유 입력칸)·우선순위·진행상태·개시일·종료일·설명 + 섹션 표시/숨김 토글.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **담당자(다대다) 배정 패널**: 상세에서 담당 심사역을 여러 명 배정/해제(태그 + Select). 책임자(등록자)와 별개. 공통 컴포넌트 `EntityManagersPanel`(kind='project') 재사용.
*   **매칭 스타트업 / 대기업·협력사 매핑 패널**: 좌우 2열 배치, 매핑 추가/해제. 공통 `ProjectLinksPanel`(kind='startup'|'partner').
*   **첨부파일 카드**: 전 도메인 공통 `EntityFilesBlock`(entityType='project').

> **카드 섹션 표시/숨김(공통 규약)**: 프로젝트 **상세 화면**의 보조 카드 섹션(담당자·매칭 스타트업·대기업/협력사·첨부파일)은 등록·기본 수정 폼의 토글로 표시/숨김합니다([17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장). `lib/projectSections.ts`(keys: `managers`·`startups`·`partners`·`attachments`) + `sections` jsonb 컬럼 + 폼 토글 + 상세 조건 렌더. 기본 개요 카드는 항상 표시. 첨부파일은 `attachments` 키로 토글([PATTERNS.md](PATTERNS.md) 16장).

---

## 10.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 프로젝트 정보 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager 전원 공통 (신규 프로젝트 생성, 담당자·스타트업·협력사 매핑, 상태 변경 가능)
* **삭제 (Delete, 소프트)**: **책임자(`created_by` 본인) + 관리자(Admin)**. 일반 심사역은 본인이 등록(책임자)한 프로젝트만 삭제 가능. RLS(`projects_update_staff` WITH CHECK)와 화면 버튼 양쪽에서 게이트.
* **담당자/매핑 조인(`project_managers`·`project_startups`·`project_partners`)**: 조회=전 직원, 배정 추가/해제(INSERT/DELETE)=전 직원(Admin·Manager).

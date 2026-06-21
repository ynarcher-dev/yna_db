# 21. 매칭 프로그램 관리 (Matching Programs)

## 21.1 기능 정의 및 목적
* **목적**: TIPS, LIPS 등 정부 및 기관 주관의 스타트업 지원사업 매칭 프로그램의 운영 현황을 등록하고, 이에 매칭된(신청 또는 선정된) 스타트업 및 추천 심사역, 진행 상태를 체계적으로 관리하고 모니터링합니다.

---

## 21.2 데이터 모델 요건

### 1) 매칭 프로그램 (Inherent Fields)
*   **테이블명**: `matching_programs`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 프로그램 고유 식별자 |
| `name` | `varchar(150)` | 프로그램명 (예: 2026 TIPS, LIPS 등) |
| `agency` | `varchar(100)` | 주관/지원 기관 (예: 중소벤처기업부, 한국엔젤투자협회 등) |
| `year` | `integer` | 시행 연도 |
| `budget` | `numeric(15, 2)` | 지원 한도/매칭 예산 규모 |
| `status` | `varchar(30)` | 프로그램 상태 (`active` 모집중/진행중, `closed` 마감) |
| `description` | `text` | 상세 요건 및 소개 |
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김 맵 (`applications`·`attachments`, 17_conventions 7장) |
| `created_by` | `uuid` | 등록자/책임자 (`managers.id`, `DEFAULT auth.uid()`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시 (공통 `set_updated_at` 트리거) |

> **첨부파일 연계**: 프로그램 상세에도 전 도메인 공통 첨부 카드(`EntityFilesBlock` + `uploaded_files` 폴리모픽, `entity_type='matching_program'`)를 둡니다([PATTERNS.md](PATTERNS.md) 16장). `sections.attachments` 토글로 표시/숨김.

### 2) 매칭 신청/연계 관리 (Matching Applications)
*   **테이블명**: `matching_applications`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 매칭 이력 고유 식별자 |
| `program_id` | `uuid` (FK) | 매칭 프로그램 ID (`matching_programs.id`) |
| `startup_id` | `uuid` (FK) | 연계 대상 스타트업 ID (`startups.id`) |
| `manager_id` | `uuid` (FK) | 추천/담당 심사역 ID (`managers.id`) |
| `status` | `varchar(30)` | 추천/진행 상태 (`applied` 신청완료, `recommended` 추천완료, `selected` 최종선정, `rejected` 탈락) |
| `apply_date` | `date` | 신청일 |
| `selection_date`| `date` | 선정일 (선정 시 입력) |
| `matching_amount`| `numeric(15, 2)` | 최종 매칭 지원금 규모 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시 |

### 🏷️ TypeScript Interface: `MatchingProgram`
```typescript
interface MatchingProgram {
  id: string;
  name: string;
  agency: string;
  year: number;
  budget: number;
  status: 'active' | 'closed';
  description?: string;
  authorName: string; // created_by 임베드 이름 (책임자)
  sections: { applications: boolean; attachments: boolean }; // 상세 카드 표시/숨김
  createdAt: string;
  updatedAt: string;
}

interface MatchingApplication {
  id: string;
  programId: string;
  startupId: string;
  startupName: string; // 조인 정보
  managerId: string;
  managerName: string; // 조인 정보
  status: 'applied' | 'recommended' | 'selected' | 'rejected';
  applyDate: string;
  selectionDate?: string;
  matchingAmount?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 21.3 화면 기획 요건

### 1) 매칭 프로그램 목록 및 상세
* **프로그램 현황 카드**: 모집 상태, 주관 기관, 매칭 예산 규모, 올해 선정된 스타트업 수 등을 요약하여 목록 및 상세 헤더에 노출합니다.
* **프로그램 신규 생성 및 수정 폼**: 모집 상태, 주관 기관, 시행 연도, 지원 요건 기술 등 설정이 가능해야 합니다.

### 2) 매칭 연계 리스트 (Detail Area)
* **신청/매칭 스타트업 목록 및 관리 패널**: 해당 프로그램의 상세 페이지 하단에 배치하며, 신청한 스타트업 목록과 진행 상태(추천/선정/탈락 등)를 테이블로 표출합니다.
* **스타트업 매칭 팝업 폼**: 목록에 스타트업을 신규 추천/매칭하여 올리기 위한 모달 팝업으로, 스타트업 검색 + 담당 심사역 선택 + 신청 일자 및 진행 상태 지정 기능이 제공됩니다.

---

## 21.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: 전 임직원 (전체 매칭 현황 및 신청 이력 조회 가능)
* **작성 및 수정 (Create/Update)**:
  - 프로그램 정보 등록/수정: Admin / Manager (담당 부서 관리자)
  - 스타트업 매칭 신청 등록 및 진행 상태 변경: Admin / Manager (담당 심사역)
* **삭제 (Delete)**: Admin (소프트 딜리트 처리)

---

## 21.5 구현 메모 (코드 확정)

부모(매칭 프로그램) CRUD + 신청/연계 매핑 패널 구조로, 사업(businesses) + 참여 스타트업 패턴을 복제한다.

* **라우팅**: `/matching-programs`(목록) · `/matching-programs/:id`(상세). 메뉴=투자관리 그룹 '매칭 프로그램 관리'.
* **목록**: 검색(프로그램명·기관) + 상태(`active`/`closed`) `Select` 필터 + 정렬·페이지네이션. 메타 5컬럼 공통, 고유 컬럼은 [listColumns.tsx](../src/lib/listColumns.tsx) `matchingProgramColumns`.
* **상세**: 프로그램 현황 카드(상태 배지·기관·연도·매칭 예산·**선정 스타트업 수**=신청 중 `selected` 집계) + **매칭 신청/연계 패널** + 첨부파일.
* **매칭 신청/연계(`matching_applications`)**: 한 프로그램에 `(startup × manager × status × 신청일/선정일/매칭 지원금)`. `(program_id, startup_id)` UNIQUE. 신규 추천/매칭은 **팝업 폼(Modal)**(스타트업 검색 + 담당 심사역 + 신청일 + 상태 + 선택 선정일·매칭 지원금), 진행 상태는 표에서 인라인 변경, 행 수정/연동 해제. 스타트업·심사역과 연결되는 **연동 카드**(섹션명 옆 `(연동)` 라벨, PATTERNS 18.1).
* **배지 톤**: 프로그램 상태 `active`=green(모집중)·`closed`=blue(마감). 신청 상태 `selected`=green·나머지(`applied`/`recommended`/`rejected`)=gold([labels.ts](../src/lib/labels.ts), 17_conventions 8장).
* **마이그레이션**: [0057_matching_programs.sql](../supabase/migrations/0057_matching_programs.sql) — 두 테이블(sections·메타 포함)·RLS. 프로그램 삭제=Admin(`WITH CHECK`로 Manager의 `deleted_at` 설정 차단), 신청 추가/수정/해제=전 직원.

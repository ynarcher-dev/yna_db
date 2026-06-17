# 12. 협력사 관리 (Partners)

## 12.1 기능 정의 및 목적
* **목적**: 대외 네트워크 기관(지자체, 대학 등) 및 협력 기업 정보를 관리하고 M&A나 오픈 이노베이션 프로젝트 기여도를 파악합니다.

---

## 12.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `partners`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 협력사 고유 식별자 |
| `name` | `varchar(150)` | 기업/기관명 |
| `partner_type` | `varchar(30)` | 협력사 유형 (government, university, vc, corporation, partner) |
| `contact_person` | `varchar(50)` | 담당자 이름 |
| `phone` | `varchar(20)` | 연락처 |
| `email` | `varchar(100)` | 담당자 이메일 |
| `interaction_log` | `jsonb` | 교류 협력 이력 로그 리스트 (`[{ "date": "2026-06-15", "content": "MOU 체결" }]`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **협력 프로젝트 연계**: `project_partners` 조인 테이블 (`partner_id`, `project_id` 참조) -> 특정 협력사가 참여한 M&A 또는 오픈 이노베이션 프로젝트(`projects` 테이블) 정보 연동. 협력사 상세에서 **편집형 역방향 패널**(연결·신규생성·연동해제, 프로젝트 목록 동일 표).
*   **협력 프로그램 연계**: `program_partners` 조인 테이블 (`partner_id`, `program_id` 참조, 0046) -> 협력 기관이 참여/연동된 프로그램(배치 사업) 연동. **양방향 편집**: 프로그램 상세 '참여 협력사'(정방향) + 협력사 상세 '참여 프로그램 (연동)'(역방향).

### 🏷️ TypeScript Interface: `Partner`
```typescript
interface Partner {
  // [고유 속성]
  id: string;
  name: string;
  partnerType: 'government' | 'university' | 'vc' | 'corporation' | 'partner';
  contactPerson: string;
  phone: string;
  email: string;
  interactionLog: { date: string; content: string }[];
  deletedAt?: string;
  createdAt: string;
}
```

---

## 12.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **협력사 프로필 상세 카드 (목록/상세)**: 기업명, 협력 유형 배지, 대표 이메일 및 담당자 연락처 출력 블록.
*   **교류 협력 히스토리 대화 일지**: `interaction_log`에 기록된 일자별 협력 교류 내역(예: MOU 체결, 사업 협의 완료 등)을 세로형 리스트뷰 형태로 타임라인화한 블록.
*   **협력사 등록/정보 수정 폼**: 신규 파트너사 정보 및 담당자 연락처, 교류 로그 추가 입력 에디터.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **공동 참여 프로젝트 리스트 테이블**: `project_partners` 조인을 활용해 해당 협력 파트너가 공동으로 참여하거나 서포트했던 M&A 딜 및 오픈 이노베이션 프로젝트 목록을 테이블로 연동 렌더링 (클릭 시 해당 프로젝트 칸반/상세 페이지로 이동 가능).

---

## 12.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 협력사 목록 및 상세 프로필, 교류 현황 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (협력사 정보 등록 및 교류 협력 이력 작성 가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

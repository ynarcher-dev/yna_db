# 5. 심사역 관리 (Managers)

## 5.1 기능 정의 및 목적
* **목적**: 사내 투자 심사역 및 프로젝트 담당자의 상세 프로필, 전문 분야, 그리고 성과를 기록하고 관리합니다.

---

## 5.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `managers`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 심사역 고유 식별자 |
| `name` | `varchar(50)` | 이름 |
| `position` | `varchar(50)` | 직급 (예: 대표, 파트너, 수석심사역, 심사역) |
| `role` | `app_role` | 시스템 권한 역할 (`admin`, `manager`) |
| `profile_image_url`| `text` | 프로필 이미지 S3 경로 |
| `specialties` | `text[]` | 전문 분야 태그 배열 |
| `biography` | `jsonb` | 약력 상세 정보 (학력, 경력, 자격증, 수상 이력 등) |
| `greeting` | `text` | 소개 (홈페이지 노출용) |
| `phone` | `varchar(20)` | 연락처 |
| `email` | `varchar(100)` | 이메일 |
| `team_id` | `uuid` | **소속 팀**(`teams.id`, `0052`). 비면 소속 팀 없음. 변경 시 그 팀의 그룹으로 `department_id` 자동 동기화 |
| `department_id` | `uuid` | 소속 **그룹**(`departments.id`). `team_id` 트리거로 동기화(직접 설정 가능) |
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김(약력·소개·첨부 등, **토글 설정은 Admin 전용**, `0030`) |
| `deleted_at` | `timestamp` | 삭제 일시 (소프트 딜리트용 비활성 타임스탬프) |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시(트리거 자동 갱신) |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **소속 연계(회사·그룹·팀)**: `team_id`(`teams.id`) -> 소속 **팀**. 팀의 그룹(`departments`)·회사(`departments.company`)를 임베드로 함께 조회. 팀이 없으면 그룹/회사 미표기. (소속 계층 [11_departments.md](11_departments.md))
*   **담당 스타트업 연계(다대다)**: `startup_managers` 조인(`manager_id`) -> 담당 스타트업 목록. (초기 단수 `startups.manager_id`는 앱 미사용)
*   **담당 프로젝트 연계(다대다)**: `project_managers` 조인(`manager_id`) -> 담당 M&A/신사업 프로젝트. (초기 단수 `projects.manager_id`는 앱 미사용)
*   **운영 사업 연계(다대다)**: `business_managers` 조인(`manager_id`, `role`) -> 운영 중인 배치 사업 + 운영 역할(운영총괄/운영담당).
*   **책임자와 담당자 분리**: 본인이 책임자(`created_by`)인 게시글이라도 담당자 조인에는 자동 편입되지 않습니다. 자동 편입/해제 차단 규칙은 [0054_remove_author_as_manager.sql](../supabase/migrations/0054_remove_author_as_manager.sql)로 폐지되었고, 담당자는 각 상세 화면에서 자유롭게 추가/해제합니다([PATTERNS.md](PATTERNS.md) 17장).

### 🏷️ TypeScript Interface: `Manager`
```typescript
interface Manager {
  // [고유 속성]
  id: string;
  name: string;
  position: string;
  role: 'admin' | 'manager';
  profileImageUrl?: string;
  specialties: string[];
  biography: {
    education: { school: string; major: string; degree: string; period: string }[];
    career: { company: string; position: string; period: string }[];
  };
  greeting: string;       // 소개. 없으면 ''
  phone: string;
  email: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  // [소속: 회사 > 그룹 > 팀]
  teamId: string;         // 소속 팀 id. 없으면 ''
  teamName: string;       // 소속 팀명. 없으면 ''
  departmentId: string;   // 소속 그룹 id (팀의 상위 그룹)
  departmentName: string; // 소속 그룹명
  companyName: string;    // 소속 회사명
  sections: ManagerSections;
}
```

---

## 5.3 화면 기획 요건

> [!NOTE]
> 심사역은 전문가([9_experts.md](9_experts.md))와 "사람 프로필" 골격(이름·직급·연락처·이메일·전문분야)을 공유합니다. 표시·폼 필드는 [17_conventions.md](17_conventions.md) 6장의 공유 컴포넌트(`PersonProfileCard`, `SpecialtyTags`, `PersonFormFields`)를 사용합니다. 단 **작성 모델은 당사자 본인 입력(self-service)**으로, 본인 수정은 허용 컬럼만 갱신하는 `SECURITY DEFINER` RPC로 처리합니다(전문가는 직원 대리 입력).

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **심사역 기본 정보 카드 (목록/상세)**: 이름, 직급, 프로필 이미지, 전문 분야 태그, 연락처 정보 렌더링 블록
*   **심사역 프로필 등록/수정 폼**: 기본 인사 정보 입력란 및 프로필 이미지 업로더, 약력 입력용 행 추가 에디터
*   **등급 배지 (`role` → 관리자 / 일반)**: 목록 표 맨 오른쪽 '등급' 컬럼과 상세 카드에 표기. `admin`=**관리자**(빨강=권한), `manager`=**일반**(neutral=흰/회). 색은 전 도메인 공통 **뱃지 색 규칙**([17_conventions.md](17_conventions.md) 8장)을 따른다. 라벨·톤 단일 소스: [labels.ts](../src/lib/labels.ts) `APP_ROLE_LABEL` / `APP_ROLE_COLOR` / `NEUTRAL_BADGE_STYLE`, 렌더: [RoleTag.tsx](../src/components/managers/RoleTag.tsx).

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **소속 정보 배지**: 심사역 프로필 상단에 소속 **회사 · 그룹 · 팀**(`team_id` → 팀·그룹·회사 임베드) 배지 표기. 팀이 없으면 노출 생략.
*   **역방향 연계(편집형) 패널** — 상세 하단에 3블록. 각각 해당 도메인 **목록과 동일한 표 형태**(메타 5컬럼 제외) + 연동 카드 표시(테두리 회색 통일·제목 옆 빨간 `(연동)` 라벨). 행 클릭=상대 상세 이동, 끝열=**연동 해제**(조인 행만 제거). **추가**(기존 레코드 연결)·**생성**(신규 레코드 등록 후 즉시 매핑) 지원. (PATTERNS 18·18.1, [useManagerRelations.ts](../src/hooks/useManagerRelations.ts))
    *   **담당 스타트업 (연동)** — `startup_managers`(역할 없음). 스타트업 목록 컬럼.
    *   **담당 프로젝트 (연동)** — `project_managers`(역할 없음). 프로젝트 목록 컬럼.
    *   **운영 사업 (연동)** — `business_managers`(역할 운영총괄/운영담당, 행에서 인라인 변경). 사업 목록 컬럼.

---

## 5.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 심사역 목록 및 프로필 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (전체 등록 및 수정 가능) / Manager (본인 프로필 및 약력만 수정 가능, 타인 불가)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

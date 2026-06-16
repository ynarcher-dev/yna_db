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
| `phone` | `varchar(20)` | 연락처 |
| `email` | `varchar(100)` | 이메일 |
| `deleted_at` | `timestamp` | 삭제 일시 (소프트 딜리트용 비활성 타임스탬프) |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **소속 본부 연계**: `department_id` (`departments.id` 외래키 참조) -> 심사역이 속한 본부 정보 조회
*   **포트폴리오 연계**: `startups.manager_id` -> 해당 심사역이 담당하고 있는 스타트업 리스트 조회
*   **프로그램 연계**: `program_managers` 조인 테이블 -> 심사역이 참여/운영 중인 보육 프로그램 조회
*   **프로젝트 연계**: `projects.manager_id` -> 해당 심사역이 담당자로 매핑된 M&A/OI 프로젝트 목록 조회

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
  phone: string;
  email: string;
  deletedAt?: string;
  createdAt: string;

  // [연계 데이터]
  departmentId: string;
}
```

---

## 5.3 화면 기획 요건

> [!NOTE]
> 심사역은 전문가([9_experts.md](9_experts.md))와 "사람 프로필" 골격(이름·직급·연락처·이메일·전문분야)을 공유합니다. 표시·폼 필드는 [17_conventions.md](17_conventions.md) 6장의 공유 컴포넌트(`PersonProfileCard`, `SpecialtyTags`, `PersonFormFields`)를 사용합니다. 단 **작성 모델은 당사자 본인 입력(self-service)**으로, 본인 수정은 허용 컬럼만 갱신하는 `SECURITY DEFINER` RPC로 처리합니다(전문가는 직원 대리 입력).

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **심사역 기본 정보 카드 (목록/상세)**: 이름, 직급, 프로필 이미지, 전문 분야 태그, 연락처 정보 렌더링 블록
*   **심사역 프로필 등록/수정 폼**: 기본 인사 정보 입력란 및 프로필 이미지 업로더, 약력 입력용 행 추가 에디터

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **소속 부서 정보 배지**: 심사역 프로필 상단에 `department_id`를 기반으로 연결된 부서명 배지 표기
*   **담당 스타트업 목록 탭 (Detail Tab 1)**: `startups` 테이블을 조회하여 해당 심사역이 담당하는 스타트업들을 카드 형태로 렌더링
*   **참여 프로그램 목록 탭 (Detail Tab 2)**: `programs` 테이블에서 해당 심사역이 소속되어 진행한 배치 사업 이력 리스트업
*   **담당 프로젝트 목록 탭 (Detail Tab 3)**: `projects` 테이블에서 해당 심사역이 담당하고 있는 M&A / OI 프로젝트 목록 표(Table)로 출력

---

## 5.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 심사역 목록 및 프로필 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (전체 등록 및 수정 가능) / Manager (본인 프로필 및 약력만 수정 가능, 타인 불가)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

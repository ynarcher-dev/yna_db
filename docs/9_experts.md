# 9. 전문가 관리 (Experts)

## 9.1 기능 정의 및 목적
* **목적**: 스타트업 멘토링, 피칭 데이 심사, 정부 사업 평가 등에 활용할 외부 전문가 풀(Pool)과 멘토링 매칭 이력을 기록하고 관리합니다.

---

## 9.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `experts`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 전문가 고유 식별자 |
| `name` | `varchar(50)` | 전문가 이름 |
| `company` | `varchar(100)` | 소속 회사/기관 |
| `position` | `varchar(50)` | 직책 |
| `phone` | `varchar(20)` | 연락처 |
| `email` | `varchar(100)` | 이메일 |
| `expert_type` | `varchar(30)` | 전문가 유형 (mentor, auditor, advisor) |
| `specialties` | `text[]` | 전문 분야 키워드 태그 배열 (예: AI, 특허, 법률, 투자유치) |
| `is_available` | `boolean` | 매칭 가능 여부 상태 (T/F) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **멘토링 매칭 연계**: `expert_mentorings.expert_id` -> 특정 전문가와 연결된 스타트업(`startups.id` 참조) 및 담당 심사역(`managers.id` 참조) 자문 이력 연동

### 🏷️ TypeScript Interface: `Expert`
```typescript
interface Expert {
  // [고유 속성]
  id: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  expertType: 'mentor' | 'auditor' | 'advisor';
  specialties: string[];
  isAvailable: boolean;
  deletedAt?: string;
  createdAt: string;
}
```

---

## 9.3 화면 기획 요건

> [!NOTE]
> 전문가는 심사역([5_managers.md](5_managers.md))과 "사람 프로필" 골격(이름·직급·연락처·이메일·전문분야)을 공유합니다. 표시·폼 필드는 [17_conventions.md](17_conventions.md) 6장의 공유 컴포넌트(`PersonProfileCard`, `SpecialtyTags`, `SpecialtyFilter`, `PersonFormFields`)를 사용합니다. 단 **작성 모델은 직원 대리 입력(proxy)**으로, Admin/Manager가 일반 `INSERT`/`UPDATE`로 등록·관리합니다(심사역은 당사자 본인 입력). 전문가는 로그인 계정이 없습니다.

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **전문가 인적 정보 상세 카드 (목록/상세)**: 이름, 직함, 전문 분야 태그, 매칭 가능 상태 토글(Switch) 컴포넌트 렌더링 블록.
*   **전문 분야 다중 태그 검색 필터**: 태그 풀에서 전문 자문 카테고리를 멀티 셀렉트하여 리스트를 필터링하는 검색 바 블록.
*   **전문가 등록/수정 양식 폼**: 전문가 프로필 및 유형 등록 폼 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **멘토링 만족도 통계 대시보드 (Connected Stats)**: 연계된 `expert_mentorings` 평점 데이터를 평균 내어 평점 별점(Rating Star)으로 시각화 표기하는 블록.
*   **스타트업 자문 매칭 히스토리 테이블 (Detail Area)**: `expert_mentorings` 조인을 호출하여 자문 일자, 대상 스타트업명, 담당 심사역명, 자문 주제 및 스타트업이 제출한 피드백 코멘트 목록 리스트업 블록.

---

## 9.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 전문가 정보 및 멘토링 매칭 이력 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (전문가 정보 등록, 멘토링 매칭 이력 및 피드백 작성 가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

# 11. 소속 관리 (Departments)

## 11.1 기능 정의 및 목적
* **목적**: 사내 조직(본부 및 부서) 정보를 관리하고, 부서별 인원 분배 현황 및 담당 스타트업의 통계를 요약하여 조회합니다.

---

## 11.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `departments`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 부서 고유 식별자 |
| `name` | `varchar(100)` | 본부/부서명 (예: 글로벌액셀러레이팅본부, 투자본부) |
| `established_at` | `date` | 설립일 |
| `description` | `text` | 본부 역할 및 업무 설명 |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **본부장 연계**: `leader_id` (`managers.id` 외래키 참조) -> 본부장 정보를 조회하여 매핑
*   **소속 팀원 연계**: `managers.department_id` -> 해당 본부 조직에 속한 모든 사내 심사역 목록 연동
*   **소속원 포트폴리오 집계 연계**: 소속 심사역들이 담당하는 `startups` 및 `startup_metrics` 테이블 데이터 조인 집계 -> 소속 스타트업들의 총합 가치 및 매출액 합계 통계 연동

### 🏷️ TypeScript Interface: `Department`
```typescript
interface Department {
  // [고유 속성]
  id: string;
  name: string;
  establishedAt: string;
  description: string;
  deletedAt?: string;
  createdAt: string;

  // [연계 데이터]
  leaderId: string;
}
```

---

## 11.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **본부 조직도 개요 카드 (목록/상세)**: 본부명, 부서 설명 및 설립일 출력 블록.
*   **부서 등록/정보 수정 폼 (Admin 전용)**: 부서 신설 및 본부 기본 소개 설명글 편집 폼 블록.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **본부장 및 부서원 목록 그리드**: `leader_id` 연계 프로필 카드(본부장) 표출 및 소속 부서원들 목록 아바타 리스트업 블록.
*   **본부 투자 성과 비교 대시보드 (Connected Chart)**: 본부 소속원들이 관리 중인 스타트업들의 기업 가치 총합과 최근 합산 매출 규모를 카드 위젯 및 가로형 비교 바 차트로 연계 출력하는 화면 블록.

---

## 11.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (부서 통계 및 인원 배분 정보 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (부서 생성 및 본부장 임명 가능) / Manager (불가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

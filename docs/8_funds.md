# 8. 펀드 관리 (Funds)

## 8.1 기능 정의 및 목적
* **목적**: 사내에서 운용 중인 투자조합 및 펀드의 정보, LP(출자자) 지분율, Capital Call 및 출자금 집행 이력을 모니터링합니다.

---

## 8.2 데이터 모델 요건

### 1) 고유 속성 (Inherent Fields)
*   **테이블명**: `funds`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 펀드 고유 식별자 |
| `name` | `varchar(150)` | 펀드/투자조합명 |
| `total_amount` | `numeric(15, 2)` | 결성 총액 (원화) |
| `investing_period` | `varchar(100)` | 투자 대상 기간 (예: 2026-01 ~ 2030-12) |
| `balance` | `numeric(15, 2)` | 미소진 잔액 |
| `lp_composition` | `jsonb` | LP 구성 정보 및 지분비율 (`[{ "lp_name": "모태펀드", "shares": 500000000, "percentage": 50.0 }]`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **캐피탈 콜 연계**: `capital_calls.fund_id` -> 분기별 LP 납입 요청(Capital Call) 이력 정보 연동
*   **투자 집행 연계**: `fund_investments.fund_id` -> 피투자 스타트업(`startups` 테이블)별 실제 출자액 및 취득 지분율 연동

### 🏷️ TypeScript Interface: `Fund`
```typescript
interface Fund {
  // [고유 속성]
  id: string;
  name: string;
  totalAmount: number;
  investingPeriod: string;
  balance: number;
  lpComposition: { lpName: string; shares: number; percentage: number }[];
  deletedAt?: string;
  createdAt: string;
}
```

---

## 8.3 화면 기획 요건

### 1) 고유 UI 블록 (Inherent UI Blocks)
*   **펀드 재무 정보 카드 (목록/상세)**: 결성 총액, 소진율(총액 대비 잔액 비율) 진척도 바, 투자 기간 명시 블록.
*   **LP 지분율 구조 도넛 차트 (Donut)**: LP별 출자 비율을 시각화해 주는 차트 위젯 블록.
*   **펀드 생성/조합 결성 폼 (Admin 전용)**: 결성액 입력 및 JSON 형식의 LP 이름 및 지분 배분 설정 입력 에디터.

### 2) 연계 UI 블록 (Connected UI Blocks)
*   **Capital Call 납입 히스토리 테이블 (Detail Area 1)**: `capital_calls` 데이터를 호출하여 차수별 요청일, 요청 총액, 납입 완료 여부를 나타내는 데이터 테이블 블록.
*   **피투자 포트폴리오 지분 분배 테이블 (Detail Area 2)**: `fund_investments` 테이블을 활용하여 해당 펀드에서 자금이 집행된 스타트업 목록, 투자액, 소유 지분율을 연계 표출하는 테이블 블록. (클릭 시 스타트업 상세로 연결)

> **카드 섹션 표시/숨김(공통 규약)**: 위 보조 카드 섹션(LP 도넛·Capital Call·포트폴리오 등)은 등록·기본 수정 폼의 토글로 표시/숨김할 수 있어야 합니다. 상세 구현 시 [17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장을 따라 `lib/fundSections.ts` + `sections` jsonb 컬럼 + 폼 토글 + 상세 조건 렌더를 포함합니다(재무 정보/식별 카드는 항상 표시). 또한 전 도메인 공통 **첨부파일 카드**(`EntityFilesBlock`, [PATTERNS.md](PATTERNS.md) 16장)를 상세에 포함하고 `attachments` 섹션 키로 토글합니다.

---

## 8.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (펀드 자금 집행 흐름 및 LP 지분율 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (펀드 생성, LP 구성 정보 수정 가능) / Manager (불가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

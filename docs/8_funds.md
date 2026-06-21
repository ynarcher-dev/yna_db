# 8. 펀드 관리 (Funds)

## 8.1 기능 정의 및 목적
* **목적**: 사내에서 운용 중인 투자조합 및 펀드의 정보, LP(출자자) 지분율, Capital Call 및 출자금 집행 이력을 모니터링합니다.

> **구현 메모(2026-06-17)**: Admin 전용 CRUD(읽기는 전 직원). 메타 컬럼 `created_by`(책임자)·`updated_at` 추가(0039). 상세 = 재무 카드(소진율 바) + LP 도넛 + Capital Call(`capital_calls`) + 피투자 포트폴리오(`fund_investments`) + **담당자(다대다) 패널** + 섹션 토글 + 첨부파일(`entity_type='fund'`). 하위레코드 쓰기 RLS = Admin(0040), 섹션 jsonb(0041). 피투자 스타트업은 **양방향**: 스타트업 상세 '투자받은 펀드'에서 역참조(PATTERNS 18장), 스타트업 성장지표의 자사 투자도 `startup_metrics.fund_id`로 이 펀드를 가리킬 수 있다(0042).
>
> **담당자 다대다(`fund_managers`, 0047)**: 발주자 확정으로 펀드도 담당자(n명)를 배정한다(명칭은 전 도메인 "담당자" 통일, [PATTERNS.md](PATTERNS.md) 17장). 공통 `EntityManagersPanel`(`kind="fund"`) 재사용. 조회=전 직원, **배정 추가/해제=Admin 전용**(펀드는 Admin 도메인). 책임자(`created_by`) 자동 담당자 편입 규칙은 `0054`로 폐지되었다.

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
| `sections` | `jsonb` | 상세 카드 섹션 표시/숨김(LP·Capital Call·포트폴리오·담당자·첨부, `0041`) |
| `created_by` | `uuid` | **책임자**(등록 Admin, `managers.id`, `0039`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시(트리거 자동 갱신, `0039`) |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **담당자 연계(다대다)**: `fund_managers` 조인(`fund_id`, `manager_id`, `0047`) -> 펀드 담당 심사역 여러 명. 작성자/책임자(`created_by`)와 별개로 관리하며 배정 추가/해제=Admin.
*   **캐피탈 콜 연계**: `capital_calls.fund_id` -> 분기별 LP 납입 요청(Capital Call) 이력 정보 연동
*   **투자 집행 연계**: `fund_investments.fund_id` -> 피투자 스타트업(`startups` 테이블)별 실제 출자액 및 취득 지분율 연동. 스타트업 상세 '투자받은 펀드'에서 역참조(양방향, PATTERNS 18장).

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
  sections: FundSections;        // 카드 섹션 표시/숨김
  managerNames: string[];        // 담당자(다대다) 이름 목록(목록 표시용)
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  // [연계 데이터]
  createdById: string;           // 책임자(created_by) id
  authorName: string;            // 책임자 이름
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
*   **담당자(다대다) 배정 패널 (Detail Area 3)**: `fund_managers` 기반 담당 심사역 패널(`EntityManagersPanel kind="fund"`). 작성자/책임자와 무관하게 담당자를 배정하며, 추가/해제는 **Admin 전용**. ([PATTERNS.md](PATTERNS.md) 17장)

> **카드 섹션 표시/숨김(공통 규약)**: 위 보조 카드 섹션(LP 도넛·Capital Call·포트폴리오 등)은 등록·기본 수정 폼의 토글로 표시/숨김할 수 있어야 합니다. 상세 구현 시 [17_conventions.md](17_conventions.md) 7장 · [PATTERNS.md](PATTERNS.md) 15장을 따라 `lib/fundSections.ts` + `sections` jsonb 컬럼 + 폼 토글 + 상세 조건 렌더를 포함합니다(재무 정보/식별 카드는 항상 표시). 또한 전 도메인 공통 **첨부파일 카드**(`EntityFilesBlock`, [PATTERNS.md](PATTERNS.md) 16장)를 상세에 포함하고 `attachments` 섹션 키로 토글합니다.

---

## 8.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (펀드 자금 집행 흐름 및 LP 지분율 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (펀드 생성, LP 구성 정보 수정 가능) / Manager (불가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

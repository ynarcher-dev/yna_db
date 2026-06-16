# 📑 18. PPTX 보고서 데이터 매핑 (18_pptx_spec.md)

[3_smart_features.md](3_smart_features.md) 1번의 "편집 가능한 PPTX 추출"의 슬라이드별 데이터 소스·필드 매핑과 PptxGenJS 생성 규격을 정의합니다. 단순 이미지 캡처가 아니라 텍스트·표·네이티브 차트 객체로 생성합니다.

---

## 1. 공통 규격

* **라이브러리**: `PptxGenJS`. 생성은 클라이언트에서 수행 가능하나, 다량/민감 데이터는 Edge Function에서 생성 후 다운로드 링크 제공도 허용합니다.
* **폰트**: 모든 텍스트·표·차트 요소는 **Pretendard 단독** 고정([0_design_system.md](0_design_system.md)).
* **컬러 토큰**: 메인 `515151`, 포인트 `e22213`, 서브배경 `F5F5F5`, 경계 `E5E5E5`(PptxGenJS는 `#` 없이 표기).
* **슬라이드 비율**: 16:9(`LAYOUT_WIDE`).
* **파일명**: `{스타트업명}_투자검토요약_{YYYYMMDD}.pptx`.
* **숫자 포맷**: 금액은 억/원 단위 변환 + 천단위 콤마, 퍼센트 소수 1자리.

---

## 2. 슬라이드별 데이터 매핑

### 2.1 슬라이드 1 — 타이틀 커버
| 요소 | 데이터 소스 |
| :--- | :--- |
| 보고서 제목 | `"[{startups.name}] 투자 검토 요약 보고서"` |
| 부제/대상 기업 | `startups.name`, `startups.investment_stage` |
| 출력 일자 | 생성 시각(YYYY-MM-DD) |
| 작성 심사역 | 로그인 사용자 `managers.name`(담당 심사역 `startups.manager_id`) |
| 디자인 | 배경 `515151` 또는 흰색 + 포인트 `e22213` 액센트 라인 |

### 2.2 슬라이드 2 — 기업 기본 개요 (표)
`startups` + 담당 심사역 조인. 2열 격자 표(키-값).

| 행 | 값 |
| :--- | :--- |
| 대표자명 | `startups.ceo_name` |
| 투자유치 단계 | `startups.investment_stage`(라벨 변환) |
| 담당 심사역 | `managers.name` |
| 비즈니스 모델 | `startups.description` |
| 등록일 | `startups.created_at` |

* 표 헤더 배경 `F5F5F5`, 경계선 `E5E5E5`, 본문 텍스트 `515151`.

### 2.3 슬라이드 3 — 시계열 성장 지표 (네이티브 차트)
`startup_metrics` 전체 이력(record_date 오름차순).

* **차트 1 (꺾은선)**: X축=`record_date`, 시리즈=`valuation`(기업가치), `revenue`(매출). 단위 억원.
* **차트 2 (막대)**: X축=`record_date`, 시리즈=`employee_count`(고용).
* PptxGenJS `addChart('line' | 'bar', ...)`로 편집 가능한 네이티브 차트 생성. 데이터 0건이면 "기록된 지표가 없습니다" 텍스트 박스로 대체.

### 2.4 슬라이드 4 — 주주 구성 및 후속 관리 현황
* **주주 구성**: `startups.shareholders`(JSONB) → 표(주주명·주식수·지분율) + 지분율 도넛 차트(`addChart('doughnut')`).
* **후속 관리**: `startup_followups`에서 최근 보고 기준 → 분기 정기 보고서 제출 현황 리스트(제출 여부 ✓/✗)와 `milestones`(JSONB) 체크리스트.

---

## 3. 생성 함수 구조 (코드 분할)

[0_rules.md](0_rules.md) 500줄 규칙에 따라 슬라이드별로 파일을 분리합니다.

```
src/lib/pptx/
  ├─ buildReport.ts        // 진입점: 데이터 fetch + 슬라이드 조립 (200줄 내)
  ├─ theme.ts              // 폰트·컬러·공통 옵션 토큰
  ├─ slideCover.ts         // 슬라이드 1
  ├─ slideOverview.ts      // 슬라이드 2
  ├─ slideMetrics.ts       // 슬라이드 3
  └─ slideShareholders.ts  // 슬라이드 4
```

* `buildReport(startupId)`는 필요한 데이터를 한 번에 조회(스타트업·지표·후속보고·담당자)한 뒤 각 `slide*` 함수에 전달합니다. 각 함수는 PptxGenJS `slide` 객체를 받아 요소만 추가합니다.
* 호출 위치: 스타트업 상세 헤더의 "보고서 출력" 버튼([1_overview.md](1_overview.md) 상단 헤더 요건). 생성 중 전역 스피너, 완료 시 Toast.

---

## 4. 확장 고려
* 펀드 현황 보고서(LP 구성·소진율·투자 집행)도 동일 패턴으로 `buildFundReport`를 추가할 수 있습니다([8_funds.md](8_funds.md)). 1차 범위는 스타트업 보고서입니다.

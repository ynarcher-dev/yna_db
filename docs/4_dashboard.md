# 4. 대시보드 (Dashboard)

## 4.1 기능 정의 및 목적
* **목적**: 대표이사(CEO)가 시스템이 관리하는 **9대 핵심 도메인별 대표 현황 지표**를 단 한 페이지에서 일목요연하게 조망하여 전체 사업 현황을 1초 만에 파악할 수 있는 의사결정용 요약 대시보드입니다.

---

## 4.2 데이터 모델 요건

대시보드 API는 각 9대 도메인의 핵심 테이블들로부터 실시간 또는 스냅샷으로 통계 지표를 집계하여 전달합니다.

### 🏷️ TypeScript Interface: `CeoDashboardSummary`
```typescript
interface CeoDashboardSummary {
  // 9대 핵심 도메인별 대표 요약 지표 (9 Core Domain Key Metrics)
  metrics: {
    // 1. 심사역 (Managers)
    totalManagers: number;            // 총 재직 심사역 수
    
    // 2. 스타트업 (Startups)
    totalStartups: number;            // 총 보육/피투자 스타트업 수
    totalPortfolioValuation: number;  // 포트폴리오 합산 기업가치
    
    // 3. 사업 (Businesses)
    activeBusinesses: number;           // 현재 진행 중인 사업(배치/지원사업) 수
    
    // 4. 펀드 (Funds)
    totalAum: number;                 // 총 AUM (결성 총액 합계)
    averageFundExhaustionRate: number; // 운용 펀드들의 평균 소진율 (%)
    
    // 5. 전문가 (Experts)
    totalExperts: number;             // 등록 외부 전문가/멘토 인력 풀 규모
    averageMentoringRating: number;   // 누적 멘토링 만족도 평균 별점 (1.0 ~ 5.0)
    
    // 6. 프로젝트 (Projects) — M&A·신사업은 상호 배타적이라 분리 집계 (0056)
    activeMaProjects: number;         // 진행 중인 M&A 프로젝트 수 (project_type='m_and_a')
    activeNewBizProjects: number;     // 진행 중인 신사업 프로젝트 수 (project_type='new_business')
    
    // 7. 후속 관리 (Follow-ups)
    reportSubmissionRate: number;     // 이번 분기 정기 보고서 제출 완료율 (%)
    
    // 8. 소속 부서 (Departments)
    totalDepartments: number;         // 사내 활성 본부/부서 수
    
    // 9. 협력사 (Partners)
    totalPartners: number;            // 등록 대외 협력 기관 및 기업 수
  };

  // 주요 스케줄 일정 요약 (캘린더 연계)
  upcomingEvents: {
    id: string;
    title: string;                    // 행사/모집명
  eventType: 'recruitment' | 'demoday' | 'networking' | 'meeting' | 'ir' | 'event';
    eventDate: string;                // YYYY-MM-DD
  }[];
}
```

---

## 4.3 화면 기획 요건

대시보드는 **9대 도메인 현황 카드 섹션**과 **핵심 스케줄 목록** 두 영역으로 직관적이고 심플하게 구성합니다.

### 4.3.1 9대 도메인 요약 그리드 (3x3 Grid Layout)
화면 전체를 3행 3열의 그리드로 분할하여 브랜드 메인 컬러(`#515151`)를 배경으로 하고 중요 아이콘 및 핵심 수치를 강조하여 보여줍니다.
1.  **[1] 심사역 카드**: `재직 심사역 수` (심사역 관리 페이지 바로가기 연동)
2.  **[2] 스타트업 카드**: `포트폴리오 수` + `합산 기업가치(원화)` 표시
3.  **[3] 사업 카드**: `진행 사업 수` (이번 달 종료 예정 건수 서브 표시)
4.  **[4] 펀드 카드**: `총 AUM` + `평균 소진율` 표시 (재무 건전성 판단)
5.  **[5] 전문가 카드**: `외부 전문가 규모` + `평균 만족도 별점` (멘토 풀 역량 측정)
6.  **[6] 프로젝트 카드**: `진행 중인 딜 수` (M&A / OI 영업 현황)
7.  **[7] 후속 보고 카드**: `정기 보고서 제출율` (스타트업 컴플라이언스 이행 여부)
8.  **[8] 소속 본부 카드**: `활성 부서 수` (본부별 리소스 현황)
9.  **[9] 협력사 카드**: `등록 협력사 수` (대외 파트너십 네트워크 볼륨)

*   **상태 디자인**: 각 카드 위젯에 마우스 호버 시 포인트 컬러(`#e22213`)로 외곽선 또는 텍스트가 강조되어 해당 상세 관리 페이지로 즉시 이동할 수 있도록 클릭 인터랙션을 부여합니다.

### 4.3.2 하단: 스케줄 및 다이어리 (Calendar Summary)
*   `system_events`를 기준으로 사업 모집 마감, IR 피칭 데이, 대외 협력 미팅 등 다가오는 주요 5개 일정을 타임라인 형식으로 요약 제공합니다.
*   사업 일정은 필요 시 `business_events` 등록·수정 시 `system_events`에 동기화하거나, 두 테이블을 합친 읽기 전용 View를 사용합니다. 동일 일정을 양쪽에서 수동으로 중복 입력하지 않습니다.

---

## 4.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: Admin / Manager (전체 지표 및 스케줄 조회 가능)
* **작성 및 수정 (Create/Update)**: Admin (스케줄 관리 가능) / Manager (불가능)
* **삭제 (Delete)**: Admin (가능) / Manager (불가능)

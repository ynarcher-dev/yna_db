# ✅ 개발 현황 (PROGRESS)

> 와이앤아처 PMS 개발 진행 상황 추적 문서. **작업을 완료할 때마다 이 문서의 완료 여부를 갱신한다.**
> 개발 순서 기준은 [20_roadmap.md](20_roadmap.md)의 Phase. (문서 번호 ≠ 개발 순서)
> 최종 갱신: **2026-06-17** (Phase 4 전 도메인 완료 + 담당 심사역 다대다 + 양방향 연계 + 역방향 표현 보완 + **담당자/책임자 모델 표준화(펀드 담당자·작성자 자동편입) + 소속 회사>그룹>팀 개편**)

## 범례
- ✅ 완료(코드 + 품질게이트 통과) · 🔵 진행 중 · ⬜ 미착수
- **DB(SQL)는 사용자가 Supabase SQL Editor에서 직접 RUN** → 코드 완료와 별개로 "DB 적용" 열로 구분

---

## Phase별 현황

### Phase 0 — 기반 구축 ✅
- ✅ 스캐폴드(React+Vite+TS+AntD+Tailwind), 테마, Supabase 연결
- ✅ 물리 스키마/RLS/집계/시드 (`0001`~`0004`, `seed.sql`)

### Phase 1 — 공통 셸 & 인증 ✅
- ✅ 로그인 / 온보딩(최초 비밀번호) / 비밀번호 재설정
- ✅ 라우트 가드(RequireAuth / RequireRole), 사이드바·헤더, 공통 피드백(useAppToast/EmptyState/ConfirmModal 등)

### Phase 2 — 대시보드(읽기 전용) ✅
- ✅ `get_dashboard_summary` RPC + 9개 현황 카드 + 다가오는 일정

### Phase 3 — 단순 CRUD 도메인 ✅ (코드 완료)
| 도메인 | 목록·검색·필터·정렬·페이지네이션 | 상세 | 등록/수정 | 삭제(소프트) | 비고 |
| :--- | :---: | :---: | :---: | :---: | :--- |
| 협력사(partners) | ✅ | ✅ | ✅ | ✅(Admin) | 레퍼런스 구현 |
| 전문가(experts) | ✅ | ✅ | ✅ | ✅(Admin) | 유형·매칭여부·멘토링 평점·관심분야·약력·소개·이미지 |
| 소속(departments) | ✅ | ✅ | ✅(Admin) | ✅(Admin) | CRUD 전부 Admin 전용 |
| 심사역(managers) | ✅ | ✅(=마이페이지) | 수정만(본인 RPC/Admin) | ✅(Admin·본인 제외) | 등록=계정 발급(Edge Function)으로 분리 |

추가 반영 항목(심사역·전문가 공통):
- ✅ 프로필 이미지 업로드(Storage `avatars`)
- ✅ 약력(학력·경력·자격증·수상) — 입력 가로형 / 표시 세로형(빈 섹션·전체 빈값 숨김)
- ✅ 소개(greeting) 블록 · 공통 `PersonProfileCard`로 상세 골격 통일
- ✅ 용어: 전문 분야 → "관심 분야", 인삿말 → "소개"

### Phase 4 — 복합/연계 도메인 🔵 (진행 중)

#### 스타트업(startups) ✅ (연계 탭 제외 코드 완료)
**목록**: 검색(기업명·대표자) / 필터(투자단계·관리현황·담당심사역) / 정렬·페이지네이션 / 기업 설명 컬럼(말줄임). partners 패턴 복제.
**상세 화면 구성(위→아래)**:
1. **기본 정보 카드** — 로고(업로드)·브랜드컬러 액센트·투자단계·관리현황 배지, 대표자·담당심사역(링크). 상단 버튼 `기본 수정`(드로어).
2. **비즈니스 & 팀 역량** — 세로 1열. 비즈니스(한줄소개·BM·타겟시장·경쟁우위)+팀역량(대표역량·핵심팀원·역량태그). 라벨=브랜드컬러, 해시태그=흰배경+브랜드컬러 테두리. `business_profile`/`team_profile` jsonb.
3. **성장 지표** — 상단 **비즈니스 현황**(시계열 텍스트) + **2×2 막대그래프 카드**(재무현황=자산·부채·자본 / 매출현황=매출액+표 영업이익·당기순이익 / 고용현황 / 투자현황=기업가치(Pre)·투자유치액+투자자·라운드). 카드별 단색 농담 팔레트, 연도별 입력(upsert=연도 중복 시 수정), 음수는 표에서 ▼빨강. `startup_metrics`(연 1행).
4. **주주 구성** — 표 + 지분율 PIE(Recharts). 지분율 합계 100% 초과 차단. `shareholders` jsonb.
5. **기업진단** — 임시 수동 입력 텍스트(없으면 "아처스캔 데이터 들어갈 자리"). 추후 외부 서비스 연동.
6. **뉴스룸** — 기업진단과 동일한 카드 형태(placeholder "네이버 뉴스 API 연동 예정"). 추후 네이버 뉴스 API 연동(수동 입력·DB 컬럼 없음).
7. **후속관리**(`startup_followups`) — 보고유형(분기·반기·연간·수시·리스크), **복수 첨부파일 드래그앤드롭 업로드**(reports 버킷), 코멘트, 상태(제출 대기/완료) 토글, **zip 일괄 다운로드**(jszip), 등록/수정/삭제.
8. **메모·회의록**(`memos` jsonb) — 협력사 교류이력형 타임라인.

**공통 규칙**: 모든 섹션 카드는 `SectionHeader`(제목 + 최종 수정일 + 아이콘 없는 `수정` 버튼). 모든 입력/수정은 **슬라이드(Drawer)**. 섹션별 jsonb는 전용 update 변이 + 섹션 최종수정일 기록. RBAC: 작성/수정=Admin·Manager, 삭제=Admin.
**추가 반영(2026-06-17)**: ✅ 담당 심사역 **단수→다대다 전환**(`startup_managers`, 폼에서 단수 Select 제거→상세 담당자 패널). ✅ 투자현황 자사 투자 ↔ **재원 펀드 연동**(`startup_metrics.fund_id`). ✅ **참여 프로그램·프로젝트·투자받은 펀드** 역방향 패널 연결(아래 양방향 연계 참고).

#### ✅ 카드 섹션 표시/숨김 토글 — 전 도메인 공통화 (2026-06-17)
등록·기본 수정 폼에서 상세 보조 카드 섹션을 켜고/끄고, 상세는 활성 섹션만 노출([17_conventions.md](17_conventions.md) 7장·[PATTERNS.md](PATTERNS.md) 15장). 공통 인프라 `lib/sectionVisibility.ts`(`defineSections` 팩토리) + `components/common/SectionVisibilityField.tsx`(토글 UI). 적용: 스타트업(`0027`)·협력사(`0028`)·전문가(`0029`)·심사역(`0030`·**Admin 전용**)·소속(`0032`). 제외: 프로필/식별 카드(항상 표시)·'Phase 4 연동예정' Alert. 미구현 도메인(프로그램/펀드/프로젝트)=각 spec에 규약 인용 → 상세 구현 시 포함. 새 섹션 키 추가는 마이그레이션 불필요(normalize 가 누락 키=표시 보정).

#### ✅ 첨부파일 카드 — 전 도메인 공통 (2026-06-17)
모든 게시글 상세에 동일한 **임의 파일 업로드 + 개별/전체(zip) 다운로드** 카드([17_conventions.md](17_conventions.md) 4장·[PATTERNS.md](PATTERNS.md) 16장). 공통 컴포넌트 [EntityFilesBlock](../src/components/common/EntityFilesBlock.tsx) 한 줄(`entityType`+`entityId`)로 전 도메인(스타트업·협력사·전문가·심사역·소속) 적용. **새 테이블 없이** `uploaded_files` 폴리모픽 확장(`entity_type`/`entity_id`, `purpose='attachment'`, `0031`) + 비공개 reports 버킷 재사용. 다운로드는 기존 인프라(목적 입력 → 서명 URL → `log_file_download` 감사 로그) 재사용. **용량 제한 없음**(추후 S3). 각 도메인 `sections.attachments` 토글로 표시/숨김. 소속(부서)은 이 카드 도입으로 sections 인프라 신설(`0032`).

> **✅ 보류 결정 확정(2026-06-17)**: 담당 심사역 **다대다 채택**(책임자=created_by / 담당자=다대다 조인 / 관리자 3계층). 게시글 **삭제=책임자+관리자**(프로젝트·프로그램 적용), **수정 권한 축소**는 보류 유지(현행 전 직원). 화면 라벨 통일: 작성자→**책임자**. 상세 [6_startups.md](6_startups.md) 6.5.

#### ✅ 프로젝트(projects) (2026-06-17, 발주자 요청으로 프로그램보다 먼저)
- 기본 CRUD(검색·유형/상태/우선순위 필터) + 삭제=책임자+관리자. **유형=M&A·신사업·기타(자유입력)**, **상태=대기·진행중·완료·중단·취소**(단순 상태값, **칸반/딜 파이프라인 폐기**).
- 담당자(다대다 `project_managers`) 배정 패널 · 매칭 스타트업/협력사(`project_startups`/`project_partners`) 좌우 2열 패널 · 섹션 토글 · 첨부파일. (`0033`~`0037`)

#### ✅ 펀드(funds) (2026-06-17, Admin 전용)
- 기본 CRUD + **소진율 진척바** · **LP 구성**(jsonb) 표+지분율 **도넛** · **Capital Call**(`capital_calls`) · **피투자 포트폴리오**(`fund_investments`, 스타트업 링크) · 섹션 토글 · 첨부파일. (`0039`~`0041`)

#### ✅ 프로그램(programs) (2026-06-17, Phase 4 마지막)
- 기본 CRUD(기수·예산·기간·모집마감) + 삭제=책임자+관리자. **운영 심사역 매핑**(`program_managers`, 역할 운영총괄/운영담당) · **참여 스타트업 매핑**(`program_startups`, 보육 상태) · **마일스톤 캘린더**(`program_events` + FullCalendar, **대시보드 일정 자동 동기화**) · 섹션 토글 · 첨부파일. (`0043`~`0045`)

#### ✅ 양방향 연계(역방향 참조 패널) (2026-06-17)
공통 인프라 `hooks/useRelatedRecords.ts` + `components/common/RelatedListCard.tsx`(읽기 전용, 새 마이그레이션 없음). 적용:
- 스타트업 상세: 참여 프로그램·참여 프로젝트·투자받은 펀드
- 심사역 상세: 담당 스타트업·담당 프로젝트·운영 프로그램(역할)
- 협력사 상세: 참여 프로젝트
- 소속 상세: 소속 부서원·본부 투자성과(`view_department_stats`)

##### ✅ 역방향 표현 보완 (2026-06-17)
역방향 카드를 **목록 화면과 동일한 표 형태**로 통일하고 정/역방향을 시각 구분 (PATTERNS 18.1).
- ✅ **컬럼 단일 정의** [lib/listColumns.tsx](../src/lib/listColumns.tsx) — 도메인 고유 컬럼(메타 5개 제외)을 목록 화면·역방향 패널이 공유(`{domain}Columns(opts?)`). 프로그램·프로젝트 목록뷰가 이 팩토리를 쓰도록 리팩터.
- ✅ **표본: 스타트업 상세** 참여 프로그램·프로젝트 패널 → 표 형태(목록과 같은 컬럼 + 보육상태·연동해제). 역방향 hook select 중첩 임베드 후 `map{Domain}Row` 재사용.
- ✅ **시각 구분(전 연동 카드)** — 섹션명 옆 `(연동)` 라벨을 포인트색(`text-yna-point` #e22213)으로 강조. 테두리는 비연동 카드와 동일한 회색(`border-yna-border`) 통일(2026-06-17 발주자 요청으로 과거 `border-yna-point/40` 테두리 강조 제거). '관리(삭제)' → **'연동 해제'**(조인 행만 제거).
- ✅ **심사역 상세 — 편집형 전환** — 담당 스타트업·담당 프로젝트(역할 없음)·운영 프로그램(역할)을 ul→표로 전환하고 **추가(기존 연결)·생성(신규 등록 후 즉시 매핑)·역할변경·연동해제** 지원. 신규 hook [useManagerRelations.ts](../src/hooks/useManagerRelations.ts) + 패널 3종(`Manager{Startups,Projects,Programs}Panel`). `startupColumns` 추가. 스타트업 create 가 새 id 반환(생성+매핑)하도록 `StartupFormDrawer.onSaved(id)` 보완. 새 마이그레이션 불필요(기존 조인 쓰기 RLS).
- ✅ **협력사 상세 — 편집형 전환 + 프로그램 연계 신설** — 참여 프로젝트(ul→표) + **참여 프로그램 신규**. 신규 조인 `program_partners`(0046) **양방향 편집**: 프로그램 상세 `ProgramPartnersPanel`(정방향, 참여 협력사) + 협력사 상세 `PartnerProgramsPanel`(역방향, 참여 프로그램). `partnerColumns` 추가. hook [useProgramPartners.ts](../src/hooks/useProgramPartners.ts)·[usePartnerProjects.ts](../src/hooks/usePartnerProjects.ts).
- ✅ **프로그램 상세 — 매핑 3종 표 통일** — 운영 심사역·참여 스타트업·참여 협력사 **모두 목록 동일 표**(`managerColumns`/`startupColumns`/`partnerColumns`)로 통일. `useProgramManagers`·`useProgramStartups`(forward)가 전체 도메인 객체 반환(중첩 임베드+map 재사용), 고아 타입 `types/programManager.ts`·`types/programStartup.ts` 제거. 운영 심사역의 역할 컬럼은 시스템 역할과 구분해 **'운영 역할'**로. 방향 재분류 없음(3종 모두 정방향 유지).
- ✅ **액션 라벨 통일 — '관리' → '연동 해제'** (정/역 공통). 조인 제거는 상대 삭제가 아니므로 모든 매핑 패널 행 끝 컬럼을 '연동 해제'로.
- ✅ **연동 카드 규칙 전역 통일 (정/역 무관)** — (1) 테두리+(연동)을 **모든 매핑 카드**에 적용(정방향·Tag형 EntityManagersPanel·ProjectLinksPanel 포함). (2) **모든 연동 카드 섹션을 토글화**(기본수정 폼). 추가 토글 키: 프로그램 `partners`, 스타트업 `managers/programs/projects`, 심사역 `startups/projects/programs`, 협력사 `projects/programs`, 소속 `members/stats`(프로젝트는 기존 키 재사용). `normalize`가 누락 키를 표시로 처리 → **마이그레이션 불필요**.
- ⬜ **후속**: 소속의 ul 목록 → 표 전환(`managerColumns` 준비 완료 → 부서원 hook select 확장만 하면 됨).

**남은 역방향 2건**: ⬜ 전문가 자문매칭 히스토리(`expert_mentorings`, 입력 화면 별도) · ⬜ 소속 본부장(`leader_id`) 임명/표시(모델 확장+write 필요).

#### ✅ 담당자/책임자 모델 표준화 (2026-06-17, 발주자 확정)
전 게시글 도메인의 사람 권한·연계를 **책임자 / 담당자(다대다) / 관리자** 3계층으로 통일([PATTERNS.md](PATTERNS.md) 17장).
- ✅ **펀드도 담당자(다대다)** `fund_managers`(`0047`) — 명칭 "담당자" 전 도메인 통일. 배정 추가/해제=Admin(펀드는 Admin 도메인). 공통 `EntityManagersPanel kind="fund"` 재사용.
- ✅ **책임자 = 담당자 자동 필수 편입**(`0048`) — 부모 등록 시 `created_by`를 담당자 조인에 트리거로 자동 편입(`sync_author_manager`), 책임자 행은 **해제 불가**(`prevent_author_manager_unlink`). 프로그램은 운영총괄(`role='lead'`)로, 나머지(프로젝트·스타트업·펀드)는 역할 없이. 화면도 책임자 행 해제 버튼 미노출.
- ✅ **레거시 백필**(`0049`) — `created_by` NULL 인 시드/구레코드는 **가장 먼저 등록된 Admin 1명**을 디폴트 책임자로 채우고 담당자에도 편입(4도메인 동일 인물).

#### ✅ 소속 계층 개편 — 회사 > 그룹 > 팀 (2026-06-17, 발주자 확정)
기존 단일 "본부/부서"를 **3단계 계층**으로 확장. 관리 단위 = **팀**(한 행 = 한 팀 = 하나의 '부서'). DB 테이블명은 영문 유지, 화면 라벨만 변경([11_departments.md](11_departments.md), [PATTERNS.md](PATTERNS.md) 14장).
- ✅ **회사**: `departments.company`(고정 3종 와이앤아처/와이앤아처벤처스/와이앤아처인베스트먼트, CHECK 제약, `0050`). 기존 그룹은 대표 회사로 백필.
- ✅ **그룹**: 기존 `departments` 재사용(화면 라벨 "그룹"). `(company, name)` UNIQUE.
- ✅ **팀**: 신설 `teams`(`0051`~`0053`) — 그룹 하위, 운영 기간(시작~종료, 비면 운영중), **팀명 선택값**(NULL=회사+그룹 단위 소속, 화면 미노출). 소속 화면(`/departments`)·메뉴·타이틀('소속 관리')은 유지하되 목록·상세는 팀 기준(`views/teams/*`).
- ✅ **심사역 소속 = 팀**(`managers.team_id`, `0052`) — `team_id` 변경 시 그 팀의 그룹으로 `department_id` 자동 동기화(그룹 집계 무변경). **'기본팀' 자동 생성/편입은 하지 않음**(팀 없는 심사역=`team_id` NULL).

### Phase 5 — 스마트 기능 ⬜ (미착수)
- ⬜ PPTX 보고서 · ⬜ AI 파트너(RAG) · ⬜ 알림/감사로그 등 시스템 테이블 · ⬜ Edge Function(계정 발급/관리)

---

## 마이그레이션 적용 현황

> "코드"는 SQL 파일 작성 완료, "DB 적용"은 사용자가 RUN 했는지. 적용했으면 체크박스를 `[x]`로 바꿔 주세요.

| 파일 | 내용 | 코드 | DB 적용 |
| :--- | :--- | :---: | :---: |
| `0001`~`0004`, `seed.sql` | 스키마·RLS·집계·SELECT·시드 | ✅ | [x] |
| `0005`~`0007` | 협력사 write·보정·부서명 | ✅ | [x] |
| `0008_experts_write.sql` | 전문가 write·메타 컬럼 | ✅ | [ ] |
| `0009_departments_write.sql` | 소속 write(Admin)·메타 | ✅ | [ ] |
| `0010_managers_write.sql` | 심사역 메타·본인수정 RPC | ✅ | [ ] |
| `0011_managers_profile_extras.sql` | 소개 컬럼·RPC v2·avatars 버킷 | ✅ | [ ] |
| `0012_experts_profile_image.sql` | 전문가 이미지·avatars 정책 확장 | ✅ | [ ] |
| `0013_experts_bio_greeting.sql` | 전문가 약력·소개 컬럼 | ✅ | [ ] |
| `0014_startups_write.sql` | 스타트업 메타 컬럼(updated_at·created_by)·트리거 | ✅ | [ ] |
| `0015_startup_logo_storage.sql` | 스타트업 로고 Storage 버킷(logos)+정책 | ✅ | [ ] |
| `0016_startups_management_status.sql` | 스타트업 관리 현황 컬럼(+기타 텍스트)·CHECK | ✅ | [ ] |
| `0017_startup_subrecords_write.sql` | 성장지표·후속보고 write/delete RLS | ✅ | [ ] |
| `0018_startup_metrics_extend.sql` | 성장지표 컬럼 확장(재무 6항목·투자유치액·라운드) | ✅ | [ ] |
| `0019_startups_business_team.sql` | 비즈니스·팀 역량 jsonb 컬럼 | ✅ | [ ] |
| `0020_section_updated_at.sql` | 섹션별 최종수정일(metrics·followups updated_at·트리거, startups 2컬럼) | ✅ | [ ] |
| `0021_startups_memos.sql` | 시계열 메모/회의록 jsonb + memos_updated_at | ✅ | [ ] |
| `0022_startups_business_status.sql` | 비즈니스 현황(성장지표 내 시계열) jsonb | ✅ | [ ] |
| `0023_startups_diagnosis.sql` | 기업진단 임시 수동입력 text + diagnosis_updated_at | ✅ | [ ] |
| `0024_startup_metrics_investor.sql` | 투자현황 투자자(investor)·구분(investor_type) | ✅ | [ ] |
| `0025_startup_followups_rework.sql` | 후속관리 개편(files·comment, due_date 해제, reports 버킷) | ✅ | [ ] |
| `0026_file_downloads.sql` | 다운로드 로그(`file_download_logs`)·목적 입력 | ✅ | [ ] |
| `0027_startups_sections.sql` | 스타트업 카드 섹션 표시/숨김(sections jsonb) | ✅ | [ ] |
| `0028_partners_sections.sql` | 협력사 카드 섹션 표시/숨김(sections jsonb) | ✅ | [ ] |
| `0029_experts_sections.sql` | 전문가 카드 섹션 표시/숨김(sections jsonb) | ✅ | [ ] |
| `0030_managers_sections.sql` | 심사역 카드 섹션 표시/숨김(sections jsonb, Admin 전용) | ✅ | [ ] |
| `0031_entity_attachments.sql` | 첨부파일 카드(uploaded_files 폴리모픽 확장·attachment purpose·삭제정책) | ✅ | [ ] |
| `0032_departments_sections.sql` | 소속 카드 섹션 표시/숨김(sections jsonb 신설) | ✅ | [x] |
| `0033_projects_write.sql` | 프로젝트 메타 + INSERT/UPDATE RLS(삭제=책임자+관리자) | ✅ | [x] |
| `0034_project_managers.sql` | 프로젝트 담당자(다대다) 조인 + RLS | ✅ | [x] |
| `0035_projects_type_stage_revision.sql` | 프로젝트 유형(기타 etc)·상태 CHECK·default 개편 | ✅ | [x] |
| `0036_project_links_write.sql` | 프로젝트-스타트업/협력사 매핑 쓰기 RLS | ✅ | [x] |
| `0037_projects_sections.sql` | 프로젝트 카드 섹션 표시/숨김(sections jsonb) | ✅ | [x] |
| `0038_startup_managers.sql` | 스타트업 담당자 다대다 retrofit + 백필 + view_department_stats·get_dashboard_summary 갱신 | ✅ | [ ] |
| `0039_funds_write.sql` | 펀드 메타 컬럼(updated_at·created_by) | ✅ | [ ] |
| `0040_fund_subrecords_write.sql` | capital_calls·fund_investments 쓰기 RLS(Admin) | ✅ | [ ] |
| `0041_funds_sections.sql` | 펀드 카드 섹션 표시/숨김(sections jsonb) | ✅ | [ ] |
| `0042_startup_metrics_fund.sql` | 투자현황 자사투자 ↔ 재원 펀드(fund_id) 연동 | ✅ | [ ] |
| `0043_programs_write.sql` | 프로그램 메타 + INSERT/UPDATE RLS(삭제=책임자+관리자) | ✅ | [ ] |
| `0044_program_subrecords_write.sql` | program_managers·program_startups·program_events 쓰기 RLS | ✅ | [ ] |
| `0045_programs_sections.sql` | 프로그램 카드 섹션 표시/숨김(sections jsonb) | ✅ | [ ] |
| `0046_program_partners.sql` | 프로그램-협력사(기관) 연계 조인 테이블 + SELECT/쓰기 RLS | ✅ | [ ] |
| `0047_fund_managers.sql` | 펀드 담당자(다대다) 조인 + RLS(배정=Admin) | ✅ | [ ] |
| `0048_author_as_manager.sql` | 책임자(created_by) 담당자 자동 편입 + 해제 차단 트리거(프로젝트·스타트업·프로그램·펀드 공통, 프로그램=운영총괄) | ✅ | [ ] |
| `0049_backfill_default_author.sql` | created_by NULL 레거시·시드를 대표 Admin 1명으로 백필 + 담당자 편입 | ✅ | [ ] |
| `0050_departments_company.sql` | 소속 개편 1/3 — 그룹(departments)에 회사(company) 추가(고정 3종)·(회사,그룹명) UNIQUE | ✅ | [ ] |
| `0051_teams.sql` | 소속 개편 2/3 — 팀(teams) 테이블 신설(소속 단위) + RLS(Admin) | ✅ | [ ] |
| `0052_managers_team.sql` | 소속 개편 3/3 — managers.team_id 추가 + team_id→department_id 동기화 트리거 | ✅ | [ ] |
| `0053_teams_name_optional.sql` | 팀명(teams.name) nullable 보정 + 유일성 인덱스 재정의(NULL 팀명 다수 허용) | ✅ | [ ] |

> ⚠️ `0008`~`0053`은 **번호 순서대로** 실행. 모두 재실행 안전(idempotent). 섹션 마이그레이션은 각 도메인 기존 UPDATE RLS 재사용(별도 정책 불필요).
> **사용자 확인**: `0033`~`0037`은 RUN 완료(2026-06-17). `0038`~`0053`은 RUN 필요. (`0008`~`0032` DB 적용 여부는 사용자 환경 기준으로 갱신 요망.) `0053`은 `0051` teams 가 이미 생성된 DB 의 팀명 nullable 보정용(신규 DB 는 0051 만으로 충분).

---

## 다음 작업
- 🔵 **발주자 육안 검토 → 조정 요청 반영** (현재 단계). `0038`~`0053` RUN 후 9개 도메인 + 양방향 + 담당자/책임자 표준화 + 소속(회사>그룹>팀) 동작 확인.
- ⬜ 남은 역방향 2건: 전문가 자문매칭 히스토리(입력 화면 포함) · 소속 본부장(`leader_id`) 임명/표시.
- ⬜ 역방향 표 전환 확산: 소속(ul 목록 → 표 형태, PATTERNS 18.1). 심사역·협력사=완료(편집형).
- ⬜ **Phase 5 스마트 기능**: PPTX 보고서 · AI 파트너(RAG) · 알림/감사로그 · Edge Function(계정 발급/관리).

---

구현 표준·규약은 [PATTERNS.md](PATTERNS.md) 참조.

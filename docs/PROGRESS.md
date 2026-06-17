# ✅ 개발 현황 (PROGRESS)

> 와이앤아처 PMS 개발 진행 상황 추적 문서. **작업을 완료할 때마다 이 문서의 완료 여부를 갱신한다.**
> 개발 순서 기준은 [20_roadmap.md](20_roadmap.md)의 Phase. (문서 번호 ≠ 개발 순서)
> 최종 갱신: **2026-06-17** (뉴스룸 + 카드 섹션 표시/숨김 토글 + 첨부파일 카드 전 도메인 공통화)

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
**남은 것**: ⬜ 참여 프로그램·프로젝트 탭(해당 도메인 개발 후 조인 연결).

#### ✅ 카드 섹션 표시/숨김 토글 — 전 도메인 공통화 (2026-06-17)
등록·기본 수정 폼에서 상세 보조 카드 섹션을 켜고/끄고, 상세는 활성 섹션만 노출([17_conventions.md](17_conventions.md) 7장·[PATTERNS.md](PATTERNS.md) 15장). 공통 인프라 `lib/sectionVisibility.ts`(`defineSections` 팩토리) + `components/common/SectionVisibilityField.tsx`(토글 UI). 적용: 스타트업(`0027`)·협력사(`0028`)·전문가(`0029`)·심사역(`0030`·**Admin 전용**)·소속(`0032`). 제외: 프로필/식별 카드(항상 표시)·'Phase 4 연동예정' Alert. 미구현 도메인(프로그램/펀드/프로젝트)=각 spec에 규약 인용 → 상세 구현 시 포함. 새 섹션 키 추가는 마이그레이션 불필요(normalize 가 누락 키=표시 보정).

#### ✅ 첨부파일 카드 — 전 도메인 공통 (2026-06-17)
모든 게시글 상세에 동일한 **임의 파일 업로드 + 개별/전체(zip) 다운로드** 카드([17_conventions.md](17_conventions.md) 4장·[PATTERNS.md](PATTERNS.md) 16장). 공통 컴포넌트 [EntityFilesBlock](../src/components/common/EntityFilesBlock.tsx) 한 줄(`entityType`+`entityId`)로 전 도메인(스타트업·협력사·전문가·심사역·소속) 적용. **새 테이블 없이** `uploaded_files` 폴리모픽 확장(`entity_type`/`entity_id`, `purpose='attachment'`, `0031`) + 비공개 reports 버킷 재사용. 다운로드는 기존 인프라(목적 입력 → 서명 URL → `log_file_download` 감사 로그) 재사용. **용량 제한 없음**(추후 S3). 각 도메인 `sections.attachments` 토글로 표시/숨김. 소속(부서)은 이 카드 도입으로 sections 인프라 신설(`0032`).

> **⚠️ 보류/결정 대기**: 스타트업 **담당 심사역 단수→다대다** 전환, **게시글 수정 권한**(전 직원→작성자/담당자 한정 여부)은 기획 미확정으로 보류. **결정 시점 = Phase 4 프로그램/프로젝트 심사역 매핑 직전**([20_roadmap.md](20_roadmap.md) Phase 4 '선결정 게이트', [6_startups.md](6_startups.md) 6.5).

#### 나머지 ⬜
- ⬜ 프로그램(programs) · ⬜ 펀드(funds) · ⬜ 프로젝트(projects)
- 이 단계에서 기존 연계 블록 플레이스홀더(담당 스타트업/프로젝트, 본부장·부서원, 자문 매칭 히스토리 등) 실제 연결

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
| `0032_departments_sections.sql` | 소속 카드 섹션 표시/숨김(sections jsonb 신설) | ✅ | [ ] |

> ⚠️ `0008`~`0032`는 **번호 순서대로** 실행. (`0011`이 `0010`의 RPC를 재생성, `0020`이 `0017` 이후 트리거 추가 등 의존 순서 존재) 모두 재실행 안전(idempotent). `0027`~`0030`은 각 도메인 기존 UPDATE RLS 재사용(별도 정책 불필요).

---

## 다음 작업
- ⬜ **프로그램(programs) 도메인** 진입 (Phase 4 두 번째). 이후 펀드→프로젝트. 스타트업의 '참여 프로그램/프로젝트 탭'은 해당 도메인 개발 시 조인 연결.
- ⚠️ **프로그램/프로젝트 심사역 매핑 착수 전 선결정**: 스타트업 담당 심사역 단수→다대다 여부 + 게시글 수정 권한 정책([6_startups.md](6_startups.md) 6.5 · [20_roadmap.md](20_roadmap.md) Phase 4 선결정 게이트).

---

구현 표준·규약은 [PATTERNS.md](PATTERNS.md) 참조.

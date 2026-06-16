# ✅ 개발 현황 (PROGRESS)

> 와이앤아처 PMS 개발 진행 상황 추적 문서. **작업을 완료할 때마다 이 문서의 완료 여부를 갱신한다.**
> 개발 순서 기준은 [20_roadmap.md](20_roadmap.md)의 Phase. (문서 번호 ≠ 개발 순서)
> 최종 갱신: **2026-06-16** (Phase 4 스타트업 기본 CRUD 착수)

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
- 🔵 **스타트업(startups)** — 기본 CRUD ✅(코드 완료, 품질게이트 통과): 목록(검색=기업명·대표자 / 필터=투자단계·담당심사역 / 정렬·페이지네이션)·상세·등록/수정(Drawer)·소프트삭제(Admin). partners 패턴 복제 + 고유요소(투자단계 `StartupStageTag`, 브랜드컬러 액센트, **로고 파일 업로드**=공통 `ProfileImageUploader` 일반화(logos 버킷·square), 담당 심사역 FK Select+상세 링크, **관리 현황**=발굴/보육/투자/기타[자유텍스트] `StartupStatusTag`+필터). RBAC: 작성/수정=Admin·Manager, 삭제=Admin(RLS는 이미 0002에 존재 → 0014는 메타컬럼·트리거만). `useManagerOptions` 추가. **마이그레이션 `0014`·`0015`·`0016_startups_management_status.sql` RUN 필요.**
  - ✅ 주주 구성 에디터(폼) + 지분율 PIE 차트(상세, Recharts) — `shareholders` jsonb, 마이그레이션 불필요.
  - ✅ 성장 지표(`startup_metrics`) — **재무·매출·고용·투자현황 4개 막대그래프 2×2 카드**(최신 5개년). 막대는 **최신 연도만 #E22213·이전 연도 회색**. 재무=자산·부채·자본(그룹), 매출=매출액(+영업이익·당기순이익 표), 고용=고용인원, 투자=투자유치액(+기업가치·라운드 표). **카드별 개별 입력**(연도+해당 항목)→같은 연도면 병합 저장(upsert onConflict startup_id,record_date). **`0018_startup_metrics_extend.sql` RUN 필요**(컬럼 확장).
  - 배치: 성장 지표 → 주주 구성 → 후속 보고 순.
  - ✅ 후속 보고(`startup_followups`) 트래커 — 제출률·제출현황·기한초과·파일링크 + 마일스톤 체크리스트(토글) + 추가/삭제. **`0017_startup_subrecords_write.sql` RUN 필요**(metrics·followups write/delete RLS).
  - ⬜ 후속(남은 것): 참여 프로그램·프로젝트 탭(프로그램/프로젝트 도메인 개발 후 연결).
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

> ⚠️ `0008`~`0013`은 **번호 순서대로** 실행. (`0011`이 `0010`의 RPC를 재생성하므로 순서 중요)

---

## 다음 작업
- ⬜ **프로그램(programs) 도메인** 진입 (Phase 4 두 번째). 이후 펀드→프로젝트. 스타트업의 '참여 프로그램/프로젝트 탭'은 해당 도메인 개발 시 조인 연결.

---

구현 표준·규약은 [PATTERNS.md](PATTERNS.md) 참조.

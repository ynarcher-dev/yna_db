# 🧱 구현 표준 패턴 — 목록·상세·CRUD (PATTERNS.md)

본 문서는 **코드로 확정된** 도메인 화면 구현 표준입니다. 기획 명세([17_conventions.md](17_conventions.md) 2·3장, [0_ui_ux.md](0_ui_ux.md), [2_policies.md](2_policies.md))를 실제 코드 합의로 구체화한 것으로, **전문가·부서·심사역 등 모든 단순 CRUD 도메인은 이 패턴을 그대로 복제**해 일관성을 유지합니다.

> **레퍼런스 구현(정답지)**: 협력사(partners). 새 도메인은 아래 파일들을 그대로 본떠 작성합니다.

---

## 1. 파일 구성 (도메인 1개당)

| 레이어 | 파일 | 협력사 예시 |
| :--- | :--- | :--- |
| 타입 | `src/types/{domain}.ts` | `partner.ts` — camelCase 모델 + DB row(snake) + `map*Row()` |
| 스키마 | `src/schemas/{domain}.ts` | `partner.ts` — zod, 등록/수정 공용 |
| 데이터 훅 | `src/hooks/use{Domain}s.ts` | `usePartners.ts` — 목록/단건/변이 |
| 표시 컴포넌트 | `src/components/{domain}/*` | `PartnerTypeTag`, `PartnerForm`, `PartnerFormDrawer` 등 |
| 화면 | `src/views/{domain}/{Domain}sListView.tsx`, `{Domain}DetailView.tsx` | |
| RLS | `supabase/migrations/000N_{domain}_write.sql` | `0005_partners_write.sql` |

공통 인프라(재사용, 새로 만들지 않음): `useListQuery`, `useListParams`, `useDebouncedValue`, `useAppToast`, `EmptyState`, `TableSkeleton`, `ConfirmModal`.

---

## 2. 데이터 레이어

* **목록**: `useListQuery<Row>` 사용 — `deleted_at IS NULL` 자동, 검색(`ilike` OR), 필터(`eq`/`in`), 정렬(`order`), 페이지네이션(`range`) + 총건수(`count: 'exact'`). 도메인 훅(`use{Domain}sList`)이 이를 감싸 row→모델 매핑.
* **상태 직렬화**: `useListParams({ filterKeys })` 로 검색·필터·정렬·페이지를 **URL 쿼리스트링**에 저장(공유·새로고침 유지). 페이지 크기 기본 20.
* **단건**: `use{Domain}(id)` — `enabled: Boolean(id)`, `.single()`, `deleted_at IS NULL`.
* **변이**: `use{Domain}Mutations()` — `create` / `update` / `remove`(소프트 삭제). 성공 시 `queryKey:[table]` 무효화. **try-catch 대신 raw 에러를 던지고** 호출부(FormDrawer/뷰)가 `useAppToast`로 피드백.
* **매핑**: camelCase(화면) ↔ snake_case(DB). 저장 시 빈 연락처는 `null`, 이메일은 소문자화.

---

## 3. 목록·테이블 UI 표준

> [!IMPORTANT]
> **모든 리스트 페이지 필수 양식**: 공통 메타 컬럼 **No. · 작성자 · 등록일 · 수정일 · 관리**는 전 도메인에서 **위치·크기·동작이 100% 동일**해야 한다. 반드시 [tableColumns.tsx](../src/lib/tableColumns.tsx)의 헬퍼(`numberColumn`/`authorColumn`/`createdAtColumn`/`updatedAtColumn`/`actionsColumn`)를 **그대로 사용**하고, 페이지별로 `width`·정렬·라벨을 절대 바꾸지 않는다. 크기를 바꿔야 한다면 헬퍼 한 곳만 수정해 전 페이지에 일괄 반영한다. 도메인 고유 컬럼만 No.와 작성자 사이에 끼워 넣는다.

* 헤더: 좌측 `text-2xl font-bold` 페이지 타이틀 + 우측 `{도메인} 등록` 버튼(Admin·Manager 노출).
* 툴바: `Input.Search`(검색어 **300ms 디바운스 후 URL 반영**) + 유형 `Select`(allowClear, 변경 시 URL 필터).
* `antd <Table>`:
  * **공통 메타 컬럼은 전 도메인 동일** — [tableColumns.tsx](../src/lib/tableColumns.tsx)의 헬퍼로 구성: 맨 왼쪽 `numberColumn`(No.), 오른쪽에 `authorColumn`(작성자)·`createdAtColumn`(등록일)·`updatedAtColumn`(수정일)·`actionsColumn`(관리=삭제, Admin). 도메인 고유 컬럼은 그 사이에 끼운다. 도메인 모델은 `ListRecord`(authorName/createdAt/updatedAt)를 만족해야 한다.
  * **No.**: `numberColumn(page, pageSize, total)` — 표시용 재계산 번호. `total - 전역위치`로 최신글이 맨 위·가장 큰 번호, 최초 작성글이 1번. 소프트 삭제 시 자동 재계산(빈 번호 없음, 영구 글번호 아님 — 식별자는 UUID). 폭은 만 단위(5자리) 수용.
  * **작성자**: `created_by` 임베드 이름. 값이 없으면 임시로 '관리자' 표시(추후 실제 계정명으로 대체).
  * 날짜 컬럼(등록일/수정일)은 폭을 좁게 고정(가운데 정렬)해 붙여 배치.
  * **텍스트 오버플로우**: 길어질 수 있는 텍스트 컬럼은 `ellipsis: true`로 말줄임 처리(말풍선 title 표시).
  * **DB 요건**(도메인마다 추가): `updated_at`(수정일) 컬럼 + 공통 트리거 [set_updated_at](../supabase/migrations/0006_partners_adjustments.sql)로 수정 시 자동 갱신(기존 행은 등록일로 backfill), `created_by`(작성자) 컬럼 + `DEFAULT auth.uid()` 자동 기록(2_policies 2.4), 목록·상세는 `managers` FK 임베드(`author:managers!{table}_created_by_fkey(name)`)로 작성자명 표시.
  * **행 전체 클릭 → 상세 이동** (`onRow` + `cursor-pointer`). 별도 **'상세' 버튼은 두지 않는다.**
  * 가장 우측 컬럼 제목은 **'관리'**, 내용은 **삭제 버튼(Admin 전용)** 1개. 버튼 `onClick`은 `e.stopPropagation()`으로 행 이동과 분리.
  * 정렬: `name`, `created_at` 등 서버 컬럼 기준 헤더 클릭 토글(`sorter: true` + `sortOrder` 제어), **기본 `created_at desc`**(최신글이 맨 위).
  * 페이지네이션: `pagination={false}` + 표 아래 공통 컴포넌트 [ListPagination](../src/components/common/listPagination.tsx) — 페이지 번호 중앙 정렬, 맨 앞으로(⏮)/맨 뒤로(⏭) 버튼, **"페이지 이동" 입력칸은 가장 우측**. 페이지당 20건 고정.
* 상태: 로딩=`Table loading`(또는 스켈레톤), 0건=`locale.emptyText`에 `EmptyState`+등록 CTA, 오류=`Alert`+다시 시도.
* 헤더 색은 전 컬럼 동일 회색(테마 `Table.headerBg`), 정렬 컬럼 음영 비활성(`bodySortBg: transparent`) — [theme.ts](../src/lib/theme.ts).

---

## 4. 상세 화면 표준

* 상단: `← {도메인} 목록` 뒤로가기 + 우측 `수정`(Admin·Manager) / `삭제`(Admin).
* **고유 블록 우선**(0_rules 4장): 프로필 카드(`Descriptions`) + 도메인 고유 이력(예: 교류이력 `Timeline`)만 먼저 구현.
* **연계 블록**(타 도메인 조인: 공동 프로젝트 등)은 **Phase 4**에서 연결. 그 전까지는 `Alert`로 "연동 예정" 플레이스홀더.
* 로딩=`TableSkeleton`, 없음/오류=`EmptyState`+목록으로.

---

## 5. 폼 표준

* `react-hook-form` + `zodResolver`, `mode: 'onBlur'`. antd 입력은 **`Controller`로 감싼다**(antd ref 비호환 회피).
* 에러는 필드 하단 인라인 `text-xs text-yna-point`.
* 등록·수정 **동일 스키마/폼 재사용**. `{Domain}FormDrawer`가 Drawer + 변이 호출 + 성공/실패 토스트 + 닫기를 중앙화 → 목록·상세 양쪽에서 동일하게 사용.

---

## 6. RBAC (화면 + RLS 양쪽)

* 화면: 역할(`useAuthStore().role`)로 버튼 노출 제어. (협력사 기준: 등록·수정=Admin/Manager, **삭제=Admin만**)
* RLS: 도메인별 `000N_{domain}_write.sql` 로 INSERT/UPDATE 정책 추가. **클라이언트 DELETE 정책은 만들지 않음**(영구 삭제 차단). 소프트 삭제는 `deleted_at` 기록 UPDATE이며 `WITH CHECK`로 **Manager의 `deleted_at` 설정을 차단**(Admin만 비활성화).
* [2_policies.md](2_policies.md) 2.2 권한 매트릭스를 도메인마다 그대로 반영. 도메인별 작성 권한 차이 주의(예: 펀드·부서는 작성도 Admin 전용).

---

## 7. 새 도메인 추가 체크리스트

1. 타입(`types/`) + 라벨/옵션([../src/lib/labels.ts](../src/lib/labels.ts)) + zod 스키마(`schemas/`).
2. 데이터 훅(`use{Domain}sList` / `use{Domain}` / `use{Domain}Mutations`).
3. 폼 + FormDrawer + 도메인 표시 컴포넌트.
4. 목록 뷰 + 상세 뷰, [AppRoutes.tsx](../src/routes/AppRoutes.tsx)에 `/{domain}`, `/{domain}/:id` 등록(플레이스홀더 제거).
5. **상세에 토글 가능한 보조 카드 섹션이 1개 이상이면 카드 섹션 표시/숨김(15장)을 포함**(`lib/{domain}Sections.ts` + `sections` 컬럼 + 폼 토글 + 상세 조건 렌더).
6. `000N_{domain}_write.sql` 작성 후 Supabase 실행 (SELECT는 [0004_rls_select.sql](../supabase/migrations/0004_rls_select.sql)에서 이미 열림).
7. 품질 게이트: `npm run lint && npm run typecheck && npm run test && npm run build`.

---

## 8. 도메인별 작성 권한(RBAC) — 코드 확정 매트릭스

화면 버튼 노출과 RLS 정책 **양쪽**에 동일하게 반영한다([2_policies.md](2_policies.md) 2.2 기준).

| 도메인 | 등록(Create) | 수정(Update) | 삭제(소프트) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| 협력사(partners) | Admin·Manager | Admin·Manager | **Admin** | `0005` |
| 전문가(experts) | Admin·Manager | Admin·Manager | **Admin** | `0008` |
| 소속(departments) | **Admin** | **Admin** | **Admin** | `0009`, Manager 전면 불가 |
| 심사역(managers) | **계정 발급(Edge Function)으로 분리** | **본인(RPC)** · Admin | **Admin(본인 제외)** | `0010`, 아래 9·10장 |

* 공통: **클라이언트 DELETE 정책은 만들지 않는다.** 삭제는 항상 `deleted_at` 기록 UPDATE(소프트). Manager 의 `deleted_at` 설정은 `WITH CHECK` 로 차단(Admin만 비활성화).
* 화면 버튼은 `useAuthStore().role`(및 본인 여부 `session.user.id === record.id`)로 노출 제어.

---

## 9. 사람-프로필 도메인 공통 (심사역·전문가)

심사역·전문가는 "사람 프로필" 골격을 공유한다([17_conventions.md](17_conventions.md) 6장). 아래 공통 컴포넌트·타입을 재사용하고 도메인 고유 블록만 따로 붙인다.

* **공통 컴포넌트(common)**: `PersonProfileCard`(아바타+이름+태그+직책·소속 서브타이틀 + intro 슬롯 + children=Descriptions), `ProfileImageUploader`(prop `folder`), `BiographyEditor`(입력), `BiographyView`(표시), `ProfileTextBlock`(소개 등 자유 텍스트), `SpecialtyTags`(관심 분야).
* **약력(biography)**: 공통 타입 [types/biography.ts](../src/types/biography.ts) + 스키마 [schemas/biography.ts](../src/schemas/biography.ts). 구성 = **학력 · 경력 · 자격증 · 수상**(jsonb). 신규 항목은 jsonb 키만 추가하면 되며(컬럼 불변), `normalizeBiography`가 누락 키를 빈 배열로 보정 → **DB 마이그레이션 불필요**.
  * **입력은 가로형**(한 항목의 필드를 한 줄로), **표시는 세로형**(영역을 위→아래로). **표시 시 값이 없는 섹션은 숨기고, 전부 비면 약력 카드 자체를 렌더링하지 않는다.**
* **상세 화면 구성(공통)**: `PersonProfileCard`(연락처/이메일/관심분야/날짜) → `BiographyView`(약력) → `ProfileTextBlock("소개")` → 도메인 고유 블록 → 연계(Phase 4) Alert.
  * 도메인 고유 블록: 전문가=멘토링 만족도(`view_expert_ratings`, antd `Rate`), 심사역=마이페이지(본인) 수정.

---

## 10. PostgREST 임베드 — FK 모호성 주의

두 테이블 사이에 **외래키가 2개 이상**이면 임베드 시 반드시 **제약명을 명시**한다. 안 하면 `more than one relationship was found` 런타임 오류로 목록/상세 조회가 통째로 실패한다.

* 형식: `alias:related!{constraint_fkey}(columns)`
* 작성자 임베드(공통): `author:managers!{table}_created_by_fkey(name)`.
* 실제 사례: `managers`↔`departments` 는 FK가 3개(`managers.department_id`, `departments.leader_id`, `departments.created_by`) → 소속명 임베드는 `department:departments!managers_department_id_fkey(name)` 로 지정.

---

## 11. 본인 수정(self-service) RPC — 심사역

심사역 본인 프로필은 RLS UPDATE 로 컬럼을 제한하기 어렵다(컬럼 단위 차단 불가). 따라서 **허용 컬럼만 갱신하는 `SECURITY DEFINER` RPC** 로 제공한다.

* `update_my_profile(...)` (`0010`/`0011`): `WHERE id = auth.uid()`, 갱신 허용 = 이름·연락처·관심분야·약력·이미지·소개. **직급·소속·역할·이메일은 제외**(Admin/Edge Function 영역).
* Admin 전체 수정은 RLS `managers_update_admin` 으로 **직접 UPDATE**(role/email 제외). 폼은 `mode: 'admin' | 'self'` 로 분기.
* 삭제(소프트)는 Admin 만, **본인 제외**(셀프 잠금 방지).

---

## 12. 파일 업로드 / Storage (avatars)

* 버킷 `avatars`(public read). 경로 규약 `{id}/{ts}.{ext}` (심사역=managerId, 전문가=expertId 또는 신규 시 임시 uuid).
* 쓰기 정책 = **직원(admin/manager) 전체**(전문가는 로그인 계정이 없어 직원이 대리 업로드). 정의: `0011`(버킷·정책 최초), `0012`(쓰기 정책 확장).
* 업로드는 공용 `ProfileImageUploader`(이미지 한정·2MB 제한) → 공개 URL 을 폼 값(`profileImageUrl`)으로 반영. 교체 시 이전 파일은 정리하지 않음(고아 파일 허용, 추후 정리 가능).

---

## 13. DB 마이그레이션 규약

* 파일명 `000N_{domain}_{목적}.sql`. **재실행 안전(idempotent)**: `IF NOT EXISTS` / `DROP ... IF EXISTS` / `ON CONFLICT` / `CREATE OR REPLACE`.
* 작성자는 SQL 파일만 만들고 **사용자가 Supabase SQL Editor 에서 직접 RUN**(번호 순서대로). RPC 시그니처 변경 시 `DROP FUNCTION IF EXISTS`(구 시그니처) 후 재생성.
* 도메인 공통 메타 컬럼 추가 패턴: `updated_at`(+공통 `set_updated_at()` 트리거 + 기존행 backfill) / `created_by UUID ... DEFAULT auth.uid()`.

---

## 14. 용어 표기 (화면 라벨)

* `specialties` → **관심 분야**, `greeting` → **소개**. **DB 컬럼명은 영문 그대로 두고 화면 표기만** 통일한다(라벨 변경이 스키마 변경을 의미하지 않음).

---

## 15. 상세 카드 섹션 표시/숨김 — 구현 표준 (Section Visibility)

상세 화면의 보조 카드 섹션을 등록·기본 수정 폼에서 켜고 끄는 전 도메인 공통 기능([17_conventions.md](17_conventions.md) 7장). **도메인별 복붙 대신 공통 인프라를 재사용**한다.

* **공통 인프라(새로 만들지 않음, 재사용)**
  * [lib/sectionVisibility.ts](../src/lib/sectionVisibility.ts) — `defineSections(keys, labels)` 팩토리. 도메인 설정 1개(`SectionConfig`)가 `keys`·`labels`·`defaults`·`normalize`·`schema`(zod)를 한 번에 제공.
  * [components/common/SectionVisibilityField.tsx](../src/components/common/SectionVisibilityField.tsx) — 토글 UI(표현 전용). 폼의 단일 `Controller name="sections"` 안에서 `value`/`onChange` 로 합성.
* **도메인별 추가물(레퍼런스: 스타트업 [lib/startupSections.ts](../src/lib/startupSections.ts))**
  1. `lib/{domain}Sections.ts` — `defineSections([...키] as const, {라벨})` 로 `{DOMAIN}_SECTIONS` 정의 + `DEFAULT_*`·`normalize*` 재노출. **키 순서 = 상세 렌더 순서.**
  2. 타입(`types/{domain}.ts`): 모델에 `sections: {Domain}Sections`, row 에 `sections: Partial<Record<string, boolean>> | null`, `map*Row` 에서 `normalize*(row.sections)`.
  3. 스키마(`schemas/{domain}.ts`): 입력 스키마에 `sections: {DOMAIN}_SECTIONS.schema`.
  4. 훅 `toRow`(심사역은 `toAdminRow`): `sections: input.sections` 저장.
  5. 폼: `EMPTY` 기본값에 `DEFAULT_{DOMAIN}_SECTIONS`, 본문에 `<Controller name="sections">` + `SectionVisibilityField`. `FormDrawer` `toInput` 에 `sections: x.sections`.
  6. 상세 뷰: 각 보조 섹션을 `{record}.sections.{key} ? <Block/> : null` 로 조건 렌더.
  7. 마이그레이션 `000N_{domain}_sections.sql`: `ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{...전체 true}'::jsonb`. **기존 도메인 UPDATE RLS 재사용**(별도 정책 불필요).
* **제외 대상**: 프로필/식별 카드(항상 표시), 'Phase 4 연동 예정' Alert.
* **권한 특례(심사역)**: 표시 설정은 Admin 전용. 본인 수정 RPC(`update_my_profile`)는 `sections` 미전송, 폼은 `mode==='admin'` 에서만 토글 렌더(9·11장 self/admin 분기와 동일).
* **적용 마이그레이션**: 스타트업 `0027`, 협력사 `0028`, 전문가 `0029`, 심사역 `0030`, 소속 `0032`(모두 사용자 RUN 필요).
* **새 섹션 키 추가**는 마이그레이션 불필요(jsonb·normalize 가 누락 키를 '표시'로 보정). 예: 첨부파일(`attachments`) 키는 각 `{domain}Sections.ts` 에 추가만 했고 `sections` 컬럼 default 는 그대로 둠.

---

## 16. 첨부파일 카드 — 구현 표준 (Entity Attachments)

모든 게시글 상세에 동일하게 들어가는 **임의 파일 업로드 + 개별/전체(zip) 다운로드** 카드([17_conventions.md](17_conventions.md) 4장). **새 테이블·도메인별 코드 없이** 공통 컴포넌트 하나를 재사용한다.

* **저장 구조(폴리모픽, 새 테이블 없음)**: 기존 `uploaded_files` 를 확장(`0031`).
  * `entity_type`(startup/partner/expert/manager/department/…) + `entity_id` 로 어느 레코드의 첨부인지 표시.
  * `purpose='attachment'`(기존 CHECK 에 추가). Storage 는 비공개 `reports` 버킷 재사용(경로 `attachment/{type}/{id}/{uuid}-{name}`).
  * 삭제 정책: `purpose='attachment'` 한정으로 직원(admin/manager) DELETE 허용(기존 uploaded_files 엔 DELETE 정책 없었음).
* **공통 코드(재사용, 도메인별 추가 없음)**
  * [components/common/EntityFilesBlock.tsx](../src/components/common/EntityFilesBlock.tsx) — 카드 전체(업로더+목록+개별/전체 다운로드). `<EntityFilesBlock entityType="startup" entityId={id} />` 한 줄로 사용.
  * [hooks/useEntityFiles.ts](../src/hooks/useEntityFiles.ts) — 목록 조회 + 삭제.
  * [lib/fileDownload.ts](../src/lib/fileDownload.ts) — `uploadEntityFile`(업로드+메타), `downloadFileWithLog`(개별), `downloadFilesAsZip`(일괄). 다운로드는 `DownloadPurposeModal`(목적) → 서명 URL → `log_file_download` RPC.
* **용량 제한 없음**(추후 S3). **로그는 DB 만**(화면 비노출, 4장).
* **상세 배치**: 각 도메인 상세 마지막 콘텐츠 카드로 렌더하고, 섹션 토글(`sections.attachments`, 15장)로 표시/숨김. 새 도메인은 상세 구현 시 이 카드를 포함한다.
* **적용 마이그레이션**: `0031`(uploaded_files 확장·attachment purpose·삭제정책), 소속은 `0032`(sections 컬럼 신설) 동반.

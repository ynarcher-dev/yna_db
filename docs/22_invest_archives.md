# 22. 투자 자료실 (Investment Archives)

## 22.1 기능 정의 및 목적
* **목적**: 투자 업무에 필수적인 각종 양식, 투자 계약서 템플릿, 시장 분석 보고서, 투자 심사 보고서 서식 등 공통 자료를 등록하고 검색/다운로드할 수 있는 사내 전용 게시판형 자료실을 제공합니다.

---

## 22.2 데이터 모델 요건

### 1) 투자 자료실 고유 속성 (Inherent Fields)
*   **테이블명**: `invest_archives`
*   **고유 컬럼**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | 게시글 고유 식별자 |
| `title` | `varchar(200)` | 자료실 게시글 제목 |
| `content` | `text` | 게시글 본문 및 설명 |
| `category` | `varchar(50)` | (미사용) 과거 카테고리 컬럼. 발주자 요청으로 UI에서 전면 제거했고 DB 컬럼만 기본값(`template`)으로 잔존. 작성·필터·표시 어디에도 노출하지 않음 |
| `is_pinned` | `boolean` | 상단 고정 공지사항 여부 (기본값 `false`) |
| `views` | `integer` | 조회수 (기본값 `0`) |
| `created_by` | `uuid` | 등록자/작성자 ID (`managers.id`) |
| `deleted_at` | `timestamp` | 소프트 딜리트 일시 |
| `created_at` | `timestamp` | 등록 일시 |
| `updated_at` | `timestamp` | 최종 수정 일시 |

### 2) 타 페이지 연계성 (Connectivity & Relations)
*   **첨부파일 연계**: 전 도메인 공통 첨부 인프라(공통 컴포넌트 `EntityFilesBlock` + `uploaded_files` 폴리모픽 확장)를 재사용합니다. **별도 테이블을 만들지 않습니다.** ([PATTERNS.md](PATTERNS.md) 16장)
    - `entity_type = 'invest_archive'`
    - `entity_id = invest_archives.id`
    - `purpose = 'attachment'` (비공개 `reports` 버킷 재사용, 용량 제한 없음)
    - 자료실에 첨부된 여러 개의 문서, PPTX, PDF, HWP 등의 양식 파일을 다운로드 및 업로드할 수 있도록 설계합니다.

### 🏷️ TypeScript Interface: `InvestArchive`
```typescript
interface InvestArchive {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  views: number;
  createdBy: string;
  authorName: string; // 작성자 이름 (조인)
  createdAt: string;
  updatedAt: string;
}
```

---

## 22.3 화면 기획 요건

### 1) 자료실 목록 뷰 (List View)
*   **상단 고정**: `is_pinned = true`인 게시글은 목록 최상단에 고정 표시하고 확연히 구분되는 배경(또는 배지)을 줍니다. (카테고리 필터는 제공하지 않음 — 발주자 요청으로 카테고리 폐지)
*   **검색 및 정렬**: 제목/본문 내용 키워드 검색을 지원하며, 최신순/조회수순 정렬 기준을 제공합니다.
*   **목록 정보 구성**: 제목, 작성자 이름, 등록 일자, 조회수를 표시합니다.

### 2) 자료실 상세 뷰 (Detail View)
*   **조회수 증가**: 상세 페이지 로딩 시 `views` 카운트를 1씩 증가시키는 Supabase RPC `increment_archive_views(p_id)`를 호출합니다(`SECURITY DEFINER`라 비작성자도 증가 가능). 레코드당 1회만 호출(StrictMode 이중 호출 가드).
*   **공통 첨부파일 다운로드 블록**: 상세 화면 하단에 공통 `EntityFilesBlock`(드래그앤드롭 업로드 + 개별/전체 zip 다운로드)을 렌더링하여 자료 양식을 원클릭으로 다운로드받습니다. 표시/숨김은 `sections.attachments` 토글(글쓰기/수정 폼)로 제어합니다([17_conventions.md](17_conventions.md) 7장).

### 3) 글쓰기/수정 폼 (Write/Edit Form)
*   제목, 상단 공지 고정 여부 토글, 본문 작성을 위한 텍스트 에어리어를 배치합니다. (카테고리 입력 없음)
*   **첨부파일은 등록/수정 Drawer 안에서 직접 다중 드래그앤드롭으로 첨부**합니다(발주자 요청).
    - **수정**: 이미 게시글 id 가 있으므로 공통 `EntityFilesBlock`(즉시 업로드/삭제/다운로드)을 Drawer 에 끼웁니다.
    - **등록**: id 가 없어 파일을 폼에 잠시 스테이징했다가, 글 생성 직후 `uploadEntityFile`로 새 글(`entity_id`)에 일괄 업로드합니다. 일부 실패 시 글은 남고 상세에서 재시도하도록 안내합니다.
    - 상세 화면 하단의 공통 첨부 카드(`EntityFilesBlock`)도 그대로 유지되어, 등록 후에도 추가 업로드/다운로드가 가능합니다.

---

## 22.4 권한 제어 요건 (RBAC)
* **읽기 (Read)**: 전 임직원 (전체 자료 조회 및 첨부파일 다운로드 가능)
* **작성 및 수정 (Create/Update)**: Admin / Manager (작성자 본인만 수정 가능하게 RLS 구성)
* **삭제 (Delete)**: Admin (전체 가능) / Manager (본인이 작성한 글만 가능하게 RLS 구성, 소프트 딜리트)

---

## 22.5 구현 메모 (코드 확정)

게시판형 단순 도메인으로 협력사(partners) CRUD 패턴을 복제하되, **상단 고정(공지)·조회수·작성자 본인 권한**만 다르다.

* **라우팅**: `/invest-archives`(목록) · `/invest-archives/:id`(상세). 메뉴=투자관리 그룹 '투자 자료실'.
* **목록 정렬 특례**: `is_pinned DESC`(고정 최상단) **1차** + 선택 정렬(등록일/조회수) **2차**. 단일 정렬뿐인 공통 `useListQuery` 대신 [useInvestArchives.ts](../src/hooks/useInvestArchives.ts)에서 직접 질의. 고정 행은 목록에서 배경 강조(`bg-yna-bg`)·제목 앞 `[공지]`.
* **검색**: 제목·본문 `ilike`(URL 직렬화). 조회수순은 `views` 컬럼 헤더 정렬로 제공. (카테고리 필터·배지·작성 입력은 폐지 — `category` 컬럼만 DB 기본값으로 잔존)
* **첨부 직접 첨부**: 첨부는 등록/수정 Drawer 에서 처리. 수정은 [EntityFilesBlock](../src/components/common/EntityFilesBlock.tsx) 즉시 업로드, 등록은 폼 스테이징 후 글 생성 직후 `uploadEntityFile` 일괄 업로드([InvestArchiveFormDrawer.tsx](../src/components/investArchives/InvestArchiveFormDrawer.tsx)).
* **권한 게이트(화면+RLS)**: 수정/삭제 버튼은 `작성자 본인(created_by=auth.uid) 또는 Admin`에게만 노출, RLS `invest_archives_update_owner`로 동일 강제.
* **섹션 토글**: 보조 카드는 첨부파일뿐 → `defineSections(['attachments'])`([investArchiveSections.ts](../src/lib/investArchiveSections.ts), 소속 도메인과 동일 구조). 본문·식별 정보는 항상 표시.
* **마이그레이션**: [0058_invest_archives.sql](../supabase/migrations/0058_invest_archives.sql) — 테이블(sections·메타 컬럼 포함)·RLS·`increment_archive_views` RPC. 첨부 `entity_type='invest_archive'`는 `uploaded_files.entity_type`(VARCHAR·CHECK 없음)이라 추가 마이그레이션 불필요.

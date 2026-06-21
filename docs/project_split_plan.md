# 프로젝트 관리 분리 구현 계획서 (M&A 관리 & 신사업 관리)

본 문서는 기존의 단일 '프로젝트 관리' 도메인을 **'M&A 관리'**와 **'신사업 관리'**의 두 개의 개별 페이지로 분리하기 위한 개발 계획 및 분석 내용을 담고 있습니다.

---

## 1. 개요 및 요구사항
* **목적**: 기존 단일 메뉴였던 "프로젝트 관리"를 비즈니스 성격에 맞추어 "M&A 관리"와 "신사업 관리" 두 개의 독립된 메뉴 및 페이지로 나눕니다.
* **기존 데이터 모델 재활용**: 데이터베이스의 `projects` 테이블과 `project_type` 필드(`'m_and_a'`, `'new_business'`)를 활용하여 데이터를 필터링하고 노출합니다.
* **기타('other') 유형 처리**: `'other'`(기타) 유형의 프로젝트를 어떻게 처리할지에 대한 결정이 필요합니다. (기본 제안: 기타 유형은 목록에서 제외하거나 필요한 별도 화면을 제공할 수 있으나, 본 계획에서는 두 메뉴에서 제외하는 것을 기준으로 작성하며 필요 시 논의에 따라 변경합니다.)

---

## 2. 주요 변경 사항 및 작업 요약

### ① 사이드바 내비게이션 분리 (`src/lib/navigation.ts`)
* 기존 `projects` 메뉴 아이템을 삭제합니다.
* 다음 두 개의 독립된 메뉴 아이템을 추가합니다:
  * **M&A 관리**: 경로 `/ma-projects`, 아이콘 `HiOutlineClipboardList` (또는 적절한 아이콘)
  * **신사업 관리**: 경로 `/new-biz-projects`, 아이콘 `HiOutlineCalendar` (또는 적절한 아이콘)

### ② 라우팅 분리 (`src/routes/AppRoutes.tsx`)
* 기존 `/projects` 및 `/projects/:id` 라우트를 제거합니다.
* 새로운 라우트를 추가하고 각각 분리된 뷰(View) 컴포넌트에 매핑합니다:
  * M&A 관리 목록: `/ma-projects` ➔ `MaProjectsListView`
  * M&A 관리 상세: `/ma-projects/:id` ➔ `MaProjectDetailView`
  * 신사업 관리 목록: `/new-biz-projects` ➔ `NewBizProjectsListView`
  * 신사업 관리 상세: `/new-biz-projects/:id` ➔ `NewBizProjectDetailView`

### ③ 뷰 컴포넌트 분리 (`src/views/projects/*`)
* 기존 `ProjectsListView.tsx`와 `ProjectDetailView.tsx`를 바탕으로 도메인별 뷰를 구현합니다.
  * **M&A 뷰 (`MaProjectsListView.tsx`, `MaProjectDetailView.tsx`)**:
    * `useProjectsList` 훅 호출 시 `projectType: 'm_and_a'`로 고정 필터링을 수행합니다.
    * 리스트 검색/필터 영역에서 "유형 전체" 셀렉트 박스를 제거합니다.
    * 프로젝트 등록 버튼 클릭 시 오픈되는 Drawer에서 프로젝트 유형이 `'m_and_a'`로 강제 지정되도록 처리합니다.
  * **신사업 뷰 (`NewBizProjectsListView.tsx`, `NewBizProjectDetailView.tsx`)**:
    * `useProjectsList` 훅 호출 시 `projectType: 'new_business'`로 고정 필터링을 수행합니다.
    * 리스트 검색/필터 영역에서 "유형 전체" 셀렉트 박스를 제거합니다.
    * 프로젝트 등록 버튼 클릭 시 오픈되는 Drawer에서 프로젝트 유형이 `'new_business'`로 강제 지정되도록 처리합니다.

### ④ 등록 및 수정 폼 Drawer 수정 (`src/components/projects/*`)
* `ProjectFormDrawer.tsx` 및 `ProjectForm.tsx` 컴포넌트 수정:
  * 폼 내부에서 프로젝트 유형(`projectType`) 입력란을 보이지 않게 숨기거나 읽기 전용(disabled) 처리합니다.
  * 진입한 페이지(M&A 혹은 신사업)에 맞춰 유형 기본값이 자동 할당되도록 `props`나 초기값 설정을 변경합니다.

---

## 3. 다른 에이전트 개발 지시용 가이드 (필독 파일 목록)

개발을 담당할 다른 에이전트에게 **아래 파일들을 먼저 읽고 파악한 뒤 작업을 시작하도록 지시**하십시오.

| 읽어보아야 할 파일 경로 | 역할 및 분석 포인트 |
| :--- | :--- |
| [docs/10_projects.md](file:///c:/Users/Admin/Desktop/yna_db-master/docs/10_projects.md) | 프로젝트 관리의 기존 요구사항, DB 스키마 명세 및 권한 제어(RBAC) 규칙 파악 |
| [src/lib/navigation.ts](file:///c:/Users/Admin/Desktop/yna_db-master/src/lib/navigation.ts) | 사이드바 메뉴 구조 확인 및 M&A / 신사업 관리 메뉴 추가 위치 파악 |
| [src/routes/AppRoutes.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/routes/AppRoutes.tsx) | 기존 프로젝트 라우트 확인 및 신규 `/ma-projects`, `/new-biz-projects` 라우트 등록 방법 구상 |
| [src/types/database.ts](file:///c:/Users/Admin/Desktop/yna_db-master/src/types/database.ts) | `ProjectType` 선언 확인 (`'m_and_a' \| 'new_business' \| 'other'`) |
| [src/types/project.ts](file:///c:/Users/Admin/Desktop/yna_db-master/src/types/project.ts) | 프로젝트 프론트엔드 인터페이스 구조 및 DB 매핑 함수(`mapProjectRow`) 파악 |
| [src/hooks/useProjects.ts](file:///c:/Users/Admin/Desktop/yna_db-master/src/hooks/useProjects.ts) | `useProjectsList` 훅이 `projectType` 인자를 필터링 조건으로 처리하는 방식 확인 |
| [src/views/projects/ProjectsListView.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/views/projects/ProjectsListView.tsx) | 기존 프로젝트 목록 조회 화면의 필터, 정렬, 페이지네이션 처리 구조 파악 (신규 리스트 뷰 작성 시 복제 및 가공의 기준점) |
| [src/views/projects/ProjectDetailView.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/views/projects/ProjectDetailView.tsx) | 프로젝트 상세 화면 및 연계 패널(담당자, 스타트업, 협력사 매핑) 렌더링 방식 확인 |
| [src/components/projects/ProjectForm.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/components/projects/ProjectForm.tsx) | 프로젝트 생성 및 수정 폼의 입력 필드와 기본값 구성 확인 (`projectType` 입력란 제거/숨김 방법 파악) |
| [src/components/projects/ProjectFormDrawer.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/components/projects/ProjectFormDrawer.tsx) | 폼 Drawer가 열리고 닫히는 트리거 구조와 초기 상태값 제어 방식 확인 |
| [src/lib/listColumns.tsx](file:///c:/Users/Admin/Desktop/yna_db-master/src/lib/listColumns.tsx) | `projectColumns` 정의 확인 (두 목록 뷰에서 "유형" 컬럼 노출 여부를 조절하기 위해 옵션 추가 필요성 분석) |

---

## 4. 검증 계획
* **사이드바 동작 확인**: 사이드바에 "M&A 관리", "신사업 관리" 메뉴가 올바르게 보이고 클릭 시 각 페이지로 이동하는지 확인.
* **필터링 기능 검증**:
  * M&A 관리 목록에서는 오직 M&A 유형의 프로젝트만 로드되는지 확인.
  * 신사업 관리 목록에서는 오직 신사업 유형의 프로젝트만 로드되는지 확인.
* **등록 기능 검증**:
  * M&A 관리 페이지에서 등록한 프로젝트가 데이터베이스에 `project_type: 'm_and_a'`로 올바르게 인서트되는지 확인.
  * 신사업 관리 페이지에서 등록한 프로젝트가 데이터베이스에 `project_type: 'new_business'`로 올바르게 인서트되는지 확인.
* **상세 페이지 및 매핑 패널 검증**: M&A 관리 상세 페이지(`ma-projects/:id`) 및 신사업 관리 상세 페이지(`new-biz-projects/:id`)에서 데이터 로드와 담당자/스타트업/협력사 매핑 패널이 오류 없이 작동하는지 확인.

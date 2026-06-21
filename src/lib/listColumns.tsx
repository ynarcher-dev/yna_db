import { Tag, type TableProps } from 'antd';
import { formatDate, formatKRWShort } from '@/lib/formatters';
import { ProjectStageTag } from '@/components/projects/ProjectStageTag';
import { BusinessStatusTag } from '@/components/businesses/BusinessStatusTag';
import { StartupStageTag } from '@/components/startups/StartupStageTag';
import { StartupStatusTag } from '@/components/startups/StartupStatusTag';
import { PartnerTypeTag } from '@/components/partners/PartnerTypeTag';
import { RoleTag } from '@/components/managers/RoleTag';
import { SpecialtyTags } from '@/components/experts/SpecialtyTags';
import { MatchingProgramStatusTag } from '@/components/matchingPrograms/MatchingProgramStatusTag';
import type { Business } from '@/types/business';
import type { Project } from '@/types/project';
import type { Startup } from '@/types/startup';
import type { Partner } from '@/types/partner';
import type { Manager } from '@/types/manager';
import type { MatchingProgram } from '@/types/matchingProgram';
import type { InvestArchive } from '@/types/investArchive';

type Column<T> = NonNullable<TableProps<T>['columns']>[number];
type SortOrder = 'ascend' | 'descend' | null;

/**
 * 도메인 고유(=메타 5컬럼 제외) 목록 컬럼의 단일 정의 (PATTERNS.md 3장 보완).
 * 같은 컬럼을 (a) 목록 화면과 (b) 역방향 연계 카드가 함께 쓴다 → 한 곳만 고치면 양쪽이 맞는다.
 * 목록 화면은 `sortOrderOf` 를 주어 정렬 가능 컬럼을 켜고, 역방향 카드는 생략해 정렬 없이 표시만 한다.
 * 메타 컬럼(No.·책임자·등록일·수정일·관리)은 목록 화면에서 tableColumns.tsx 헬퍼로 따로 감싼다.
 */
interface DomainColumnOpts {
  /** 주어지면 해당 키 컬럼을 정렬 가능(sorter)으로 만든다. 역방향 카드에서는 생략. */
  sortOrderOf?: (key: string) => SortOrder;
}

const sortProps = <T,>(opts: DomainColumnOpts | undefined, key: string): Partial<Column<T>> =>
  opts?.sortOrderOf ? { sorter: true, sortOrder: opts.sortOrderOf(key) } : {};

/**
 * 사업 고유 컬럼: 사업명·기간·상태·담당자.
 * 사업·M&A·신사업 목록을 동일 구조로 통일(2026-06-21) — projectColumns 와 같은 순서/폭.
 */
export const businessColumns = (opts?: DomainColumnOpts): Column<Business>[] => [
  {
    title: '사업명',
    key: 'name',
    width: 220,
    ellipsis: true,
    ...sortProps<Business>(opts, 'name'),
    render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
  },
  {
    title: '기간',
    key: 'period',
    width: 180,
    ellipsis: true,
    render: (_, r) => `${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}`,
  },
  {
    title: '상태',
    key: 'status',
    width: 90,
    render: (_, r) => <BusinessStatusTag status={r.status} />,
  },
  {
    title: '담당자',
    key: 'managers',
    width: 140,
    ellipsis: { showTitle: true },
    render: (_, r) => (r.managerNames.length ? r.managerNames.join(', ') : '-'),
  },
];

/** 매칭 프로그램 고유 컬럼: 프로그램명·주관 기관·시행 연도·상태·매칭 예산. */
export const matchingProgramColumns = (opts?: DomainColumnOpts): Column<MatchingProgram>[] => [
  {
    title: '프로그램명',
    key: 'name',
    width: 200,
    ellipsis: true,
    ...sortProps<MatchingProgram>(opts, 'name'),
    render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
  },
  { title: '주관 기관', key: 'agency', width: 160, ellipsis: true, render: (_, r) => r.agency || '-' },
  {
    title: '연도',
    key: 'year',
    width: 80,
    align: 'center',
    ...sortProps<MatchingProgram>(opts, 'year'),
    render: (_, r) => `${r.year}년`,
  },
  {
    title: '상태',
    key: 'status',
    width: 90,
    render: (_, r) => <MatchingProgramStatusTag status={r.status} />,
  },
  {
    title: '매칭 예산',
    key: 'budget',
    width: 110,
    align: 'right',
    render: (_, r) => formatKRWShort(r.budget),
  },
];

/** 투자 자료실 고유 컬럼: 제목(고정 배지)·조회수. */
export const investArchiveColumns = (opts?: DomainColumnOpts): Column<InvestArchive>[] => [
  {
    title: '제목',
    key: 'title',
    ellipsis: true,
    ...sortProps<InvestArchive>(opts, 'title'),
    render: (_, r) => (
      <span className="font-medium text-yna-main">
        {r.isPinned ? <span className="mr-1 text-yna-point">[공지]</span> : null}
        {r.title}
      </span>
    ),
  },
  {
    title: '조회수',
    key: 'views',
    width: 90,
    align: 'center',
    ...sortProps<InvestArchive>(opts, 'views'),
    render: (_, r) => r.views.toLocaleString('ko-KR'),
  },
];

/** 스타트업 고유 컬럼: 기업명(브랜드색)·대표자·투자단계·관리현황·담당자·기업설명. */
export const startupColumns = (opts?: DomainColumnOpts): Column<Startup>[] => [
  {
    title: '기업명',
    key: 'name',
    width: 180,
    ellipsis: true,
    ...sortProps<Startup>(opts, 'name'),
    render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
  },
  { title: '대표자', key: 'ceo_name', width: 120, ellipsis: true, render: (_, r) => r.ceoName },
  {
    title: '투자 단계',
    key: 'investment_stage',
    width: 130,
    render: (_, r) => <StartupStageTag stage={r.investmentStage} />,
  },
  {
    title: '관리 현황',
    key: 'management_status',
    width: 120,
    render: (_, r) => <StartupStatusTag status={r.managementStatus} etc={r.managementStatusEtc} />,
  },
  {
    title: '기업 설명',
    key: 'description',
    width: 360,
    ellipsis: { showTitle: true },
    render: (_, r) => r.description || '-',
  },
  {
    title: '담당자',
    key: 'manager',
    width: 100, // 공용 메타 '작성자' 컬럼과 동일 폭(tableColumns.authorColumn)
    ellipsis: { showTitle: true },
    // 담당자는 '투자기업'(invested)에만 노출한다. 그 외(발굴·보육·기타)는 무조건 '-'.
    render: (_, r) =>
      r.managementStatus === 'invested' && r.managerNames.length ? r.managerNames.join(', ') : '-',
  },
];

/** 심사역 고유 컬럼: 이름·직급·소속·관심 분야·등급(직책). (목록에서 본인 행에 '나' 태그) */
export const managerColumns = (
  opts?: DomainColumnOpts & { myId?: string },
): Column<Manager>[] => [
  {
    title: '이름',
    key: 'name',
    width: 130,
    ellipsis: true,
    ...sortProps<Manager>(opts, 'name'),
    render: (_, r) => (
      <span className="font-medium text-yna-main">
        {r.name}
        {opts?.myId && r.id === opts.myId ? (
          <Tag color="green" className="ml-2">
            나
          </Tag>
        ) : null}
      </span>
    ),
  },
  { title: '직급', key: 'position', width: 120, ellipsis: true, render: (_, r) => r.position },
  {
    title: '소속',
    key: 'department',
    ellipsis: { showTitle: true },
    render: (_, r) => {
      const parts = [r.companyName, r.departmentName, r.teamName].filter(Boolean);
      return parts.length ? parts.join(' · ') : '-';
    },
  },
  {
    title: '관심 분야',
    key: 'specialties',
    ellipsis: true,
    render: (_, r) => <SpecialtyTags specialties={r.specialties} />,
  },
  { title: '등급', key: 'role', width: 90, render: (_, r) => <RoleTag role={r.role} /> },
];

/** 협력사 고유 컬럼: 기업/기관명·부서명·유형·담당자(해당 기업 측 연락 담당)·이메일. */
export const partnerColumns = (opts?: DomainColumnOpts): Column<Partner>[] => [
  {
    title: '기업/기관명',
    key: 'name',
    ellipsis: true,
    ...sortProps<Partner>(opts, 'name'),
    render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
  },
  { title: '부서명', key: 'department', ellipsis: true, render: (_, r) => r.department || '-' },
  {
    title: '유형',
    key: 'partner_type',
    width: 130,
    render: (_, r) => <PartnerTypeTag type={r.partnerType} />,
  },
  {
    title: '담당자(해당 기업)',
    key: 'contact_person',
    ellipsis: true,
    render: (_, r) => r.contactPerson,
  },
  { title: '이메일', key: 'email', ellipsis: true, render: (_, r) => r.email || '-' },
];

/**
 * 프로젝트 고유 컬럼: 프로젝트명·기간·상태·담당자.
 * M&A·신사업·사업 목록을 동일 구조로 통일(2026-06-21) — businessColumns 와 같은 순서/폭.
 * 유형은 진입 메뉴로 고정, 우선순위는 폼/상세에서만 다루므로 목록 컬럼에서는 제외한다.
 */
export const projectColumns = (opts?: DomainColumnOpts): Column<Project>[] => [
  {
    title: '프로젝트명',
    key: 'name',
    width: 220,
    ellipsis: true,
    ...sortProps<Project>(opts, 'name'),
    render: (_, r) => <span className="font-medium text-yna-main">{r.name}</span>,
  },
  {
    title: '기간',
    key: 'period',
    width: 180,
    ellipsis: true,
    render: (_, r) => `${formatDate(r.startDate)} ~ ${r.endDate ? formatDate(r.endDate) : ''}`,
  },
  {
    title: '상태',
    key: 'stage',
    width: 90,
    render: (_, r) => <ProjectStageTag stage={r.stage} />,
  },
  {
    title: '담당자',
    key: 'managers',
    width: 140,
    ellipsis: { showTitle: true },
    render: (_, r) => (r.managerNames.length ? r.managerNames.join(', ') : '-'),
  },
];

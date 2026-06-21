import type { TableProps } from 'antd';
import { Button } from 'antd';
import { formatDate, formatKRWMillions } from '@/lib/formatters';

type Column<T> = NonNullable<TableProps<T>['columns']>[number];
type SortOrder = 'ascend' | 'descend' | null;

/**
 * 모든 도메인 목록 테이블이 공통으로 갖는 메타 컬럼 (PATTERNS.md 3장).
 * No. · 작성자 · 등록일 · 최종반영일 · 관리 는 전 도메인 동일하게 이 헬퍼로 구성한다.
 * 도메인 고유 컬럼은 그 사이(기업명·유형 등)에 끼워 넣는다.
 */

/** 도메인 모델 공통 메타 필드 (작성자/등록일/최종반영일). */
export interface ListRecord {
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

/** No. — 표시용 재계산 번호(최신 위=큰 번호, 최초=1번). 만 단위(5자리)까지 수용하는 폭. */
export const numberColumn = <T,>(page: number, pageSize: number, total: number): Column<T> => ({
  title: 'No.',
  key: '_no',
  width: 84,
  align: 'center',
  render: (_v, _r, index) => total - ((page - 1) * pageSize + index),
});

/** 매출/이익을 가진 도메인 모델 공통 필드 (사업·프로젝트). */
export interface FinanceRecord {
  revenue: number;
  profit: number;
}

/**
 * 매출·이익 컬럼 (사업·M&A·신사업 목록 공용, 목록 화면 전용 — 연동 카드에는 노출하지 않음).
 * 금액은 일괄 백만원 단위(헤더 '(백만)' 표기, 셀은 숫자만). 이익은 손실 시 음수.
 */
export const financeColumns = <T extends FinanceRecord>(): Column<T>[] => [
  {
    title: '매출(백만)',
    key: 'revenue',
    width: 110,
    align: 'right',
    render: (_v, r) => formatKRWMillions(r.revenue, false),
  },
  {
    title: '이익(백만)',
    key: 'profit',
    width: 110,
    align: 'right',
    render: (_v, r) => formatKRWMillions(r.profit, false),
  },
];

/** 작성자 (created_by FK 임베드 이름 = 게시글 등록자). 값이 없으면 임시로 '관리자' 표시. */
export const authorColumn = <T extends ListRecord>(): Column<T> => ({
  title: '작성자',
  key: 'created_by',
  width: 100,
  align: 'center',
  ellipsis: true,
  render: (_v, r) => r.authorName || '관리자',
});

/** 등록일 (정렬 가능). 날짜 컬럼은 폭을 좁게 고정. */
export const createdAtColumn = <T extends ListRecord>(sortOrder: SortOrder): Column<T> => ({
  title: '등록일',
  key: 'created_at',
  width: 108,
  align: 'center',
  sorter: true,
  sortOrder,
  render: (_v, r) => formatDate(r.createdAt),
});

/** 수정일 (정렬 가능). */
export const updatedAtColumn = <T extends ListRecord>(sortOrder: SortOrder): Column<T> => ({
  title: '수정일',
  key: 'updated_at',
  width: 108,
  align: 'center',
  sorter: true,
  sortOrder,
  render: (_v, r) => formatDate(r.updatedAt),
});

/**
 * 관리 — 삭제 버튼. 기본은 Admin 전용(isAdmin)이지만, 도메인별로 행마다 삭제 가능 여부가
 * 다르면(예: 프로젝트 = 책임자+관리자) `canDelete` 술어를 주어 행 단위로 노출을 제어한다.
 * 행 클릭(상세 이동)과 분리하기 위해 stopPropagation.
 */
export const actionsColumn = <T,>(opts: {
  isAdmin: boolean;
  onDelete: (record: T) => void;
  /** 행별 삭제 가능 여부. 주어지면 isAdmin 대신 이 술어로 노출을 판단한다. */
  canDelete?: (record: T) => boolean;
}): Column<T> => ({
  title: '관리',
  key: 'actions',
  width: 76,
  align: 'center',
  render: (_v, r) =>
    (opts.canDelete ? opts.canDelete(r) : opts.isAdmin) ? (
      <Button
        size="small"
        danger
        onClick={(e) => {
          e.stopPropagation();
          opts.onDelete(r);
        }}
      >
        삭제
      </Button>
    ) : null,
});

import { type ReactNode } from 'react';
import { ConfigProvider, Table } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';

export interface RelatedTableCardProps<T> {
  /** 카드 제목. 옆에 '(연동)' 포인트 라벨이 자동으로 붙는다. */
  title: string;
  columns: TableProps<T>['columns'];
  data: T[];
  /** 비었을 때 안내 문구 */
  emptyText: string;
  /** 행 클릭 시 이동할 상세 경로 */
  getHref: (row: T) => string;
  isLoading?: boolean;
  /** 행 식별 키 (기본 'id') */
  rowKey?: string;
  /** 표 아래 편집 컨트롤 슬롯 (읽기 전용 패널은 생략). */
  footer?: ReactNode;
}

/**
 * 연동(다른 도메인 연계) 데이터 표를 카드로 감싸는 공통 셸.
 * 제목 + (연동) 라벨 + 표(행 클릭 시 상세 이동) + 빈 상태를 한곳에서 책임진다.
 * 컬럼·데이터·이동 경로만 주입하면 되고, 편집형 패널은 footer 로 추가/해제 컨트롤을 끼운다.
 * 표시는 각 도메인 목록과 동일한 컬럼(listColumns)을 재사용한다.
 *
 * 컬럼 합이 카드 폭보다 넓으면 카드 밖으로 삐져나가지 않도록 가로 스크롤(scroll.x)로 가둔다.
 */
export function RelatedTableCard<T extends object>({
  title,
  columns,
  data,
  emptyText,
  getHref,
  isLoading,
  rowKey = 'id',
  footer,
}: RelatedTableCardProps<T>) {
  const navigate = useNavigate();

  const isEmpty = data.length === 0 && !isLoading;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        {title}
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {isEmpty ? (
        <EmptyState message={emptyText} />
      ) : (
        // 연동 표는 size="small"(셀 좌우 8px)이라 첫 컬럼이 카드 안쪽에 바짝 붙어 답답하다.
        // 세로(행 높이)는 컴팩트하게 두고, 좌우 셀 패딩만 메인 목록과 같은 16px로 넓힌다.
        <ConfigProvider theme={{ components: { Table: { cellPaddingInlineSM: 16 } } }}>
          <Table<T>
            rowKey={rowKey}
            size="small"
            className={footer ? 'mb-4' : undefined}
            loading={isLoading}
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={(row) => ({
              onClick: () => navigate(getHref(row)),
              style: { cursor: 'pointer' },
            })}
          />
        </ConfigProvider>
      )}

      {footer}
    </div>
  );
}

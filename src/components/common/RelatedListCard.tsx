import { Spin, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';

/** 역방향 연계 목록 1행 (다른 도메인 레코드로 이동하는 링크). */
export interface RelatedItem {
  key: string;
  /** 이동 대상 경로 (예: /startups/:id) */
  to: string;
  /** 주 텍스트 (레코드 이름) */
  primary: string;
  /** 보조 텍스트 (기수·금액 등). 우측 회색 */
  secondary?: string;
  /** 상태/역할 배지 */
  badge?: { text: string; color?: string };
}

/**
 * 역방향 연계 카드 (양방향 연결 공통 표시). 상대 레코드 목록을 링크로 렌더한다.
 * 데이터 출처별 매핑은 각 상세 화면이 담당하고, 본 컴포넌트는 표현만 책임진다.
 * 역방향(보여지는 쪽)임을 시각적으로 구분하기 위해 섹션명 옆 (연동) 라벨을 포인트색으로 표시한다.
 * (테두리는 정방향 카드와 동일한 회색 yna-border 로 통일.)
 */
export function RelatedListCard({
  title,
  items,
  isLoading,
  emptyText,
}: {
  title: string;
  items: RelatedItem[];
  isLoading?: boolean;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        {title}
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>
      {isLoading ? (
        <Spin size="small" />
      ) : items.length === 0 ? (
        <EmptyState message={emptyText} />
      ) : (
        <ul className="divide-y divide-yna-border">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-2 py-2">
              {it.badge ? (
                <Tag color={it.badge.color} className="m-0 shrink-0">
                  {it.badge.text}
                </Tag>
              ) : null}
              <Link className="flex-1 truncate text-yna-point" to={it.to}>
                {it.primary}
              </Link>
              {it.secondary ? (
                <span className="shrink-0 text-xs text-yna-sub">{it.secondary}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Pagination, InputNumber } from 'antd';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';

/**
 * 목록 테이블 공통 페이지네이션 (PATTERNS.md 3장).
 * - 페이지 번호는 화면 중앙 정렬, 맨 앞으로(⏮)/맨 뒤로(⏭) 버튼 합성.
 * - "페이지 이동" 입력칸은 가장 우측에 별도 배치.
 * - 1페이지뿐이면 렌더하지 않는다(antd 기본 동작과 동일).
 * Table 은 pagination={false} 로 두고 이 컴포넌트를 표 아래에 렌더한다.
 */
const jumpButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md text-yna-sub transition hover:text-yna-point disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-yna-sub';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function ListPagination({ page, pageSize, total, onChange }: ListPaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const [jump, setJump] = useState<number | null>(null);

  if (total <= pageSize) return null;

  const go = () => {
    if (jump && jump >= 1 && jump <= lastPage) {
      onChange(jump);
      setJump(null);
    }
  };

  return (
    <div className="relative mt-4 flex items-center justify-center">
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger={false}
        onChange={onChange}
        itemRender={(_p, type, originalElement) => {
          if (type === 'prev') {
            return (
              <span className="flex items-center">
                <button
                  type="button"
                  aria-label="맨 앞으로"
                  className={jumpButtonClass}
                  disabled={page <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (page > 1) onChange(1);
                  }}
                >
                  <HiChevronDoubleLeft />
                </button>
                {originalElement}
              </span>
            );
          }
          if (type === 'next') {
            return (
              <span className="flex items-center">
                {originalElement}
                <button
                  type="button"
                  aria-label="맨 뒤로"
                  className={jumpButtonClass}
                  disabled={page >= lastPage}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (page < lastPage) onChange(lastPage);
                  }}
                >
                  <HiChevronDoubleRight />
                </button>
              </span>
            );
          }
          return originalElement;
        }}
      />

      <div className="absolute right-0 flex items-center gap-1 text-sm text-yna-sub">
        <span>페이지 이동</span>
        <InputNumber
          size="small"
          min={1}
          max={lastPage}
          value={jump ?? undefined}
          onChange={(v) => setJump(typeof v === 'number' ? v : null)}
          onPressEnter={go}
          className="w-16"
        />
      </div>
    </div>
  );
}

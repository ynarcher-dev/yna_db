import { InputNumber } from 'antd';

/**
 * 숫자 범위(min~max) 목록 필터. 매출·이익 등 금액 조회에 쓴다.
 * 값 단위는 호출부가 정한다(매출·이익은 백만원 단위) — 라벨로 단위를 표기한다.
 */
export function NumberRangeFilter({
  label,
  min,
  max,
  onChange,
}: {
  label: string;
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
}) {
  const toNum = (v: number | string | null): number | undefined =>
    typeof v === 'number' ? v : undefined;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="whitespace-nowrap text-sm text-yna-sub">{label}</span>
      <InputNumber
        className="w-24"
        placeholder="최소"
        value={min ?? null}
        onChange={(v) => onChange(toNum(v), max)}
        formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
      />
      <span className="text-yna-sub">~</span>
      <InputNumber
        className="w-24"
        placeholder="최대"
        value={max ?? null}
        onChange={(v) => onChange(min, toNum(v))}
        formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
      />
    </span>
  );
}

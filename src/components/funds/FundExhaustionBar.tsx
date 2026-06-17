import { Progress } from 'antd';
import { fundExhaustionRate } from '@/types/fund';
import { formatKRWShort } from '@/lib/formatters';

/**
 * 펀드 소진율 진척 바 (8_funds.md 8.3 — 재무 정보 카드).
 * 소진율 = (결성 총액 - 잔액) / 총액. 잔액/총액 축약 라벨을 함께 표기한다.
 */
export function FundExhaustionBar({
  totalAmount,
  balance,
  compact = false,
}: {
  totalAmount: number;
  balance: number;
  compact?: boolean;
}) {
  const rate = fundExhaustionRate({ totalAmount, balance });
  const invested = Math.max(0, totalAmount - balance);

  return (
    <div className={compact ? 'w-40' : 'w-full'}>
      <Progress
        percent={Math.round(rate * 10) / 10}
        size={compact ? 'small' : 'default'}
        strokeColor="#515151"
      />
      {compact ? null : (
        <div className="mt-1 flex justify-between text-xs text-yna-sub">
          <span>집행 {formatKRWShort(invested)}</span>
          <span>잔액 {formatKRWShort(balance)}</span>
        </div>
      )}
    </div>
  );
}

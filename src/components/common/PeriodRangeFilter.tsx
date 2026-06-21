import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * 목록 기간 조회 필터 (시작~종료 범위 겹침). 사업·M&A·신사업 목록이 공유한다.
 * 값은 YYYY-MM-DD 문자열 한 쌍으로 다루며, URL 상태(useListParams.setDateRange)에 직렬화된다.
 */
export function PeriodRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from?: string, to?: string) => void;
}) {
  return (
    <RangePicker
      allowClear
      placeholder={['기간 시작', '기간 종료']}
      value={[from ? dayjs(from) : null, to ? dayjs(to) : null]}
      onChange={(range) =>
        onChange(
          range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
          range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
        )
      }
    />
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatKRW } from '@/lib/formatters';

/**
 * 성장 지표 막대그래프 (6_startups.md Detail Tab 1).
 * 카드별로 관련 지표를 한 그래프에 묶어 지표별 색으로 표시한다.
 * 규모 차가 큰 지표(예: 투자유치액)는 보조축(우측)으로 분리한다.
 * 음수(적자·자본잠식)는 0 기준선 아래로 표시한다.
 */
const wonTick = (v: number) =>
  v === 0 ? '0' : Math.abs(v) >= 1e8 ? `${Math.round(v / 1e8)}억` : v.toLocaleString('ko-KR');

export interface MetricSeries {
  key: string;
  name: string;
  color: string;
  /** 보조축에 그릴 지표는 'right'. 기본 'left'. */
  yAxisId?: 'left' | 'right';
}

interface YearDatum {
  year: string;
  [key: string]: string | number;
}

export function MetricBarChart({
  data,
  series,
  unit,
}: {
  data: YearDatum[];
  series: MetricSeries[];
  unit: 'won' | 'count';
}) {
  const hasRight = series.some((s) => s.yAxisId === 'right');
  const tick = unit === 'won' ? wonTick : (v: number) => `${v}`;
  const tipFmt = (value: number) =>
    unit === 'won' ? formatKRW(value) : `${value.toLocaleString('ko-KR')}명`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap="28%">
        {/* 가로 그리드만 연하게 — 비데이터 잉크 최소화 */}
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={{ stroke: '#e5e5e5' }} />
        <YAxis
          yAxisId="left"
          tickFormatter={tick}
          fontSize={12}
          width={unit === 'won' ? 56 : 40}
          tickLine={false}
          axisLine={false}
        />
        {hasRight ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={tick}
            fontSize={12}
            width={56}
            tickLine={false}
            axisLine={false}
          />
        ) : null}
        <Tooltip formatter={tipFmt} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {/* 0 기준선: 음수(적자·자본잠식)를 시각적으로 구분 */}
        <ReferenceLine yAxisId="left" y={0} stroke="#ccc" />
        {series.map((s) => (
          <Bar
            key={s.key}
            yAxisId={s.yAxisId ?? 'left'}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            maxBarSize={26}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

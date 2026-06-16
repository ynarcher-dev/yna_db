import { useState, type ReactNode } from 'react';
import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { HiOutlineCog } from 'react-icons/hi';
import { useStartupMetrics, useStartupMetricMutations } from '@/hooks/useStartupMetrics';
import type { StartupMetricInput } from '@/schemas/startupMetric';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricFormModal, type MetricGroup } from './MetricFormModal';
import { MetricBarChart } from './MetricCharts';
import { formatDate, formatKRW } from '@/lib/formatters';
import type { StartupMetric } from '@/types/startupMetric';

/**
 * 성장 지표 블록 (6_startups.md 6.3 Detail Tab 1).
 * 재무현황 · 매출현황 · 고용현황 · 투자현황을 2×2 카드로 배치. 카드별 다지표를 한 그래프에.
 * 입력은 카드별 모달(연도 + 해당 항목)이며 같은 연도 행이 있으면 병합 저장(upsert).
 * 한 행 = 한 회계연도(record_date). 차트·표는 최신 최대 5개년치.
 */
// 차트 팔레트 (선명한 원색, 도메인 전반 일관 적용)
const PALETTE = {
  blue: '#4a90d9',
  green: '#7ac74f',
  amber: '#f5a623',
  purple: '#9b59b6',
  red: '#e22213',
  slate: '#8C95A3',
} as const;

export function MetricsBlock({ startupId }: { startupId: string }) {
  const toast = useAppToast();
  const [openGroup, setOpenGroup] = useState<MetricGroup | null>(null);
  const { data: metrics = [], isLoading } = useStartupMetrics(startupId);
  const { upsert, remove } = useStartupMetricMutations(startupId);

  const last5 = metrics.slice(-5); // record_date 오름차순 → 차트 좌→우 시간순
  const chartData = last5.map((m) => ({
    year: formatDate(m.recordDate, 'YYYY'),
    revenue: m.revenue,
    operatingProfit: m.operatingProfit,
    netIncome: m.netIncome,
    assets: m.assets,
    liabilities: m.liabilities,
    equity: m.equity,
    employeeCount: m.employeeCount,
    valuation: m.valuation,
    fundingAmount: m.fundingAmount,
  }));
  const tableData = [...last5].reverse(); // 표는 최신 연도 먼저

  const handleAdd = (group: MetricGroup, v: StartupMetricInput) => {
    const payloadByGroup: Record<MetricGroup, Record<string, unknown>> = {
      finance: { assets: v.assets, liabilities: v.liabilities, equity: v.equity },
      revenue: { revenue: v.revenue, operating_profit: v.operatingProfit, net_income: v.netIncome },
      employment: { employee_count: v.employeeCount },
      investment: {
        valuation: v.valuation,
        funding_amount: v.fundingAmount,
        funding_round: v.fundingRound ? v.fundingRound.trim() : null,
      },
    };
    upsert.mutate(
      { record_date: v.recordDate, ...payloadByGroup[group] },
      {
        onSuccess: () => {
          toast.success('저장되었습니다.');
          setOpenGroup(null);
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  const handleDelete = (id: string, year: string) => {
    toast.confirm(
      '지표 삭제',
      `${year}년 지표를 삭제하시겠습니까? (해당 연도 전체)`,
      async () => {
        try {
          await remove.mutateAsync(id);
          toast.success('삭제되었습니다.');
          setOpenGroup(null);
        } catch (e) {
          toast.error('삭제에 실패했습니다.', e);
        }
      },
    );
  };

  const yearCol: TableProps<StartupMetric>['columns'] = [
    { title: '연도', key: 'y', width: 64, render: (_, r) => formatDate(r.recordDate, 'YYYY') },
  ];
  // signed=true 면 음수(적자·자본잠식)를 빨간 글씨 + △ 로 표기
  const wonValue = (v: number, signed: boolean) =>
    signed && v < 0 ? (
      <span className="text-yna-point">△{formatKRW(Math.abs(v))}</span>
    ) : (
      formatKRW(v)
    );
  const won = (key: keyof StartupMetric, title: string, signed = false) => ({
    title,
    key: String(key),
    align: 'right' as const,
    render: (_: unknown, r: StartupMetric) => wonValue(r[key] as number, signed),
  });

  const card = (title: string, group: MetricGroup, body: ReactNode) => (
    <section className="rounded-md border border-yna-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-yna-main">{title}</h3>
        <Button size="small" icon={<HiOutlineCog />} onClick={() => setOpenGroup(group)}>
          관리
        </Button>
      </div>
      {body}
    </section>
  );

  const emptyChart = <EmptyState message="데이터가 없습니다. “관리”에서 연도별 값을 입력하세요." />;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-yna-main">성장 지표</h2>

      {isLoading ? null : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 1. 재무 현황 (자산·부채·자본) */}
          {card(
            '재무 현황 (최신 5개년)',
            'finance',
            metrics.length === 0 ? (
              emptyChart
            ) : (
              <>
                <div className="h-60">
                  <MetricBarChart
                    data={chartData}
                    unit="won"
                    series={[
                      { key: 'assets', name: '자산', color: PALETTE.blue },
                      { key: 'liabilities', name: '부채', color: PALETTE.amber },
                      { key: 'equity', name: '자본', color: PALETTE.green },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[...yearCol, won('assets', '자산'), won('liabilities', '부채'), won('equity', '자본', true)]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 420 }}
                />
              </>
            ),
          )}

          {/* 2. 매출 현황 (매출액 강조 + 손익 표) */}
          {card(
            '매출 현황 (최신 5개년)',
            'revenue',
            metrics.length === 0 ? (
              emptyChart
            ) : (
              <>
                <div className="h-60">
                  <MetricBarChart
                    data={chartData}
                    unit="won"
                    series={[
                      { key: 'revenue', name: '매출액', color: PALETTE.red },
                      { key: 'operatingProfit', name: '영업이익', color: PALETTE.blue },
                      { key: 'netIncome', name: '당기순이익', color: PALETTE.green },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[...yearCol, won('revenue', '매출액'), won('operatingProfit', '영업이익', true), won('netIncome', '당기순이익', true)]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 460 }}
                />
              </>
            ),
          )}

          {/* 3. 고용 현황 (고용 인원) */}
          {card(
            '고용 현황 (최신 5개년)',
            'employment',
            metrics.length === 0 ? (
              emptyChart
            ) : (
              <>
                <div className="h-60">
                  <MetricBarChart
                    data={chartData}
                    unit="count"
                    series={[{ key: 'employeeCount', name: '고용 인원', color: PALETTE.blue }]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    ...yearCol,
                    {
                      title: '고용 인원',
                      key: 'emp',
                      align: 'right',
                      render: (_, r) => `${r.employeeCount.toLocaleString('ko-KR')}명`,
                    },
                  ]}
                  dataSource={tableData}
                  pagination={false}
                />
              </>
            ),
          )}

          {/* 4. 투자 현황 (투자유치액 강조 + 표) */}
          {card(
            '투자 현황 (최신 5개년)',
            'investment',
            metrics.length === 0 ? (
              emptyChart
            ) : (
              <>
                <div className="h-60">
                  <MetricBarChart
                    data={chartData}
                    unit="won"
                    series={[
                      { key: 'valuation', name: '기업 가치', color: PALETTE.purple },
                      { key: 'fundingAmount', name: '투자유치액', color: PALETTE.red, yAxisId: 'right' },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    ...yearCol,
                    won('valuation', '기업 가치'),
                    won('fundingAmount', '투자유치액'),
                    { title: '라운드', key: 'round', width: 96, render: (_, r) => r.fundingRound || '-' },
                  ]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 460 }}
                />
              </>
            ),
          )}
        </div>
      )}

      {openGroup ? (
        <MetricFormModal
          key={openGroup}
          open
          group={openGroup}
          metrics={metrics}
          submitting={upsert.isPending}
          onSubmit={(v) => handleAdd(openGroup, v)}
          onDelete={handleDelete}
          onClose={() => setOpenGroup(null)}
        />
      ) : null}
    </div>
  );
}

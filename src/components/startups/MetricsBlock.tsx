import { useState, type ReactNode } from 'react';
import { Button, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useStartupMetrics, useStartupMetricMutations } from '@/hooks/useStartupMetrics';
import type { StartupMetricInput } from '@/schemas/startupMetric';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricFormModal, type MetricGroup } from './MetricFormModal';
import { MetricBarChart } from './MetricCharts';
import { SectionHeader } from './SectionHeader';
import { BusinessStatusSection } from './BusinessStatusSection';
import { formatDate, formatKRW } from '@/lib/formatters';
import { INVESTOR_TYPE_COLOR, INVESTOR_TYPE_LABEL } from '@/lib/labels';
import type { StartupMetric } from '@/types/startupMetric';
import type { Startup } from '@/types/startup';
import type { InvestorType } from '@/types/database';

/**
 * 성장 지표 블록 (6_startups.md 6.3 Detail Tab 1).
 * 재무현황 · 매출현황 · 고용현황 · 투자현황을 2×2 카드로 배치. 카드별 다지표를 한 그래프에.
 * 입력은 카드별 모달(연도 + 해당 항목)이며 같은 연도 행이 있으면 병합 저장(upsert).
 * 한 행 = 한 회계연도(record_date). 차트·표는 최신 최대 5개년치.
 */
// 카드별 단색 농담 팔레트: 카드마다 한 가지 색, 지표는 진하기(명도) 단계로만 구분.
// 한 화면이 한 톤으로 정리되어 눈 피로가 적고, 카드끼리는 색이 달라 구분된다.
const PALETTE = {
  finance: ['#1F5C99', '#4A90D9', '#A5C9EC'], // 자산 · 부채 · 자본 (블루 농담)
  revenue: ['#2E7D32', '#66A85B', '#A9D18E'], // 매출액 · 영업이익 · 당기순이익 (그린 농담)
  employment: ['#C97B1E'], // 고용 인원 (앰버 단색)
  investment: ['#5E4A93', '#B39DDB'], // 기업 가치 · 투자유치액 (퍼플 농담)
} as const;

export function MetricsBlock({ startup, onSaved }: { startup: Startup; onSaved?: () => void }) {
  const startupId = startup.id;
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
  const lastUpdated = metrics.reduce((acc, m) => (m.updatedAt > acc ? m.updatedAt : acc), '');

  const handleAdd = (group: MetricGroup, v: StartupMetricInput) => {
    const payloadByGroup: Record<MetricGroup, Record<string, unknown>> = {
      finance: { assets: v.assets, liabilities: v.liabilities, equity: v.equity },
      revenue: { revenue: v.revenue, operating_profit: v.operatingProfit, net_income: v.netIncome },
      employment: { employee_count: v.employeeCount },
      investment: {
        valuation: v.valuation,
        funding_amount: v.fundingAmount,
        funding_round: v.fundingRound ? v.fundingRound.trim() : null,
        investor: v.investor ? v.investor.trim() : null,
        investor_type: v.investorType ? v.investorType : null,
        // 자사(internal) 투자일 때만 재원 펀드 연결, 그 외엔 비운다.
        fund_id: v.investorType === 'internal' && v.fundId ? v.fundId : null,
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

  // 표 양끝(첫 칸 왼쪽 / 마지막 칸 오른쪽) 셀에 여백을 줘 내용이 가장자리에 붙지 않게 한다.
  const padL = {
    onHeaderCell: () => ({ style: { paddingLeft: 16 } }),
    onCell: () => ({ style: { paddingLeft: 16 } }),
  };
  const padR = {
    onHeaderCell: () => ({ style: { paddingRight: 16 } }),
    onCell: () => ({ style: { paddingRight: 16 } }),
  };
  const yearCol = {
    title: '연도',
    key: 'y',
    width: 80,
    ...padL,
    render: (_: unknown, r: StartupMetric) => formatDate(r.recordDate, 'YYYY'),
  };
  // signed=true 면 음수(적자·자본잠식)를 빨간 글씨 + ▼ 로 표기 (원 단위)
  const wonValue = (v: number, signed: boolean) =>
    signed && v < 0 ? (
      <span className="text-yna-point">▼{formatKRW(Math.abs(v))}</span>
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
        <Button size="small" onClick={() => setOpenGroup(group)}>
          수정
        </Button>
      </div>
      {body}
    </section>
  );

  const emptyChart = <EmptyState message="데이터가 없습니다. “관리”에서 연도별 값을 입력하세요." />;

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <SectionHeader title="성장 지표" updatedAt={lastUpdated} />

      {/* 비즈니스 현황 (시계열 텍스트) — 재무·매출 위 */}
      <BusinessStatusSection startup={startup} onSaved={onSaved} />

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
                      { key: 'assets', name: '자산', color: PALETTE.finance[0] },
                      { key: 'liabilities', name: '부채', color: PALETTE.finance[1] },
                      { key: 'equity', name: '자본', color: PALETTE.finance[2] },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    yearCol,
                    won('assets', '자산'),
                    won('liabilities', '부채'),
                    { ...won('equity', '자본', true), ...padR },
                  ]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 480 }}
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
                      { key: 'revenue', name: '매출액', color: PALETTE.revenue[0] },
                      { key: 'operatingProfit', name: '영업이익', color: PALETTE.revenue[1] },
                      { key: 'netIncome', name: '당기순이익', color: PALETTE.revenue[2] },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    yearCol,
                    won('revenue', '매출액'),
                    won('operatingProfit', '영업이익', true),
                    { ...won('netIncome', '당기순이익', true), ...padR },
                  ]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 520 }}
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
                    series={[{ key: 'employeeCount', name: '고용 인원', color: PALETTE.employment[0] }]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    yearCol,
                    {
                      title: '고용 인원',
                      key: 'emp',
                      align: 'right' as const,
                      ...padR,
                      render: (_: unknown, r: StartupMetric) =>
                        `${r.employeeCount.toLocaleString('ko-KR')}명`,
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
                      { key: 'valuation', name: '기업 가치(Pre)', color: PALETTE.investment[0] },
                      { key: 'fundingAmount', name: '투자유치액', color: PALETTE.investment[1], yAxisId: 'right' },
                    ]}
                  />
                </div>
                <Table<StartupMetric>
                  rowKey="id"
                  size="small"
                  className="mt-3"
                  columns={[
                    yearCol,
                    won('valuation', '기업 가치(Pre)'),
                    won('fundingAmount', '투자유치액'),
                    {
                      title: '라운드',
                      key: 'round',
                      width: 100,
                      render: (_: unknown, r: StartupMetric) => r.fundingRound || '-',
                    },
                    {
                      title: '투자자',
                      key: 'investor',
                      width: 160,
                      ...padR,
                      render: (_: unknown, r: StartupMetric) => {
                        // 자사 투자 + 재원 펀드 연결 시 펀드명을 펀드 상세 링크로 표시.
                        if (r.investorType === 'internal' && r.fundId) {
                          return (
                            <span className="flex items-center justify-end gap-1">
                              <Tag color={INVESTOR_TYPE_COLOR.internal}>
                                {INVESTOR_TYPE_LABEL.internal}
                              </Tag>
                              <Link className="text-yna-point" to={`/funds/${r.fundId}`}>
                                {r.fundName || '펀드'}
                              </Link>
                            </span>
                          );
                        }
                        return r.investor || r.investorType ? (
                          <span className="flex items-center justify-end gap-1">
                            {r.investorType ? (
                              <Tag color={INVESTOR_TYPE_COLOR[r.investorType as InvestorType]}>
                                {INVESTOR_TYPE_LABEL[r.investorType as InvestorType]}
                              </Tag>
                            ) : null}
                            <span>{r.investor || '-'}</span>
                          </span>
                        ) : (
                          '-'
                        );
                      },
                    },
                  ]}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: 680 }}
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

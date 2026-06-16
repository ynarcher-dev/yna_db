import { Alert, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
  HiOutlineDocumentReport,
  HiOutlineCollection,
  HiOutlineGlobeAlt,
} from 'react-icons/hi';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { formatKRW, formatPercent } from '@/lib/formatters';
import type { DashboardMetrics } from '@/types/dashboard';

interface CardConfig {
  key: string;
  label: string;
  icon: IconType;
  path: string;
  value: string;
  sub?: string;
}

/** 9대 도메인 카드 구성 (4_dashboard.md 4.3.1). */
function buildCards(m: DashboardMetrics): CardConfig[] {
  return [
    { key: 'managers', label: '심사역', icon: HiOutlineUserGroup, path: '/managers', value: `${m.totalManagers}명` },
    {
      key: 'startups',
      label: '스타트업',
      icon: HiOutlineOfficeBuilding,
      path: '/startups',
      value: `${m.totalStartups}개`,
      sub: `합산 기업가치 ${formatKRW(m.totalPortfolioValuation)}`,
    },
    { key: 'programs', label: '프로그램', icon: HiOutlineCalendar, path: '/programs', value: `${m.activePrograms}개`, sub: '진행 중' },
    {
      key: 'funds',
      label: '펀드',
      icon: HiOutlineCurrencyDollar,
      path: '/funds',
      value: formatKRW(m.totalAum),
      sub: `평균 소진율 ${formatPercent(m.averageFundExhaustionRate)}`,
    },
    {
      key: 'experts',
      label: '전문가',
      icon: HiOutlineAcademicCap,
      path: '/experts',
      value: `${m.totalExperts}명`,
      sub: `평균 만족도 ${Number(m.averageMentoringRating).toFixed(1)}점`,
    },
    { key: 'projects', label: '프로젝트', icon: HiOutlineClipboardList, path: '/projects', value: `${m.activeProjects}건`, sub: '진행 중' },
    {
      key: 'followups',
      label: '후속 보고',
      icon: HiOutlineDocumentReport,
      path: '/startups',
      value: formatPercent(m.reportSubmissionRate),
      sub: '이번 분기 제출율',
    },
    { key: 'departments', label: '소속 본부', icon: HiOutlineCollection, path: '/departments', value: `${m.totalDepartments}개` },
    { key: 'partners', label: '협력사', icon: HiOutlineGlobeAlt, path: '/partners', value: `${m.totalPartners}개` },
  ];
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-yna-border" />
      ))}
    </div>
  );
}

export function DashboardView() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useDashboardSummary();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-yna-main">대시보드</h1>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="대시보드 데이터를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          action={
            <Button size="small" loading={isFetching} onClick={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : isLoading || !data ? (
        <CardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {buildCards(data.metrics).map((card) => (
              <MetricCard
                key={card.key}
                label={card.label}
                value={card.value}
                sub={card.sub}
                icon={card.icon}
                onClick={() => navigate(card.path)}
              />
            ))}
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-yna-main">다가오는 일정</h2>
            <div className="rounded-lg border border-yna-border bg-white px-6 py-2">
              <UpcomingEvents events={data.upcomingEvents} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

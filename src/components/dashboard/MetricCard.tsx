import type { IconType } from 'react-icons';

/**
 * 대시보드 도메인 요약 카드 (4_dashboard.md 4.3.1).
 * 브랜드 메인 컬러(#515151) 배경 + 호버 시 포인트 컬러(#e22213) 강조,
 * 클릭 시 해당 상세 관리 페이지로 이동.
 */
interface MetricCardProps {
  label: string;
  value: string;
  /** 보조 수치(예: 합산 기업가치, 평균 소진율) */
  sub?: string;
  icon: IconType;
  onClick: () => void;
}

export function MetricCard({ label, value, sub, icon: Icon, onClick }: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-3 rounded-lg bg-yna-main p-6 text-left text-white shadow-sm ring-2 ring-transparent transition hover:ring-yna-point focus:outline-none focus-visible:ring-yna-point"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <Icon size={22} className="text-white/60 transition group-hover:text-yna-point" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub ? <div className="text-xs text-white/60">{sub}</div> : <div className="h-4" />}
    </button>
  );
}

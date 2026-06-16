/**
 * 로딩 상태 스켈레톤 (0_ui_ux.md 1.1)
 * 레이아웃이 사전 정의된 화면에서는 스피너 대신 회색 음영 블록을 깜빡인다.
 * Tailwind animate-pulse + yna-border 토큰 사용.
 */
interface TableSkeletonProps {
  /** 표시할 행 수 */
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-yna-border h-10 w-10" />
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-yna-border rounded" />
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-yna-border rounded col-span-2" />
                <div className="h-2 bg-yna-border rounded col-span-1" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

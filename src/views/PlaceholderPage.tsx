import { EmptyState } from '@/components/common/EmptyState';

/**
 * 도메인 화면 플레이스홀더.
 * 1번(공통 셸) 단계에서 내비게이션 동작을 확인하기 위한 임시 화면이며,
 * 각 도메인(4~12 문서) 개발 시 실제 목록/상세 화면으로 대체된다.
 */
interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-yna-main">{title}</h1>
      <div className="rounded-lg border border-yna-border bg-white">
        <EmptyState message={`${title} 화면은 준비 중입니다.`} />
      </div>
    </div>
  );
}

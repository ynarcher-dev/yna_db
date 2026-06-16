import type { ReactNode } from 'react';

/**
 * 미인증/온보딩 화면 공통 레이아웃 (14_auth.md 14.3.1).
 * 셸(사이드바·헤더) 없이 중앙 정렬된 카드(max-w-sm, rounded-lg)로 단독 렌더한다.
 */
interface AuthLayoutProps {
  /** 카드 상단 브랜드 아래 보조 안내 문구 */
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yna-bg p-4">
      <div className="w-full max-w-sm rounded-lg border border-yna-border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold tracking-tight text-yna-main">와이앤아처 PMS</div>
          {subtitle ? <p className="mt-2 text-sm text-yna-sub">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

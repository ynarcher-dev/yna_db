import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 클라이언트 (19_bootstrap.md 2장)
 * Supabase 호출을 감싸 캐싱·로딩·에러 상태를 표준화한다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

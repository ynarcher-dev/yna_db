import { ConfigProvider, App as AntdApp } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { antdTheme } from '@/lib/theme';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAuthSync } from '@/hooks/useAuthSync';

/**
 * 애플리케이션 루트 (0_design_system.md 3.2 ConfigProvider 주입).
 * Provider 순서: 테마 → antd App(메시지/모달 컨텍스트) → React Query → 라우터.
 * useAuthSync 로 Supabase 세션을 authStore 에 미러링한다(14_auth.md 14.2).
 */
export default function App() {
  useAuthSync();
  return (
    <ConfigProvider theme={antdTheme} locale={koKR}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

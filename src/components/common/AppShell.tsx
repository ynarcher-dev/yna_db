import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

/**
 * 공통 셸 (1_overview.md). 모든 인증 라우트가 이 안에 중첩된다 (17_conventions.md 1장).
 * 사이드바 + 헤더 + 콘텐츠(<Outlet/>) 3분할 레이아웃.
 */
export function AppShell() {
  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <AppHeader />
        <Content className="bg-yna-bg p-8">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

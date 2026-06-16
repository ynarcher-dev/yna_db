import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { NAV_ITEMS, getActiveKey } from '@/lib/navigation';

const { Sider } = Layout;

/**
 * 좌측 내비게이션 사이드바 (1_overview.md 1.1).
 * 대시보드 + 8개 관리 메뉴. 접힘 상태는 uiStore 로 헤더 토글과 공유한다.
 */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = getActiveKey(location.pathname);

  const items = NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: <item.icon size={18} />,
    label: item.label,
  }));

  const handleClick = (key: string) => {
    const target = NAV_ITEMS.find((n) => n.key === key);
    if (target) navigate(target.path);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={80}
      style={{ background: '#515151' }}
    >
      <div className="h-16 flex items-center justify-center px-4 font-bold tracking-tight text-white">
        {collapsed ? 'YNA' : '와이앤아처 PMS'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        onClick={({ key }) => handleClick(key)}
        style={{ background: 'transparent', borderInlineEnd: 'none' }}
      />
    </Sider>
  );
}

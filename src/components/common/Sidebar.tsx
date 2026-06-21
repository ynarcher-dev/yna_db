import { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { NAV_ITEMS, NAV_GROUPS, getActiveKey } from '@/lib/navigation';
import logo from '@/assets/logo.png';

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

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 현재 활성화된 메뉴가 포함된 그룹을 찾아 자동으로 펼쳐줌 (기존 열린 상태 누적)
  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
      return;
    }
    const activeGroup = NAV_GROUPS.find((group) =>
      group.items.some((item) => item.key === activeKey)
    );
    if (activeGroup) {
      setOpenKeys((prev) => {
        if (prev.includes(activeGroup.key)) return prev;
        return [...prev, activeGroup.key];
      });
    }
  }, [activeKey, collapsed]);

  const dashboardItem = NAV_ITEMS.find((item) => item.key === 'dashboard');

  const items = [
    ...(dashboardItem
      ? [
          {
            key: dashboardItem.key,
            icon: <dashboardItem.icon size={18} />,
            label: dashboardItem.label,
          },
        ]
      : []),
    ...NAV_GROUPS.map((group) => ({
      key: group.key,
      icon: <group.icon size={18} />,
      label: group.label,
      children: group.items.map((item) => ({
        key: item.key,
        icon: <item.icon size={18} />,
        label: item.label,
      })),
    })),
  ];

  const handleClick = (key: string) => {
    const target = NAV_ITEMS.find((n) => n.key === key);
    if (target) navigate(target.path);
  };

  const handleOpenChange = (keys: string[]) => {
    // 다중 전개 허용: 현재 전달된 openKeys 배열 상태를 그대로 설정
    setOpenKeys(keys);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={80}
      style={{ background: '#515151', borderRight: '1px solid rgba(0, 0, 0, 0.2)' }}
    >
      <div className="h-16 flex items-center justify-center px-4 font-bold tracking-tight text-white">
        {collapsed ? (
          <span style={{ fontSize: '16px', letterSpacing: '1px' }}>YNA</span>
        ) : (
          <img src={logo} alt="Y&ARCHER" style={{ maxHeight: '28px', objectFit: 'contain' }} />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[activeKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={items}
        onClick={({ key }) => handleClick(key)}
        style={{ background: 'transparent', borderInlineEnd: 'none' }}
      />
    </Sider>
  );
}

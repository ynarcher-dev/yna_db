import { Layout, Button, Space, Badge, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineMenu,
  HiOutlineDocumentReport,
  HiOutlineSparkles,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useUiStore } from '@/stores/uiStore';
import { useAppToast } from './useAppToast';
import { getNavTitle } from '@/lib/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAuthActions } from '@/hooks/useAuthActions';

const { Header } = Layout;

/**
 * 상단 헤더 (1_overview.md 1.1, 14_auth.md 14.2).
 * 사이드바 토글 + 현재 메뉴명 + 공용 보고서/AI 트리거 + 알림 종 배지(placeholder) + 프로필/로그아웃.
 * 보고서(18_pptx_spec.md)·AI(3_smart_features.md)·알림(15_system_schema.md) 실제 연결은 해당 단계에서 교체한다.
 */
export function AppHeader() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useAppToast();
  const title = getNavTitle(location.pathname);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const { signOut } = useAuthActions();
  const email = session?.user?.email ?? '사용자';
  const myId = session?.user?.id;

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems: MenuProps['items'] = [
    { key: 'email', label: <span className="text-xs text-yna-sub">{email}</span>, disabled: true },
    { type: 'divider' },
    ...(myId ? [{ key: 'profile', icon: <HiOutlineUser />, label: '내 프로필' }] : []),
    ...(role === 'admin'
      ? [{ key: 'accounts', icon: <HiOutlineUserGroup />, label: '계정 관리' }]
      : []),
    { key: 'logout', icon: <HiOutlineLogout />, label: '로그아웃', danger: true },
  ];

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') void handleLogout();
    if (key === 'profile' && myId) navigate(`/managers/${myId}`);
    if (key === 'accounts') navigate('/admin/accounts');
  };

  return (
    <Header
      className="flex items-center justify-between px-6"
      style={{ background: '#ffffff', borderBottom: '1px solid #e5e5e5' }}
    >
      <div className="flex items-center gap-3">
        <Button
          type="text"
          aria-label="사이드바 토글"
          onClick={toggleSidebar}
          icon={<HiOutlineMenu size={20} />}
        />
        <h1 className="m-0 text-lg font-semibold text-yna-main">{title}</h1>
      </div>
      <Space size="middle">
        <Button
          icon={<HiOutlineDocumentReport size={18} />}
          onClick={() => toast.info('보고서 출력 기능은 추후 제공됩니다.')}
        >
          보고서
        </Button>
        <Button
          type="primary"
          icon={<HiOutlineSparkles size={18} />}
          onClick={() => toast.info('AI 파트너 기능은 추후 제공됩니다.')}
        >
          AI 파트너
        </Button>
        <Badge count={0} size="small">
          <Button
            type="text"
            aria-label="알림"
            icon={<HiOutlineBell size={20} />}
            onClick={() => toast.info('알림 기능은 추후 제공됩니다.')}
          />
        </Badge>
        <Dropdown
          menu={{ items: menuItems, onClick: onMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Avatar
            size="small"
            icon={<HiOutlineUser />}
            style={{ backgroundColor: '#e22213', cursor: 'pointer' }}
          />
        </Dropdown>
      </Space>
    </Header>
  );
}

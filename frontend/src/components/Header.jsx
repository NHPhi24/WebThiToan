import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  BookOutlined,
  ProfileOutlined,
  SolutionOutlined,
  TeamOutlined,
  BarChartOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, message, Modal, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import MyProfile from '../pages/MyAccount/MyProfile';
import ChangePasswordModal from './ChangePasswordModal';
import { Home } from 'lucide-react';

const headerHeight = 56;

const Header = ({ user, onToggleSidebar, sidebarCollapsed, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items giống Sidebar
  const menuItems = [
    {
      key: '/',
      icon: <Home size={15} />,
      label: 'Trang chủ',
    },
    ...(user?.role === 'STUDENT'
      ? [
          { key: '/qlcathi', icon: <ProfileOutlined />, label: 'Quản lý ca thi' },
          { key: '/lam-bai-thi', icon: <BookOutlined />, label: 'Làm bài thi' },
          { key: '/qlketquathi', icon: <BarChartOutlined />, label: 'Quản lý kết quả thi' },
        ]
      : []),
    ...(user?.role === 'TEACHER'
      ? [
          { key: '/qlcauhoi', icon: <BookOutlined />, label: 'Quản lý ngân hàng câu hỏi' },
          { key: '/qldethi', icon: <SolutionOutlined />, label: 'Quản lý đề thi' },
          { key: '/qlcathi', icon: <ProfileOutlined />, label: 'Quản lý ca thi' },
          { key: '/qlhocsinh', icon: <TeamOutlined />, label: 'Quản lý học sinh' },
          { key: '/qlketquathi', icon: <BarChartOutlined />, label: 'Quản lý kết quả thi' },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          { key: '/qlcauhoi', icon: <BookOutlined />, label: 'Quản lý ngân hàng câu hỏi' },
          { key: '/qldethi', icon: <SolutionOutlined />, label: 'Quản lý đề thi' },
          { key: '/qlcathi', icon: <ProfileOutlined />, label: 'Quản lý ca thi' },
          { key: '/qlketquathi', icon: <BarChartOutlined />, label: 'Quản lý kết quả thi' },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          { key: '/system-logs', icon: <FileSearchOutlined />, label: 'Lịch sử hệ thống' },
          { key: '/qlnguoidung', icon: <UserOutlined />, label: 'Quản lý người dùng' },
        ]
      : []),
  ];

  const handleHeaderMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      if (onLogout) onLogout();
      else {
        localStorage.removeItem('user');
        window.location.reload();
      }
    } else if (key === 'info') {
      setShowProfile(true);
    } else if (key === 'changepw') {
      setShowChangePw(true);
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        // display: 'flex',
        // alignItems: 'center',
        zIndex: 1001,
        padding: '0 24px',
        lineHeight: `${headerHeight}px`,
        // boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Logo + nút sidebar */}
          <div style={{ display: 'flex', alignItems: 'center', width: 220, minWidth: 180 }}>
            <button
              onClick={onToggleSidebar}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 22,
                cursor: 'pointer',
                marginRight: 16,
              }}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <div onClick={() => navigate('/')} style={{ fontWeight: 700, fontSize: 20, color: '#1890ff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Web Thi Toán
            </div>
          </div>
          {/* Menu ngang trên header */}
          {user && (
            <div>
              {/* <Menu
                mode="horizontal"
                items={menuItems}
                selectedKeys={[location.pathname]}
                onClick={handleHeaderMenuClick}
                style={{ background: 'transparent', borderBottom: 'none' }}
              /> */}
            </div>
          )}
        </div>
        <div>
          {user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'info',
                    icon: <InfoCircleOutlined />,
                    label: 'Thông tin tài khoản',
                  },
                  {
                    key: 'changepw',
                    icon: <KeyOutlined />,
                    label: 'Đổi / Quên mật khẩu',
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    danger: true,
                    label: 'Đăng xuất',
                  },
                ],
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <UserOutlined style={{ fontSize: 20, marginRight: 8 }} />
                <span style={{ fontWeight: 500 }}>{user?.full_name || user?.username}</span>
              </div>
            </Dropdown>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ fontSize: 20, marginRight: 8 }} />
              <Button type="primary" onClick={() => navigate('/dang-nhap')}>
                Đăng nhập
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal MyProfile */}
      <Modal open={showProfile} onCancel={() => setShowProfile(false)} footer={null} width={500} destroyOnClose>
        <MyProfile user={user} />
      </Modal>
      {/* Modal Đổi mật khẩu */}
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} userId={user?.id} />
    </header>
  );
};

export default Header;

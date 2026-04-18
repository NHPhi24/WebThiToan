import React, { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, InfoCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { Dropdown, Menu, message, Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import MyProfile from '../pages/MyAccount/MyProfile';

const headerHeight = 56;

const Header = ({ user, onToggleSidebar, sidebarCollapsed, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
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
      message.info('Chức năng đổi mật khẩu sẽ sớm có.');
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
        display: 'flex',
        alignItems: 'center',
        zIndex: 1001,
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <button
        onClick={onToggleSidebar}
        style={{
          border: 'none',
          background: 'none',
          fontSize: 22,
          cursor: 'pointer',
          marginRight: 24,
        }}
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>
      <div style={{ fontWeight: 700, fontSize: 20, color: '#1890ff', flex: 1 }}>Web Thi Toán</div>
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
      {/* Modal MyProfile */}
      <Modal open={showProfile} onCancel={() => setShowProfile(false)} footer={null} width={500} destroyOnClose>
        <MyProfile user={user} />
      </Modal>
    </header>
  );
};

export default Header;

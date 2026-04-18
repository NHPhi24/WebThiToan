import React, { useState } from 'react';
import { Menu, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOutlined, ProfileOutlined, SolutionOutlined, TeamOutlined, BarChartOutlined, FileSearchOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Sidebar = ({ user, collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Định nghĩa danh sách menu dựa trên Role
  const taskItems = [
    {
      key: '/',
      icon: <UserOutlined />,
      label: 'Trang chủ',
    },
    ...(user?.role === 'TEACHER' || user?.role === 'ADMIN'
      ? [
          {
            key: '/qlcauhoi',
            icon: <BookOutlined />,
            label: 'Quản lý ngân hàng câu hỏi',
          },
          {
            key: '/qlcathi',
            icon: <ProfileOutlined />,
            label: 'Quản lý ca thi',
          },
          {
            key: '/qldethi',
            icon: <SolutionOutlined />,
            label: 'Quản lý đề thi',
          },
          {
            key: '/qlhocsinh',
            icon: <TeamOutlined />,
            label: 'Quản lý học sinh',
          },
          {
            key: '/qlketquathi',
            icon: <BarChartOutlined />,
            label: 'Quản lý kết quả thi',
          },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: '/system-logs',
            icon: <FileSearchOutlined />,
            label: 'Lịch sử hệ thống',
          },
          {
            key: '/qlnguoidung',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
          },
        ]
      : []),
  ];

  // 2. Xử lý khi click vào menu
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div
      style={{
        height: '100vh',
        width: 260,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        position: 'fixed',
        left: 0,
        top: 56, // lùi xuống dưới header cố định
        zIndex: 100,
        transition: 'all 0.2s',
        paddingTop: 0,
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        pointerEvents: collapsed ? 'none' : 'auto',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{
          flex: 1,
          borderRight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        items={taskItems}
        onClick={handleMenuClick}
      />
    </div>
  );
};

export default Sidebar;

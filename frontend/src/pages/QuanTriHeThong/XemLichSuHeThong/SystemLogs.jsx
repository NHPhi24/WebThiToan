// Đã di chuyển từ ../SystemLogs.jsx
import React, { useEffect, useState } from 'react';
import { Table, Card, message, Typography } from 'antd';
import apiService from '../../../services/api';

const { Title } = Typography;

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Lấy logs và users song song
      const [logsRes, usersRes] = await Promise.all([apiService.getAllSystemLogs(), apiService.getAllUsers()]);
      setLogs(logsRes.data);
      // Tạo map id -> tên
      const map = {};
      (usersRes.data || []).forEach((u) => {
        map[u.id] = u.full_name || u.username || u.email || u.id;
      });
      setUserMap(map);
    } catch (error) {
      console.error('Fetch system logs error:', error);
      message.error('Không thể tải lịch sử hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => (text ? new Date(text).toLocaleString() : '-'),
      width: 180,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: 'Đối tượng',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 140,
    },
    {
      title: 'Mã đối tượng',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 120,
    },
    {
      title: 'Tên đối tượng',
      dataIndex: 'resource_name',
      key: 'resource_name',
      width: 180,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'actor_id',
      key: 'actor_id',
      width: 160,
      render: (actor_id) => userMap[actor_id] || actor_id || '-',
    },
  ];

  return (
    <Card size="small" title={<Title level={4}>Lịch sử hệ thống</Title>}>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={logs} pagination={{ pageSize: 10 }} />
    </Card>
  );
};

export default SystemLogs;

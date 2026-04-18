// Đã di chuyển từ ../SystemLogs.jsx
import React, { useEffect, useState } from 'react';
import { Table, Card, message, Typography } from 'antd';
import apiService from '../../../services/api';

const { Title } = Typography;

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllSystemLogs();
      setLogs(response.data);
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
    // {
    //   title: 'Thực hiện bởi',
    //   dataIndex: 'created_by',
    //   key: 'created_by',
    //   width: 160,
    // },
    // {
    //   title: 'Chi tiết',
    //   dataIndex: 'details',
    //   key: 'details',
    //   render: (details) => (
    //     <pre
    //       style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}
    //     >
    //       {JSON.stringify(details || {}, null, 2)}
    //     </pre>
    //   ),
    // },
  ];

  return (
    <Card size="small" title={<Title level={4}>Lịch sử hệ thống</Title>}>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={logs}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default SystemLogs;

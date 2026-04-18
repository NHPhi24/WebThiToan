import React, { useEffect, useState } from 'react';
import { Table, message, Tag, Button, Popconfirm } from 'antd';
import api from '../../../services/api';
import participantApi from '../../../services/participantApi';
import { EXAM_SESSION_REGISTER_STATUS } from '../../../constants/constant';

const QLDangKyCaThi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách tất cả session_participants kèm thông tin user và ca thi
      const res = await api.getAllSessionParticipants();
      setData(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách đăng ký ca thi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (value) => {
    const found = EXAM_SESSION_REGISTER_STATUS.find((s) => s.value === value);
    return found ? found.label : value;
  };

  const statusColors = {
    10: 'orange', // chờ duyệt
    20: 'green', // phê duyệt
    50: 'red', // từ chối
  };

  const handleApprove = async (session_id, user_id) => {
    try {
      await participantApi.updateRegisterStatus({ session_id, user_id, register_status: 20 });
      message.success('Đã phê duyệt');
      fetchData();
    } catch {
      message.error('Lỗi phê duyệt');
    }
  };

  const handleReject = async (session_id, user_id) => {
    try {
      await participantApi.updateRegisterStatus({ session_id, user_id, register_status: 50 });
      message.success('Đã từ chối');
      fetchData();
    } catch {
      message.error('Lỗi từ chối');
    }
  };

  const columns = [
    { title: 'Tên ca thi', dataIndex: 'session_name', key: 'session_name' },
    { title: 'ID User', dataIndex: 'user_id', key: 'user_id' },
    { title: 'Tên người đăng ký', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Thời gian đăng ký',
      dataIndex: 'registered_at',
      key: 'registered_at',
      render: (text) => (text ? new Date(text).toLocaleString('vi-VN', { hour12: false }) : ''),
    },
    {
      title: 'Trạng thái đăng ký',
      dataIndex: 'register_status',
      key: 'register_status',
      render: (value) => <Tag color={statusColors[value]}>{getStatusLabel(value)}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) =>
        record.register_status === 10 ? (
          <>
            <Popconfirm
              title="Phê duyệt đăng ký này?"
              onConfirm={() => handleApprove(record.session_id, record.user_id)}
              okText="Phê duyệt"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" style={{ marginRight: 8 }}>
                Phê duyệt
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Từ chối đăng ký này?"
              onConfirm={() => handleReject(record.session_id, record.user_id)}
              okText="Từ chối"
              cancelText="Hủy"
            >
              <Button danger size="small">
                Từ chối
              </Button>
            </Popconfirm>
          </>
        ) : null,
    },
  ];

  return (
    <div>
      <h2>Danh sách đăng ký ca thi</h2>
      <Table columns={columns} dataSource={data.map((row, idx) => ({ ...row, key: idx }))} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
};

export default QLDangKyCaThi;

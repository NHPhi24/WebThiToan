import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, message, Tag, Button, Popconfirm, Tooltip } from 'antd';
import ActionIcons from '../../../components/ActionIcons';
import api from '../../../services/api';
import participantApi from '../../../services/participantApi';
import { EXAM_SESSION_REGISTER_STATUS } from '../../../constants/constant';
import DangKyCaThi from './DangKyCaThi';
import AddStudentToSessionModal from './AddStudentToSessionModal';
import { Modal, Descriptions } from 'antd';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const QLDangKyCaThi = () => {
  const { id: sessionId } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchSessionName();
  }, [sessionId]);

  const fetchSessionName = async () => {
    try {
      const res = await api.getExamSessionById(sessionId);
      setSessionName(res.data.session_name || '');
    } catch {
      setSessionName('');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách user đã đăng ký của ca thi đang chọn
      const res = await api.getUsersBySession(sessionId);
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

  const currentUser = getCurrentUser();
  const isTeacher = currentUser && (currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN');

  // Hàm kiểm tra học sinh đã đăng ký ca thi READY nào chưa (chờ duyệt hoặc đã duyệt)
  // Lấy tất cả các ca thi READY mà user đã đăng ký (chờ duyệt hoặc đã duyệt)
  const getRegisteredReadySessionId = () => {
    if (!currentUser || isTeacher) return null;
    const found = data.find(
      (row) => row.user_id === currentUser.id && row.session_status === 'READY' && (row.register_status === 10 || row.register_status === 20),
    );
    return found ? found.session_id : null;
  };
  // Kiểm tra user đã đăng ký ca thi này chưa (bất kỳ trạng thái)
  const isRegisteredThisSession = () => {
    if (!currentUser) return false;
    return data.some((row) => row.user_id === currentUser.id);
  };

  const handleRemove = async (session_id, user_id) => {
    try {
      await participantApi.remove({ session_id, user_id });
      message.success('Đã xóa học sinh khỏi ca thi');
      fetchData();
    } catch {
      message.error('Lỗi xóa học sinh');
    }
  };

  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const columns = [
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
      title: 'Đã tham gia thi',
      dataIndex: 'has_joined',
      key: 'has_joined',
      align: 'center',
      render: (value) => (value ? <Tag color="green">Đã vào thi</Tag> : <Tag color="default">Chưa vào thi</Tag>),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => {
        return (
          <ActionIcons
            handleDelete={isTeacher && record.register_status === 50 ? () => handleRemove(record.session_id, record.user_id) : undefined}
            handleEdit={
              isTeacher && record.register_status !== 20
                ? async () => {
                    try {
                      const res = await api.getUserById(record.user_id);
                      setEditUser({
                        id: res.data.id,
                        username: res.data.username,
                        full_name: res.data.full_name,
                        email: res.data.email,
                        disableUsername: true,
                        profile_info: res.data.profile_info || {},
                      });
                    } catch {
                      setEditUser({
                        id: record.user_id,
                        username: record.username || record.user_name || '',
                        full_name: record.full_name,
                        email: record.email,
                        disableUsername: true,
                        profile_info: record.profile_info || {},
                      });
                    }
                  }
                : undefined
            }
            handleApprove={isTeacher && record.register_status === 10 ? () => handleApprove(record.session_id, record.user_id) : undefined}
            handleReject={isTeacher && record.register_status === 10 ? () => handleReject(record.session_id, record.user_id) : undefined}
            canEdit={record.register_status !== 20}
            showPopconfirm={true}
            handleView={async () => {
              try {
                const res = await api.getUserById(record.user_id);
                setViewUser(res.data);
              } catch {
                setViewUser(record);
              }
            }}
          />
        );
      },
    },
  ];

  return (
    <div>
      <h2>Danh sách đăng ký ca thi: {sessionName || sessionId}</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        {!isTeacher && (
          <>
            <Button type="primary" onClick={() => setModalOpen({ open: true, isDangKyThi: true })} disabled={isRegisteredThisSession()}>
              Đăng ký thi
            </Button>
            {isRegisteredThisSession() && (
              <Button type="primary" onClick={() => setModalOpen({ open: true, isDangKyThi: false })}>
                Hủy đăng ký
              </Button>
            )}
          </>
        )}
        {isTeacher && (
          <Button type="primary" onClick={() => setAddStudentModalOpen(true)}>
            Tạo học sinh tham gia thi
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={data.map((row, idx) => ({ ...row, key: idx }))} loading={loading} pagination={{ pageSize: 10 }} />

      {/* Modal xem chi tiết user */}
      <Modal
        open={!!viewUser}
        onCancel={() => setViewUser(null)}
        footer={null}
        title={viewUser ? `Thông tin chi tiết: ${viewUser.full_name || viewUser.username || ''}` : 'Thông tin chi tiết'}
        width={600}
      >
        {viewUser && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{viewUser.id}</Descriptions.Item>
            <Descriptions.Item label="Tên đăng nhập">{viewUser.username}</Descriptions.Item>
            <Descriptions.Item label="Họ tên">{viewUser.full_name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewUser.email}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">{viewUser.role}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : ''}</Descriptions.Item>
            <Descriptions.Item label="Thông tin bổ sung">
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {viewUser.profile_info ? JSON.stringify(viewUser.profile_info, null, 2) : '{}'}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      {/* Modal đăng ký ca thi chỉ cho ca thi này */}
      <DangKyCaThi
        open={!!modalOpen && modalOpen.open}
        isDangKyThi={!!modalOpen && modalOpen.isDangKyThi}
        onClose={() => setModalOpen(false)}
        sessionId={sessionId}
        onSuccess={fetchData}
      />
      <AddStudentToSessionModal
        open={addStudentModalOpen || !!editUser}
        onClose={() => {
          setAddStudentModalOpen(false);
          setEditUser(null);
        }}
        sessionId={sessionId}
        onSuccess={() => {
          fetchData();
          setEditUser(null);
        }}
        editUser={editUser}
      />
    </div>
  );
};

export default QLDangKyCaThi;

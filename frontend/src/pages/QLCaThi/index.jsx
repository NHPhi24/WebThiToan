import React, { useEffect, useState } from 'react';
import { Table, message, Modal, Form, Input, DatePicker, InputNumber, Select, Button, Tooltip, Popconfirm } from 'antd';
import useTeacherFullName from '../../hooks/useTeacherFullName';

// Component con để dùng hook đúng chuẩn
const TeacherName = ({ teacherId }) => {
  const { fullName, loading } = useTeacherFullName(teacherId);
  return loading ? '...' : fullName;
};
import { Edit, Trash, Eye } from 'lucide-react';
import AddExamSessionModal from './AddExamSessionModal';
import api from '../../services/api';
import { PlusOutlined } from '@ant-design/icons';
import ExamSessionDetail from './ExamSessionDetail';

// Lấy user hiện tại từ localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};
import apiService from '../../services/api';
import dayjs from 'dayjs';
import { EXAM_SESSION_STATUS } from '../../constants/constant';

// statusColors moved to ExamSessionDetail.jsx
const statusOptions = EXAM_SESSION_STATUS;
const getStatusLabel = (value) => {
  const found = EXAM_SESSION_STATUS.find((s) => s.value === value);
  return found ? found.label : value;
};

const QLCaThi = ({ user, isLoggedIn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit' | 'add'
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalLoading, setAddModalLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();
  const [examOptions, setExamOptions] = useState([]);

  useEffect(() => {
    api.getAllExams().then((res) => {
      setExamOptions((res.data || []).map((e) => ({ label: `${e.exam_code} (ID: ${e.id})`, value: e.id })));
    });
  }, []);

  // Xử lý mở modal thêm mới
  const handleAddNew = () => {
    setAddModalOpen(true);
  };

  const handleAddModalOk = async (values) => {
    setAddModalLoading(true);
    try {
      await apiService.createExamSession(values);
      message.success('Tạo ca thi thành công');
      setAddModalOpen(false);
      fetchData();
    } catch {
      message.error('Tạo ca thi thất bại');
    } finally {
      setAddModalLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllExamSessions();
      setData(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách ca thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = async (id) => {
    setModalLoading(true);
    setModalMode('view');
    setModalOpen(true);
    try {
      const res = await apiService.getExamSessionById(id);
      setModalData(res.data);
    } catch {
      message.error('Không thể tải chi tiết ca thi');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (id) => {
    setModalLoading(true);
    setModalMode('edit');
    setModalOpen(true);
    try {
      const res = await apiService.getExamSessionById(id);
      setModalData(res.data);
      form.setFieldsValue({
        ...res.data,
        start_time: dayjs(res.data.start_time),
        exam_ids: res.data.exam_ids || [],
      });
    } catch {
      message.error('Không thể tải chi tiết ca thi');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteExamSession(id);
      message.success('Đã xóa ca thi');
      fetchData();
    } catch {
      message.error('Xóa ca thi thất bại');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiService.updateExamSessionStatus(id, status);
      message.success('Đã đổi trạng thái');
      fetchData();
    } catch {
      message.error('Đổi trạng thái thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (modalMode === 'edit') {
        await apiService.updateExamSession(modalData.id, {
          ...values,
          start_time: values.start_time.toISOString(),
        });
        message.success('Cập nhật thành công');
      } else if (modalMode === 'add') {
        await apiService.createExamSession({
          ...values,
          start_time: values.start_time.toISOString(),
        });
        message.success('Tạo ca thi thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(modalMode === 'add' ? 'Tạo ca thi thất bại' : 'Cập nhật thất bại');
    } finally {
      setModalLoading(false);
    }
  };

  const canEdit = isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN');
  // Lấy danh sách các ca thi mà học sinh đã đăng ký
  const [registeredSessions, setRegisteredSessions] = useState([]);
  useEffect(() => {
    const fetchRegistered = async () => {
      if (!user || user.role !== 'STUDENT') return;
      try {
        const res = await api.getAllSessionParticipants();
        // Lọc ra các ca thi mà user đã đăng ký
        const registered = (res.data || []).filter((p) => p.user_id === user.id);
        setRegisteredSessions(registered);
      } catch {}
    };
    fetchRegistered();
  }, []);
  const columns = [
    {
      title: 'Tên ca thi',
      dataIndex: 'session_name',
      key: 'session_name',
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text) => new Date(text).toLocaleString('vi-VN', { hour12: false }),
    },
    {
      title: 'Thời lượng (phút)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Giáo viên tạo',
      dataIndex: 'teacher_id',
      render: (teacher_id) => <TeacherName teacherId={teacher_id} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) =>
        canEdit ? (
          <Select
            value={status}
            style={{ minWidth: 120 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            options={statusOptions}
            optionLabelProp="label"
          >
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <span>{getStatusLabel(status)}</span>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'create_at',
      render: (text) => new Date(text).toLocaleString('vi-VN', { hour12: false }),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title="Xem chi tiết">
            <Button size="small" onClick={() => handleView(record.id)} shape="circle" type="default">
              <Eye size={16} />
            </Button>
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button size="small" onClick={() => handleEdit(record.id)} shape="circle" type="default" disabled={record.status !== 'READY'}>
                  <Edit size={16} />
                </Button>
              </Tooltip>
              {record.status === 'FINISHED' && (
                <Tooltip title="Xóa bản ghi">
                  <Popconfirm title="Bạn có chắc chắn muốn xóa ?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
                    <Button size="small" shape="circle" type="default" danger>
                      <Trash size={16} />
                    </Button>
                  </Popconfirm>
                </Tooltip>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const currentUser = getCurrentUser();
  return (
    <div>
      <h1>Quản lý ca thi</h1>
      {/* Hiển thị danh sách ca thi đã đăng ký của học sinh */}
      {user?.role === 'STUDENT' && registeredSessions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Ca thi bạn đã đăng ký</h3>
          <Table
            columns={[
              { title: 'Tên ca thi', dataIndex: 'session_name', key: 'session_name' },
              {
                title: 'Thời gian bắt đầu',
                dataIndex: 'start_time',
                key: 'start_time',
                render: (text) => new Date(text).toLocaleString('vi-VN', { hour12: false }),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'register_status',
                key: 'register_status',
                render: (status) => (status === 10 ? 'Chờ duyệt' : status === 20 ? 'Đã duyệt' : status === 50 ? 'Từ chối' : status),
              },
            ]}
            dataSource={registeredSessions
              .slice() // copy mảng
              .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at)) // mới nhất lên đầu
              .slice(0, 2) // lấy 2 bản ghi mới nhất
              .map((p) => {
                const session = data.find((s) => s.id === p.session_id) || {};
                return {
                  key: p.session_id,
                  session_name: session.session_name || '(Không tìm thấy)',
                  start_time: session.start_time,
                  register_status: p.register_status,
                };
              })}
            pagination={false}
            size="small"
            rowKey="key"
          />
        </div>
      )}
      {canEdit && (
        <Button type="primary" onClick={handleAddNew} style={{ marginBottom: 16 }} icon={<PlusOutlined />}>
          Thêm ca thi
        </Button>
      )}
      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      {modalOpen && modalMode !== 'view' && (
        <AddExamSessionModal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={async (values) => {
            setModalLoading(true);
            try {
              await apiService.updateExamSession(modalData.id, {
                ...values,
                start_time: values.start_time,
              });
              message.success('Cập nhật thành công');
              setModalOpen(false);
              fetchData();
            } catch {
              message.error('Cập nhật thất bại');
            } finally {
              setModalLoading(false);
            }
          }}
          loading={modalLoading}
          user={getCurrentUser()}
          editData={modalData}
        />
      )}
      {modalOpen && modalMode === 'view' && modalData && (
        <ExamSessionDetail
          data={modalData}
          registeredSessionId={(() => {
            // Tìm ca thi READY mà học sinh đã đăng ký (chờ duyệt hoặc đã duyệt)
            if (!user || user.role !== 'STUDENT') return null;
            const found = registeredSessions.find(
              (p) =>
                p.register_status !== 50 && // không bị từ chối
                data.find((s) => s.id === p.session_id && s.status === 'READY'),
            );
            return found ? found.session_id : null;
          })()}
        />
      )}

      {canEdit && (
        <AddExamSessionModal
          open={addModalOpen}
          onCancel={() => setAddModalOpen(false)}
          onOk={handleAddModalOk}
          loading={addModalLoading}
          user={currentUser}
        />
      )}
    </div>
  );
};

export default QLCaThi;

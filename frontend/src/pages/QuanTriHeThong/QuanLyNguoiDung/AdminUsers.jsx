// Đã di chuyển từ ../AdminUsers.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ActionIcons from '../../../components/ActionIcons';
import api from '../../../services/api';
import { ROLES } from '../../../constants/constant.jsx';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Lấy user hiện tại từ localStorage
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };
  const isGiaoVien = getCurrentUser()?.role === 'TEACHER';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      let response;
      if (currentUser?.role === 'TEACHER') {
        response = await api.getAllStudents();
      } else {
        response = await api.getAllUsers();
      }
      setUsers(response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          ...values,
          password: values.password || undefined,
        });
        message.success('Cập nhật người dùng thành công');
      } else {
        const { confirmPassword, ...userData } = values;
        await api.createUser(userData);
        message.success('Tạo người dùng mới thành công');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      message.error('Lưu người dùng thất bại');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id);
      message.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      message.error('Xóa người dùng thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => (text ? new Date(text).toLocaleString() : '-'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => <ActionIcons handleEdit={() => openEditModal(record)} handleDelete={() => handleDelete(record.id)} />,
    },
  ];

  return (
    <div>
      <Card
        title={isGiaoVien ? 'Quản lý học sinh' : 'Quản lý người dùng'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {isGiaoVien ? 'Thêm học sinh' : 'Thêm người dùng'}
          </Button>
        }
      >
        <Table rowKey="id" loading={loading} dataSource={users} columns={columns} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal
        title={editingUser ? 'Chỉnh sửa' : 'Tạo người' + (isGiaoVien ? 'học sinh' : 'người dùng')}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
            <Input />
          </Form.Item>

          {/* Rule: Tên đăng nhập không được có dấu cách */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.username !== curr.username}>
            {({ getFieldValue }) => {
              const username = getFieldValue('username') || '';
              if (username.includes(' ')) {
                form.setFields([
                  {
                    name: 'username',
                    errors: ['Tên đăng nhập không được chứa dấu cách'],
                  },
                ]);
              }
              return null;
            }}
          </Form.Item>

          <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>

          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
            <Select options={ROLES} />
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item label="Mật khẩu" name="password" rules={editingUser ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                <Input.Password placeholder={editingUser ? 'Để trống nếu không đổi mật khẩu' : ''} />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
              <Button onClick={closeModal}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;

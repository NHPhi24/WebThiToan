import React, { useEffect, useState } from 'react';
import { Modal, Tabs, Select, Button, Form, Input, message } from 'antd';
import api from '../../../services/api';

const { TabPane } = Tabs;
const { Option } = Select;

const AddStudentToSessionModal = ({ open, onClose, sessionId, onSuccess, editUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (open) {
      api.getAllStudents().then((res) => setUsers(res.data || []));
      setSelectedUserId(null);
      if (editUser) {
        setActiveTab('2');
        form.setFieldsValue({
          username: editUser.username,
          full_name: editUser.full_name,
          email: editUser.email,
          password: '',
          confirmPassword: '',
        });
      } else {
        setActiveTab('1');
        form.resetFields();
      }
    }
  }, [open, form, editUser]);

  // Tab 1: Chọn học sinh đã có (nhiều học sinh)
  const handleAddExisting = async () => {
    if (!selectedUserId || selectedUserId.length === 0) {
      message.warning('Vui lòng chọn học sinh!');
      return;
    }
    setLoading(true);
    try {
      await api.registerSessionParticipant({ session_id: Number(sessionId), user_id: selectedUserId });
      message.success('Thêm học sinh vào ca thi thành công!');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Thêm học sinh thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Tab 2: Tạo mới hoặc chỉnh sửa học sinh
  const handleCreateAndAdd = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      let userId;
      if (editUser) {
        // Chỉnh sửa học sinh
        await api.updateUser(editUser.id, {
          username: values.username,
          full_name: values.full_name,
          email: values.email,
          password: values.password || undefined,
        });
        userId = editUser.id;
        message.success('Cập nhật thông tin học sinh thành công!');
      } else {
        // Tạo học sinh mới
        const res = await api.createUser({ ...values, role: 'STUDENT' });
        userId = res.data.id;
        message.success('Tạo học sinh thành công!');
      }
      // Đăng ký vào ca thi nếu chưa đăng ký
      if (!editUser) {
        await api.registerSessionParticipant({ session_id: Number(sessionId), user_id: userId });
        message.success('Thêm học sinh vào ca thi thành công!');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      if (err.errorFields) return; // Lỗi validate
      message.error(err?.response?.data?.error || (editUser ? 'Cập nhật học sinh thất bại!' : 'Tạo học sinh thất bại!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={editUser ? 'Chỉnh sửa học sinh' : 'Tạo học sinh tham gia thi'}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Chọn học sinh đã có" key="1" disabled={!!editUser}>
          <Select
            showSearch
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Chọn học sinh theo tên hoặc email"
            optionFilterProp="children"
            value={selectedUserId}
            onChange={setSelectedUserId}
            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {users.map((u) => (
              <Option key={u.id} value={u.id}>
                {u.id} - {u.full_name} ({u.email})
              </Option>
            ))}
          </Select>
          <Button type="primary" style={{ marginTop: 16 }} onClick={handleAddExisting} loading={loading} block>
            Thêm vào ca thi
          </Button>
        </TabPane>
        <TabPane tab={editUser ? 'Chỉnh sửa học sinh' : 'Tạo học sinh mới'} key="2">
          <Form form={form} layout="vertical">
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
              <Input disabled={!!editUser?.disableUsername} />
            </Form.Item>
            <Form.Item name="full_name" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input />
            </Form.Item>
            {!editUser && (
              <>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </>
            )}
            <Button type="primary" onClick={handleCreateAndAdd} loading={loading} block>
              {editUser ? 'Lưu thay đổi' : 'Tạo và thêm vào ca thi'}
            </Button>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AddStudentToSessionModal;

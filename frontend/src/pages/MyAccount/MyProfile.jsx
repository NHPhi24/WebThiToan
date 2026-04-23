import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Card, Spin } from 'antd';
import apiService from '../../services/api';

const MyProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Lấy userId từ localStorage (chỉ lấy id, không lấy thông tin khác)
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (localUser?.id) {
      setFetching(true);
      apiService
        .getUserById(localUser.id)
        .then((res) => {
          setUser(res.data);
          form.setFieldsValue({
            full_name: res.data.full_name,
            email: res.data.email,
            phone: res.data.phone,
            username: res.data.username,
          });
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setFetching(false));
    } else {
      setUser(null);
      setFetching(false);
    }
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let profile_info = values.profile_info;
      // Nếu không phải JSON, thử tự động chuyển đổi từ key: value\nkey: value... sang JSON
      let parsed = null;
      try {
        parsed = JSON.parse(profile_info);
      } catch {
        // Thử tự động chuyển đổi
        const lines = profile_info.split(/\r?\n/).filter(Boolean);
        const obj = {};
        for (const line of lines) {
          const idx = line.indexOf(':');
          if (idx > -1) {
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            obj[key] = value;
          }
        }
        parsed = obj;
        // Hiển thị lại cho user xem
        form.setFieldsValue({ profile_info: JSON.stringify(obj, null, 2) });
      }
      setLoading(true);
      const res = await apiService.updateUser(user.id, { ...values, profile_info: parsed });
      setUser(res.data);
      message.success('Cập nhật thông tin thành công!');
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <Spin /> Đang tải thông tin...
      </div>
    );
  if (!user) return <div>Không tìm thấy thông tin người dùng.</div>;

  return (
    <Card title="Thông tin cá nhân" style={{ maxWidth: 480, margin: '32px auto' }}>
      <Form form={form} layout="vertical">
        <Form.Item label="Tên đầy đủ" name="full_name" rules={[{ required: true, message: 'Nhập họ tên' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input />
        </Form.Item>
        {/* <Form.Item label="Số điện thoại" name="phone">
          <Input />
        </Form.Item> */}
        <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true }]}>
          <Input disabled />
        </Form.Item>
        <Form.Item label="Thông tin bổ sung (JSON)" name="profile_info" tooltip="Nhập thông tin bổ sung dưới dạng JSON">
          <Input.TextArea rows={4} placeholder='{"truong": "abc"}' />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} loading={loading}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MyProfile;

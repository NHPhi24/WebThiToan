import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import apiService from '../services/api';

const ChangePasswordModal = ({ open, onClose, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await apiService.changePassword(userId, values.newPassword);
      message.success('Đổi mật khẩu thành công!');
      onClose();
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={handleOk}
      title="Đổi mật khẩu"
      okText="Đổi mật khẩu"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Mật khẩu mới" name="newPassword" rules={[{ required: true, message: 'Nhập mật khẩu mới' }]}>
          <Input.Password placeholder="Nhập mật khẩu mới" />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu không khớp'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;

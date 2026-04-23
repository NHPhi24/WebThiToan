import React, { useState } from 'react';
import { Modal, Button, Select, message } from 'antd';
import api from '../../../services/api';
import participantApi from '../../../services/participantApi';

// Lấy user hiện tại từ localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const { Option } = Select;

/**
 * Modal cho học sinh đăng ký ca thi
 * Props:
 *   open: boolean - trạng thái mở modal
 *   onClose: function - đóng modal
 *   examSessions: array - danh sách ca thi để chọn
 *   onSuccess: function - callback khi đăng ký thành công
 */
const DangKyCaThi = ({ open, onClose, sessionId, onSuccess, isDangKyThi }) => {
  const [loading, setLoading] = useState(false);
  const sessionIdNumber = Number(sessionId); // đảm bảo sessionId là số

  const handleRegister = async () => {
    const user = getCurrentUser();
    if (!user?.id) {
      message.error('Không xác định được tài khoản!');
      return;
    }
    setLoading(true);
    try {
      if (isDangKyThi) {
        await participantApi.register({ session_id: sessionIdNumber, user_id: user.id });
        message.success('Đăng ký ca thi thành công!');
      } else {
        await participantApi.cancelRegister({ session_id: sessionIdNumber, user_id: user.id });
        message.success('Hủy đăng ký ca thi thành công!');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.error || (isDangKyThi ? 'Đăng ký thất bại!' : 'Hủy đăng ký thất bại!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isDangKyThi ? 'Đăng ký ca thi' : 'Hủy đăng ký ca thi'}
      onCancel={onClose}
      onOk={handleRegister}
      okText={isDangKyThi ? 'Đăng ký' : 'Hủy đăng ký'}
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <b>{isDangKyThi ? 'Bạn có chắc muốn đăng ký vào ca thi này?' : 'Bạn có chắc muốn hủy đăng ký vào ca thi này?'}</b>
      </div>
    </Modal>
  );
};

export default DangKyCaThi;

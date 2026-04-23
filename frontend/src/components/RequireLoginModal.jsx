import React from 'react';
import { Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const RequireLoginModal = ({ visible, onClose }) => {
  const navigate = useNavigate();
  return (
    <Modal open={visible} onCancel={onClose} footer={null} centered destroyOnClose>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h3>Bạn cần đăng nhập để thực hiện chức năng này</h3>
        <Button
          type="primary"
          onClick={() => {
            onClose && onClose();
            navigate('/dang-nhap');
          }}
          style={{ marginTop: 16 }}
        >
          Đăng nhập
        </Button>
      </div>
    </Modal>
  );
};

export default RequireLoginModal;

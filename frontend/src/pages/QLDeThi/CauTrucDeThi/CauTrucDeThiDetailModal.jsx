import React from 'react';
import { Modal, Descriptions } from 'antd';

const CauTrucDeThiDetailModal = ({ open, onClose, record }) => {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Chi tiết cấu trúc đề thi" width={600} destroyOnClose>
      {record ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Tên cấu trúc">{record.template_name}</Descriptions.Item>
          <Descriptions.Item label="Tổng số câu">{record.total_questions}</Descriptions.Item>
          <Descriptions.Item label="% Cơ bản">{record.basic_percent}</Descriptions.Item>
          <Descriptions.Item label="% Nâng cao">{record.advanced_percent}</Descriptions.Item>
          <Descriptions.Item label="Giáo viên tạo">{record.teacher_full_name || record.teacher_id}</Descriptions.Item>
          <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Modal>
  );
};

export default CauTrucDeThiDetailModal;

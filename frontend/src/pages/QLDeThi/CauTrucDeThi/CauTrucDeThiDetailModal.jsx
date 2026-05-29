import React from 'react';
import { Modal, Descriptions } from 'antd';
import { DANGCAUHOI } from '../../../constants/constant';

const CauTrucDeThiDetailModal = ({ open, onClose, record }) => {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Chi tiết cấu trúc đề thi" width={600} destroyOnClose>
      {record ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Tên cấu trúc">{record.template_name}</Descriptions.Item>
          <Descriptions.Item label="Lớp">{record.grade}</Descriptions.Item>
          <Descriptions.Item label="Tổng số câu">{record.total_questions}</Descriptions.Item>
          <Descriptions.Item label="% Cơ bản">{record.basic_percent}</Descriptions.Item>
          <Descriptions.Item label="% Nâng cao">{record.advanced_percent}</Descriptions.Item>
          <Descriptions.Item label="Giáo viên tạo">{record.teacher_full_name || record.teacher_id}</Descriptions.Item>
          {record.structure && record.structure.mode === 'selection' ? (
            <Descriptions.Item label="Cấu trúc theo dạng bài">
              {Array.isArray(record.structure.items) && record.structure.items.length > 0 ? (
                <div>
                  {record.structure.items.map((it, idx) => {
                    const label = DANGCAUHOI.find((o) => o.value === it.topic)?.label || it.topic || 'N/A';
                    return (
                      <div key={idx} style={{ marginBottom: 6 }}>
                        <b>{label}:</b> Cơ bản {it.basic || 0} | Nâng cao {it.advanced || 0}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span>Không có mục nào</span>
              )}
            </Descriptions.Item>
          ) : null}
          {/* <Descriptions.Item label="ID">{record.id}</Descriptions.Item> */}
        </Descriptions>
      ) : null}
    </Modal>
  );
};

export default CauTrucDeThiDetailModal;

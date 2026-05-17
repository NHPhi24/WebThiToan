import React, { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import apiService from '../services/api';
import MathText from '../utils/MathText';
/**
 * Modal cảnh báo xác nhận khi thêm/sửa câu hỏi tương tự (chỉ khác biến/số)
 * Props:
 * - open: boolean
 * - onOk: function
 * - onCancel: function
 * - reason: string (nội dung cảnh báo)
 * - matchedId: string | number (mã câu hỏi gốc)
 * - isEdit: boolean (true: sửa, false: thêm mới)
 */

const SimilarityWarningModal = ({ open, onOk, onCancel, reason, matchedId, isEdit }) => {
  const [questionContent, setQuestionContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && matchedId) {
      setLoading(true);
      apiService
        .getQuestionById(matchedId)
        .then((res) => {
          setQuestionContent(res?.content || '');
        })
        .catch(() => setQuestionContent('Không lấy được nội dung câu hỏi gốc.'))
        .finally(() => setLoading(false));
    } else {
      setQuestionContent('');
    }
  }, [open, matchedId]);

  return (
    <Modal
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      title="Cảnh báo: Câu hỏi tương tự đã tồn tại"
      okText="Xác nhận"
      cancelText="Huỷ"
      closable={false}
      maskClosable={false}
      zIndex={2000}
    >
      <div style={{ marginBottom: 8 }}>
        <b>{reason || 'Đã có câu hỏi tương tự chỉ khác biến hoặc hằng số. Bạn có muốn tiếp tục?'}</b>
      </div>
      {matchedId && (
        <div style={{ background: '#f6f6f6', padding: 8, borderRadius: 4 }}>
          <b>{isEdit ? 'Câu hỏi gốc:' : 'Mã câu hỏi gốc:'}</b>
          <div style={{ marginBottom: 4, color: '#888' }}>Mã: {matchedId}</div>
          {loading ? (
            <Spin />
          ) : (
            <div style={{ background: '#fff', padding: 8, borderRadius: 4, minHeight: 32 }}>
              <MathText>{questionContent}</MathText>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default SimilarityWarningModal;

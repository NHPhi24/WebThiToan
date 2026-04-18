import React, { useState, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  message,
  Typography,
  Select,
  Modal as AntdModal,
} from 'antd';
import { QUESTION_LEVELS } from '../../constants/constant';
import apiService from '../../services/api';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import MathText from '../../utils/MathText';

const AddQuestionModal = ({
  open,
  onClose,
  onSuccess,
  edit = false,
  view = false,
  data = null,
  editId = null,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contentPreview, setContentPreview] = useState('');
  const contentInputRef = useRef();
  const [explanationPreview, setExplanationPreview] = useState('');
  const [ansAPreview, setAnsAPreview] = useState('');
  const [ansBPreview, setAnsBPreview] = useState('');
  const [ansCPreview, setAnsCPreview] = useState('');
  const [ansDPreview, setAnsDPreview] = useState('');

  // Khi có data (chỉnh sửa), fill form
  React.useEffect(() => {
    if ((edit || view) && data) {
      form.setFieldsValue({
        content: data.content,
        ans_a: data.ans_a,
        ans_b: data.ans_b,
        ans_c: data.ans_c,
        ans_d: data.ans_d,
        correct_ans: data.correct_ans,
        explanation: data.explanation,
        level:
          typeof data.level === 'number'
            ? data.level === 0 || data.level === 1
              ? data.level
              : 0
            : data.level === 'basic'
              ? 0
              : data.level === 'advanced'
                ? 1
                : 0,
      });
      setContentPreview(data.content || '');
      setAnsAPreview(data.ans_a || '');
      setAnsBPreview(data.ans_b || '');
      setAnsCPreview(data.ans_c || '');
      setAnsDPreview(data.ans_d || '');
      setExplanationPreview(data.explanation || '');
    } else if (!open) {
      // Reset khi đóng
      form.resetFields();
      setContentPreview('');
      setAnsAPreview('');
      setAnsBPreview('');
      setAnsCPreview('');
      setAnsDPreview('');
      setExplanationPreview('');
    }
  }, [edit, view, data, open]);

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleOk = async (confirmYearDiff = false) => {
    try {
      const values = await form.validateFields();
      // Đảm bảo level chỉ là 0 hoặc 1
      const level = values.level === 1 ? 1 : 0;
      setLoading(true);
      const correctAns = values.correct_ans?.toUpperCase?.() || '';
      if (edit && editId) {
        await apiService.updateQuestion(editId, {
          ...values,
          level,
          correct_ans: correctAns,
          teacher_id: user?.id,
        });
        message.success('Cập nhật câu hỏi thành công');
      } else {
        try {
          await apiService.createQuestion({
            ...values,
            level,
            correct_ans: correctAns,
            teacher_id: user?.id,
            confirmYearDiff: confirmYearDiff ? true : undefined,
          });
          message.success('Thêm câu hỏi thành công');
          form.resetFields();
          onSuccess();
          onClose();
        } catch (err) {
          // Nếu lỗi chỉ khác năm, hỏi xác nhận
          if (err?.code === 'CONFIRM_YEAR_DIFF') {
            AntdModal.confirm({
              title: 'Câu hỏi này chỉ khác năm với một câu hỏi đã có',
              content: (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <b>Bạn có chắc chắn muốn thêm mới câu hỏi này không?</b>
                  </div>
                  <div
                    style={{
                      background: '#f6f6f6',
                      padding: 8,
                      borderRadius: 4,
                    }}
                  >
                    <div>
                      <b>Câu hỏi gốc:</b>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {err.question?.content}
                    </div>
                  </div>
                </div>
              ),
              okText: 'Thêm mới',
              cancelText: 'Huỷ',
              onOk: () => handleOk(true),
            });
            return;
          }
          message.error(err?.error || 'Thêm câu hỏi thất bại');
        }
        return;
      }
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.errorFields) return; // validation error
      message.error(
        edit ? 'Cập nhật câu hỏi thất bại' : 'Thêm câu hỏi thất bại',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        view
          ? 'Xem chi tiết câu hỏi'
          : edit
            ? 'Chỉnh sửa câu hỏi'
            : 'Thêm câu hỏi mới'
      }
      open={open}
      onOk={view ? undefined : handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={view ? null : edit ? 'Lưu' : 'Thêm'}
      cancelText="Huỷ"
      destroyOnHidden
      width={700}
      footer={view ? null : undefined}
    >
      {!view && (
        <>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            <b>Cách nhập:</b> Nhập text thường kết hợp công thức toán học.
            <br />• Công thức <b>trong dòng</b>: bọc trong <code>$...$</code>{' '}
            (ví dụ: <code>$x^2 + 1$</code>)
            <br />• Công thức <b>xuống dòng</b>: bọc trong <code>$$...$$</code>
            <br />
            <b>Công thức mẫu nhanh:</b> (bấm để chèn)
          </Typography.Paragraph>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              margin: '8px 0',
            }}
          >
            {[
              { latex: '2^2 + 3^2 = 4^2', insert: '$2^2 + 3^2 = 4^2$' },
              { latex: '\\sqrt{4}', insert: '$\\sqrt{4}$' },
              { latex: '\\sqrt[3]{8}', insert: '$\\sqrt[3]{8}$' },
              { latex: '\\frac{2}{3}', insert: '$\\frac{2}{3}$' },
              { latex: '\\int_0^1 x^2 dx', insert: '$\\int_0^1 x^2 dx$' },
              { latex: 'f(x) = x^3', insert: '$f(x) = x^3$' },
              { latex: 'f\\prime(x)', insert: '$f\\prime(x)$' },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                style={{
                  cursor: 'pointer',
                  background: '#f6f6f6',
                  padding: '2px 4px',
                  borderRadius: 4,
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 8,
                  minWidth: 24,
                  justifyContent: 'center',
                }}
                onClick={() => {
                  // Chèn latex (đã bao gồm dấu $) vào vị trí con trỏ hiện tại
                  const textarea =
                    contentInputRef.current?.resizableTextArea?.textArea;
                  let current = contentPreview || '';
                  let insertAt =
                    textarea && textarea.selectionStart !== undefined
                      ? textarea.selectionStart
                      : current.length;
                  let newValue =
                    current.slice(0, insertAt) +
                    item.insert +
                    current.slice(insertAt);
                  setContentPreview(newValue);
                  form.setFieldsValue({ content: newValue });
                  // Đặt lại vị trí con trỏ sau khi chèn
                  setTimeout(() => {
                    if (textarea) {
                      textarea.focus();
                      textarea.selectionStart = textarea.selectionEnd =
                        insertAt + item.insert.length;
                    }
                  }, 0);
                }}
              >
                <BlockMath math={item.latex} errorColor="#f00" />
              </button>
            ))}
          </div>
          <span style={{ color: '#888', fontSize: 12 }}>
            <b>Ví dụ:</b> Giải phương trình <code>$x^2 + 2x + 1 = 0$</code> với
            x thuộc R
          </span>
        </>
      )}
      <Form form={form} layout="vertical" disabled={view}>
        {!view && (
          <Form.Item
            label="Nội dung câu hỏi"
            name="content"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung câu hỏi' },
            ]}
          >
            <Input.TextArea
              ref={contentInputRef}
              rows={3}
              placeholder="Ví dụ: Giải phương trình $x^2 + 2x + 1 = 0$ với x thuộc R"
              value={contentPreview}
              onChange={(e) => setContentPreview(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
            />
          </Form.Item>
        )}
        {contentPreview && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Xem trước:</span>
            <div
              style={{
                background: '#f6f6f6',
                padding: 8,
                borderRadius: 4,
                fontSize: 15,
              }}
            >
              <MathText>{contentPreview}</MathText>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            label="Đáp án A"
            name="ans_a"
            rules={[{ required: true, message: 'Nhập đáp án A' }]}
            style={{ flex: 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {!view && (
                <Input
                  placeholder="Ví dụ: $x = -1$"
                  value={ansAPreview}
                  onChange={(e) => setAnsAPreview(e.target.value)}
                />
              )}
              {ansAPreview.trim() && (
                <div
                  style={{
                    minWidth: 60,
                    background: '#f6f6f6',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  <MathText>{ansAPreview}</MathText>
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item
            label="Đáp án B"
            name="ans_b"
            rules={[{ required: true, message: 'Nhập đáp án B' }]}
            style={{ flex: 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {!view && (
                <Input
                  placeholder="Ví dụ: $x = 0$"
                  value={ansBPreview}
                  onChange={(e) => setAnsBPreview(e.target.value)}
                />
              )}
              {ansBPreview.trim() && (
                <div
                  style={{
                    minWidth: 60,
                    background: '#f6f6f6',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  <MathText>{ansBPreview}</MathText>
                </div>
              )}
            </div>
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            label="Đáp án C"
            name="ans_c"
            rules={[{ required: true, message: 'Nhập đáp án C' }]}
            style={{ flex: 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {!view && (
                <Input
                  placeholder="Ví dụ: $x = 1$"
                  value={ansCPreview}
                  onChange={(e) => setAnsCPreview(e.target.value)}
                />
              )}
              {ansCPreview.trim() && (
                <div
                  style={{
                    minWidth: 60,
                    background: '#f6f6f6',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  <MathText>{ansCPreview}</MathText>
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item
            label="Đáp án D"
            name="ans_d"
            rules={[{ required: true, message: 'Nhập đáp án D' }]}
            style={{ flex: 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {!view && (
                <Input
                  placeholder="Ví dụ: $x = 2$"
                  value={ansDPreview}
                  onChange={(e) => setAnsDPreview(e.target.value)}
                />
              )}
              {ansDPreview.trim() && (
                <div
                  style={{
                    minWidth: 60,
                    background: '#f6f6f6',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  <MathText>{ansDPreview}</MathText>
                </div>
              )}
            </div>
          </Form.Item>
        </div>
        <Form.Item
          label={
            !view
              ? 'Đáp án đúng (A/B/C/D)'
              : `Đáp án đúng: ${form.getFieldValue('correct_ans')}`
          }
          name="correct_ans"
          rules={[{ required: true, message: 'Nhập đáp án đúng (A/B/C/D)' }]}
        >
          {!view && <Input placeholder="A/B/C/D" maxLength={1} />}
        </Form.Item>
        <Form.Item label="Giải thích (nếu có)" name="explanation">
          {!view && (
            <Input.TextArea
              rows={2}
              placeholder="Giải thích cho đáp án (có thể dùng $...$ cho công thức)"
              value={form.getFieldValue('explanation')}
              onChange={(e) => {
                setExplanationPreview(e.target.value);
                form.setFieldsValue({ explanation: e.target.value });
              }}
            />
          )}
          {explanationPreview && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#888', fontSize: 12 }}>
                Xem trước giải thích:
              </span>
              <div
                style={{
                  background: '#f6f6f6',
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                <MathText>{explanationPreview}</MathText>
              </div>
            </div>
          )}
        </Form.Item>
        <Form.Item
          label="Độ khó"
          name="level"
          rules={[{ required: true, message: 'Chọn độ khó' }]}
        >
          <Select placeholder="Chọn độ khó" options={QUESTION_LEVELS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddQuestionModal;

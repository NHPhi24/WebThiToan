// File: CauTrucDeThiModal.jsx
// Mô tả: Modal cấu trúc đề thi mới, cần hoàn thiện UI và logic theo yêu cầu.
import React, { useState, useEffect } from 'react';
import useTeacherFullName from '../../../hooks/useTeacherFullName';
// Lấy user hiện tại từ localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import api from '../../../services/api';

const CauTrucDeThiModal = ({ open, onClose, onSuccess, editRecord }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();
  const { fullName: teacherName } = useTeacherFullName(user?.id);

  useEffect(() => {
    if (editRecord && open) {
      form.setFieldsValue(editRecord);
    } else if (open) {
      form.setFieldsValue({
        total_questions: 10,
        basic_percent: 80,
        advanced_percent: 20,
        grade: 10,
      });
    }
  }, [editRecord, open, form]);

  const handleSubmit = async (values) => {
    // Kiểm tra tổng % không vượt quá 100
    const totalPercent = Number(values.basic_percent || 0) + Number(values.advanced_percent || 0);
    if (totalPercent > 100) {
      message.error('Tổng % cơ bản và nâng cao không được vượt quá 100!');
      return;
    }
    setLoading(true);
    try {
      // Kiểm tra trùng tên cấu trúc đề thi
      const allTemplates = await api.getAllExamTemplates();
      const existed = allTemplates.data.some(
        (item) => item.template_name.trim().toLowerCase() === values.template_name.trim().toLowerCase() && (!editRecord || item.id !== editRecord.id),
      );
      if (existed) {
        message.error('Tên cấu trúc đề thi đã tồn tại!');
        setLoading(false);
        return;
      }
      let submitValues = { ...values };
      // Đảm bảo luôn truyền đúng teacher_id
      submitValues.teacher_id = user?.id;
      if (editRecord) {
        await api.updateExamTemplate(editRecord.id, submitValues);
        message.success('Cập nhật cấu trúc đề thi thành công');
      } else {
        await api.createExamTemplate(submitValues);
        message.success('Tạo cấu trúc đề thi thành công');
      }
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(editRecord ? 'Cập nhật cấu trúc đề thi thất bại' : 'Tạo cấu trúc đề thi thất bại');
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      title={editRecord ? 'Sửa cấu trúc đề thi' : 'Thêm cấu trúc đề thi'}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Trường ẩn để truyền id giáo viên */}
        <Form.Item name="teacher_id" initialValue={user?.id} hidden>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item label="Giáo viên tạo">
          <Input value={teacherName} disabled />
        </Form.Item>
        <Form.Item label="Tên cấu trúc" name="template_name" rules={[{ required: true, message: 'Vui lòng nhập tên cấu trúc' }]}>
          <Input placeholder="Nhập tên cấu trúc đề thi" />
        </Form.Item>
        <Form.Item label="Lớp" name="grade" rules={[{ required: true, message: 'Chọn lớp' }]}>
          <Input.Group compact>
            <select
              style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #d9d9d9' }}
              value={form.getFieldValue('grade')}
              onChange={(e) => form.setFieldsValue({ grade: Number(e.target.value) })}
            >
              <option value={10}>Lớp 10</option>
              <option value={11}>Lớp 11</option>
              <option value={12}>Lớp 12</option>
            </select>
          </Input.Group>
        </Form.Item>
        <Form.Item label="Tổng số câu" name="total_questions" rules={[{ required: true, message: 'Vui lòng nhập tổng số câu' }]}>
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập tổng số câu" />
        </Form.Item>
        <Form.Item label="% Cơ bản" name="basic_percent" rules={[{ required: true, message: 'Vui lòng nhập % cơ bản' }]}>
          <InputNumber
            min={0}
            max={100}
            step={10}
            style={{ width: '100%' }}
            placeholder="Nhập % cơ bản"
            onChange={(value) => {
              // Tự động cập nhật % nâng cao để tổng là 100
              form.setFieldsValue({ advanced_percent: 100 - (Number(value) || 0) });
            }}
          />
        </Form.Item>
        <Form.Item label="% Nâng cao" name="advanced_percent" rules={[{ required: true, message: 'Vui lòng nhập % nâng cao' }]}>
          <InputNumber min={0} max={100} step={10} disabled style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {/* {editRecord ? 'Lưu' : 'Tạo mới'} */}
            Lưu
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CauTrucDeThiModal;

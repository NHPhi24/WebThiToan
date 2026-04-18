import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Input, message } from 'antd';
import api from '../../services/api';

const ExamStructureModal = ({ visible, onClose, exam, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    if (exam?.template_id) {
      api.getAllExamTemplates().then((res) => {
        const found = res.data.find((t) => t.id === exam.template_id);
        setTemplate(found);
        if (found) {
          form.setFieldsValue({
            template_name: found.template_name,
            total_questions: found.total_questions,
            basic_percent: found.basic_percent,
            advanced_percent: found.advanced_percent,
          });
        }
      });
    } else {
      form.resetFields();
      setTemplate(null);
    }
  }, [exam, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await api.createExamTemplate({ ...values, teacher_id: exam.teacher_id });
      message.success('Cập nhật cấu trúc đề thi thành công!');
      setLoading(false);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      if (err?.errorFields) return; // validation error
      message.error('Cập nhật thất bại!');
    }
  };

  return (
    <Modal open={visible} onCancel={onClose} onOk={handleOk} title="Chỉnh sửa cấu trúc đề thi" confirmLoading={loading} okText="Lưu" cancelText="Hủy">
      <Form form={form} layout="vertical">
        <Form.Item label="Tên cấu trúc" name="template_name" rules={[{ required: true, message: 'Nhập tên cấu trúc' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Tổng số câu hỏi" name="total_questions" rules={[{ required: true, message: 'Nhập tổng số câu hỏi' }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="% Câu cơ bản" name="basic_percent" rules={[{ required: true, message: 'Nhập % câu cơ bản' }]}>
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="% Câu nâng cao" name="advanced_percent" rules={[{ required: true, message: 'Nhập % câu nâng cao' }]}>
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExamStructureModal;

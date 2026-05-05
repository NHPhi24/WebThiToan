import React, { useEffect, useState } from 'react';
import useTeacherFullName from '../../hooks/useTeacherFullName';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Row, Col, Select } from 'antd';
import api from '../../services/api';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const AddDeThi = ({ onSubmit, onOpenStructure, loading, autoMode }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const user = getCurrentUser();
  const { fullName: teacherName } = useTeacherFullName(user?.id);
  useEffect(() => {
    api.getAllExamTemplates().then((res) => setTemplates(res.data || []));
  }, []);

  const handleFinish = (values) => {
    // Truyền exam_code, template_id và teacher_id cho auto-generate
    const payload = { exam_code: values.exam_code, template_id: values.template_id, teacher_id: user?.id };
    console.log('Payload gửi lên BE:', payload);
    if (onSubmit) onSubmit(payload);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 500, margin: '0 auto' }}>
      <Form.Item label="Mã đề thi" name="exam_code" rules={[{ required: true, message: 'Vui lòng nhập mã đề thi' }]}>
        <Input placeholder="Nhập mã đề thi" />
      </Form.Item>
      <Form.Item label="Cấu trúc đề thi" name="template_id" rules={[{ required: true, message: 'Vui lòng chọn Template ID' }]}>
        <Select
          placeholder="Chọn cấu trúc đề thi"
          options={templates.map((t) => ({ value: t.id, label: `${t.id} - ${t.template_name} (${t.basic_percent}% - ${t.advanced_percent}%)` }))}
          showSearch
          filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
        />
      </Form.Item>
      <Form.Item label="Giáo viên tạo">
        <Input value={teacherName} disabled />
      </Form.Item>
      <Row gutter={8} justify="end">
        <Col>
          <Button type="default" onClick={() => navigate('/qldethi/cautrucdethi')}>
            Cấu trúc đề thi
          </Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo đề tự động
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default AddDeThi;

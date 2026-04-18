import React from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Button,
} from 'antd';
import dayjs from 'dayjs';
import { EXAM_SESSION_STATUS } from '../../constants/constant';

const statusOptions = EXAM_SESSION_STATUS.map((status) => ({
  label: status.label,
  value: status.value,
}));

const AddExamSessionModal = ({ open, onCancel, onOk, loading, user }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open && user) {
      form.setFieldsValue({ teacher_id: user.id });
    }
  }, [open, user, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        ...values,
        start_time: values.start_time.toISOString(),
      });
      form.resetFields();
    } catch (err) {
      notify.error('Vui lòng điền đầy đủ thông tin', err);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Thêm ca thi"
      onOk={handleOk}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ duration: 60, status: 'READY', teacher_id: user?.id }}
      >
        <Form.Item
          label="Tên ca thi"
          name="session_name"
          rules={[{ required: true, message: 'Nhập tên ca thi' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Thời gian bắt đầu"
          name="start_time"
          rules={[{ required: true, message: 'Chọn thời gian' }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          label="Thời lượng (phút)"
          name="duration"
          rules={[{ required: true, message: 'Nhập thời lượng' }]}
        >
          <InputNumber min={1} max={300} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Chọn trạng thái' }]}
        >
          <Select
            options={statusOptions}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Chọn trạng thái"
          />
        </Form.Item>
        <Form.Item name="teacher_id" initialValue={user?.id} hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddExamSessionModal;

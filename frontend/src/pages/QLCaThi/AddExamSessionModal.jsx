import useTeacherFullName from '../../hooks/useTeacherFullName';
import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Button } from 'antd';
import dayjs from 'dayjs';
import { EXAM_SESSION_STATUS } from '../../constants/constant';
import api from '../../services/api';
import useNotify from '../../hooks/useNotify';

const statusOptions = EXAM_SESSION_STATUS.map((status) => ({
  label: status.label,
  value: status.value,
}));

const AddExamSessionModal = ({ open, onCancel, onOk, loading, user, editData }) => {
  const [form] = Form.useForm();
  const [examOptions, setExamOptions] = React.useState([]);
  const { fullName: teacherName } = useTeacherFullName(user?.id);
  // Xác định mode dựa vào editData
  const isEdit = !!(editData && editData.id);

  React.useEffect(() => {
    if (open) {
      api.getAllExams().then((res) => {
        setExamOptions((res.data || []).map((e) => ({ label: `${e.exam_code} (ID: ${e.id})`, value: e.id })));
      });
      if (isEdit && editData) {
        form.setFieldsValue({
          ...editData,
          start_time: dayjs(editData.start_time),
          exam_ids: editData.exam_ids || [],
        });
      } else if (!isEdit && user) {
        const defaultStart = dayjs().add(30, 'minute');
        form.setFieldsValue({
          teacher_id: user.id,
          start_time: defaultStart,
        });
      }
    }
  }, [open, user, form, isEdit, editData]);

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
      title={isEdit ? 'Sửa ca thi' : 'Thêm ca thi'}
      onOk={handleOk}
      okText={'Lưu'}
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          isEdit && editData
            ? {
                ...editData,
                start_time: dayjs(editData.start_time),
                exam_ids: editData.exam_ids || [],
              }
            : {
                duration: 60,
                status: 'READY',
                teacher_id: user?.id,
                start_time: dayjs().add(30, 'minute'),
              }
        }
      >
        <Form.Item label="Tên ca thi" name="session_name" rules={[{ required: true, message: 'Nhập tên ca thi' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Thời gian bắt đầu" name="start_time" rules={[{ required: true, message: 'Chọn thời gian' }]}>
          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Thời lượng (phút)" name="duration" rules={[{ required: true, message: 'Nhập thời lượng' }]}>
          <InputNumber min={1} max={300} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
          <Select
            options={statusOptions}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            placeholder="Chọn trạng thái"
          />
        </Form.Item>
        <Form.Item label="Giáo viên tạo">
          <Input value={teacherName} disabled readOnly />
        </Form.Item>
        <Form.Item name="teacher_id" initialValue={user?.id} hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Chọn đề thi" name="exam_ids" rules={[{ required: true, message: 'Chọn ít nhất 1 đề thi' }]}>
          <Select
            mode="multiple"
            allowClear
            placeholder="Chọn đề thi cho ca thi"
            options={examOptions}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddExamSessionModal;

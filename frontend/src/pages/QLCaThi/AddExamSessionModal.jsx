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
  const [allExams, setAllExams] = React.useState([]);
  const { fullName: teacherName } = useTeacherFullName(user?.id);
  // Xác định mode dựa vào editData
  const isEdit = !!(editData && editData.id);

  // Fetch toàn bộ đề thi một lần khi mở modal
  React.useEffect(() => {
    if (open && allExams.length === 0) {
      api.getAllExams().then((res) => {
        setAllExams(res.data || []);
      });
    }
  }, [open, allExams.length]);

  // Hàm lọc đề thi theo grade
  const filterExamsByGrade = (grade) => {
    if (!grade) {
      setExamOptions([]);
      form.setFieldsValue({ exam_ids: [] });
      return;
    }
    const filtered = (allExams || []).filter((e) => String(e.grade) === String(grade));
    setExamOptions(filtered.map((e) => ({ label: `${e.exam_code} (ID: ${e.id})`, value: e.id })));
    // Nếu các exam_ids hiện tại không hợp lệ thì reset
    const currentExamIds = form.getFieldValue('exam_ids') || [];
    const validIds = filtered.map((e) => e.id);
    if (currentExamIds.some((id) => !validIds.includes(id))) {
      form.setFieldsValue({ exam_ids: [] });
    }
  };

  // Khi mở modal hoặc editData thay đổi, set lại form và lọc đề thi
  React.useEffect(() => {
    if (open) {
      let grade = null;
      if (isEdit && editData) {
        grade = editData.grade;
        form.setFieldsValue({
          ...editData,
          start_time: dayjs(editData.start_time),
          exam_ids: editData.exam_ids || [],
          lock_duration_seconds: editData.lock_duration_seconds ?? 120,
        });
      } else if (!isEdit && user) {
        grade = form.getFieldValue('grade');
        const defaultStart = dayjs().add(30, 'minute');
        form.setFieldsValue({
          teacher_id: user.id,
          start_time: defaultStart,
          lock_duration_seconds: 120,
        });
      }
      filterExamsByGrade(grade);
    }
    // eslint-disable-next-line
  }, [open, user, form, isEdit, editData, allExams]);

  // Khi đổi grade thì lọc lại đề thi
  const handleGradeChange = (grade) => {
    filterExamsByGrade(grade);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        ...values,
        start_time: values.start_time.toISOString(),
        lock_duration_seconds: values.lock_duration_seconds ?? 120,
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
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
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
                lock_duration_seconds: 120,
                status: 'READY',
                teacher_id: user?.id,
                start_time: dayjs().add(30, 'minute'),
              }
        }
      >
        <Form.Item label="Tên ca thi" name="session_name" rules={[{ required: true, message: 'Nhập tên ca thi' }]}>
          <Input placeholder="Nhập tên ca thi" />
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
            disabled={!isEdit} // Disable khi thêm mới, chỉ cho phép chỉnh khi sửa
          />
        </Form.Item>
        <Form.Item label="Giáo viên tạo">
          <Input value={teacherName} disabled readOnly />
        </Form.Item>
        <Form.Item name="teacher_id" initialValue={user?.id} hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Lớp" name="grade" rules={[{ required: true, message: 'Chọn lớp' }]}>
          <Select
            options={[
              { label: '10', value: '10' },
              { label: '11', value: '11' },
              { label: '12', value: '12' },
            ]}
            placeholder="Chọn lớp"
            onChange={handleGradeChange}
          />
        </Form.Item>
        <Form.Item label="Thời gian khóa (giây)" name="lock_duration_seconds" rules={[{ required: true, message: 'Nhập thời gian khóa' }]}>
          <InputNumber min={1} max={300} style={{ width: '100%' }} />
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

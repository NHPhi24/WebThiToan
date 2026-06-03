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
import { Modal, Form, Input, InputNumber, Button, message, Radio, Select, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { DANGCAUHOI } from '../../../constants/constant';
import api from '../../../services/api';

const CauTrucDeThiModal = ({ open, onClose, onSuccess, editRecord }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();
  const { fullName: teacherName } = useTeacherFullName(user?.id);

  useEffect(() => {
    if (editRecord && open) {
      // Ensure structure shape exists
      const init = { ...editRecord };
      if (!init.structure) init.structure = { mode: 'default', items: [] };
      form.setFieldsValue(init);
    } else if (open) {
      form.setFieldsValue({
        total_questions: 10,
        basic_percent: 80,
        advanced_percent: 20,
        grade: 10,
        structure: { mode: 'default', items: [] },
      });
    }
  }, [editRecord, open, form]);

  const watchedGrade = Form.useWatch('grade', form) || 10;
  // For grade 10: only show grade 10 topics
  // For grade 11: show grade 11 + grade 10 topics
  // For grade 12: show grade 12 + grade 11 + grade 10 topics
  const gradeNum = Number(watchedGrade) || 10;
  let allowedGrades = [];
  if (gradeNum === 10) allowedGrades = [10];
  else if (gradeNum === 11) allowedGrades = [11, 10];
  else if (gradeNum === 12) allowedGrades = [12, 11, 10];
  else allowedGrades = [gradeNum];

  const topicOptionsByGrade = DANGCAUHOI.filter((d) => allowedGrades.includes(Number(d.grade))).map((o) => ({ label: o.label, value: o.value }));

  // When grade changes, normalize existing structure.items so their topics match the selected grade
  React.useEffect(() => {
    const mode = form.getFieldValue(['structure', 'mode']) || 'default';
    if (mode !== 'selection') return;
    const items = form.getFieldValue(['structure', 'items']) || [];
    const allowed = topicOptionsByGrade.map((o) => o.value);
    if (allowed.length === 0) {
      if ((items || []).length > 0) {
        form.setFieldsValue({ structure: { ...(form.getFieldValue('structure') || {}), items: [] } });
      }
      return;
    }
    const newItems = (items || []).map((it) => {
      if (!it) return it;
      if (allowed.includes(it.topic)) return it;
      return { ...it, topic: allowed[0] };
    });
    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      form.setFieldsValue({ structure: { ...(form.getFieldValue('structure') || {}), items: newItems } });
    }
  }, [watchedGrade]);

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
      // Nếu không có structure, ensure null
      if (!submitValues.structure) submitValues.structure = null;
      // Kiểm tra tổng số câu trong cấu trúc (client-side)
      if (submitValues.structure && submitValues.structure.mode === 'selection' && Array.isArray(submitValues.structure.items)) {
        const totalFromStructure = submitValues.structure.items.reduce((sum, it) => sum + Number(it.basic || 0) + Number(it.advanced || 0), 0);
        if (Number(submitValues.total_questions || 0) > 0 && totalFromStructure > Number(submitValues.total_questions)) {
          message.error('Tổng các câu trong cấu trúc vượt quá Tổng số câu. Vui lòng điều chỉnh.');
          setLoading(false);
          return;
        }
      }
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
        <Form.Item label="Chế độ cấu trúc" name={['structure', 'mode']} initialValue="default">
          <Radio.Group>
            <Radio value="default">Giữ nguyên (theo % tổng quát)</Radio>
            <Radio value="selection">Chọn theo dạng bài</Radio>
          </Radio.Group>
        </Form.Item>
        {/* Nếu chọn selection, hiển thị danh sách chủ đề + số cơ bản/nâng cao */}
        <Form.Item
          shouldUpdate={(prev, cur) =>
            prev.structure?.mode !== cur.structure?.mode ||
            prev.total_questions !== cur.total_questions ||
            prev.structure?.items !== cur.structure?.items
          }
        >
          {() => {
            const mode = form.getFieldValue(['structure', 'mode']) || 'default';
            if (mode !== 'selection') return null;
            return (
              <Form.List name={['structure', 'items']}>
                {(fields, { add, remove }) => {
                  const items = form.getFieldValue(['structure', 'items']) || [];
                  const selectedTopics = items.map((it) => it?.topic).filter(Boolean);
                  return (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '0 8px' }}>
                        <div style={{ width: 220, fontWeight: 600 }}>Dạng bài</div>
                        <div style={{ width: 120, fontWeight: 600 }}>Số câu cơ bản</div>
                        <div style={{ width: 120, fontWeight: 600 }}>Số câu nâng cao</div>
                        <div style={{ width: 24 }} />
                      </div>

                      {fields.map((field) => {
                        const currentTopic = items[field.name]?.topic;
                        const filteredOptions = topicOptionsByGrade.map((opt) => ({
                          ...opt,
                          disabled: selectedTopics.includes(opt.value) && opt.value !== currentTopic,
                        }));

                        return (
                          <Space key={`${field.key}-${field.name}`} style={{ display: 'flex', marginBottom: 8 }} align="start">
                            <Form.Item
                              {...field}
                              name={[field.name, 'topic']}
                              fieldKey={[field.fieldKey, 'topic']}
                              rules={[{ required: true, message: 'Chọn dạng bài' }]}
                            >
                              <Select style={{ width: 220 }} options={filteredOptions} placeholder="Chọn dạng bài" />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'basic']}
                              fieldKey={[field.fieldKey, 'basic']}
                              rules={[{ required: true, message: 'Nhập số câu cơ bản' }]}
                            >
                              <InputNumber min={0} style={{ width: 120 }} placeholder="Số Cơ bản" />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'advanced']}
                              fieldKey={[field.fieldKey, 'advanced']}
                              rules={[{ required: true, message: 'Nhập số câu nâng cao' }]}
                            >
                              <InputNumber min={0} style={{ width: 120 }} placeholder="Số Nâng cao" />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(field.name)} style={{ marginTop: 8 }} />
                          </Space>
                        );
                      })}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => {
                            const items = form.getFieldValue(['structure', 'items']) || [];
                            const total = items.reduce((s, it) => s + Number(it?.basic || 0) + Number(it?.advanced || 0), 0);
                            const totalQ = Number(form.getFieldValue('total_questions') || 0);
                            if (totalQ > 0 && total >= totalQ) {
                              message.error('Không thể thêm dạng bài: tổng số câu theo cấu trúc đã đạt tối đa.');
                              return;
                            }
                            add({ topic: undefined, basic: 0, advanced: 0 });
                          }}
                          block
                          icon={<PlusOutlined />}
                        >
                          Thêm dạng bài
                        </Button>
                      </Form.Item>
                      <div style={{ marginTop: 8 }}>
                        <b>Tổng theo cấu trúc:</b>{' '}
                        {(() => {
                          const items = form.getFieldValue(['structure', 'items']) || [];
                          const total = items.reduce((s, it) => s + Number(it?.basic || 0) + Number(it?.advanced || 0), 0);
                          const totalQ = form.getFieldValue('total_questions') || 0;
                          const remaining = totalQ - total;
                          return (
                            <div>
                              <div>
                                <span>
                                  {total} / {totalQ}
                                </span>
                              </div>
                              <div style={{ color: remaining <= 0 ? '#888' : '#333', marginTop: 6 }}>
                                <b>Phần còn lại:</b> {remaining} câu
                              </div>
                              <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                                Lưu ý: Các mục cố định sẽ được lấy trước; phần còn lại (nếu có) sẽ áp dụng % Cơ bản / % Nâng cao.
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                }}
              </Form.List>
            );
          }}
        </Form.Item>
        <Form.Item
          shouldUpdate={(prev, cur) => {
            const items = (cur.structure && cur.structure.items) || [];
            const fixed = items.reduce((s, it) => s + Number(it?.basic || 0) + Number(it?.advanced || 0), 0);
            const totalQ = Number(cur.total_questions || prev.total_questions || 0);
            return (
              fixed !==
                ((prev.structure && prev.structure.items) || []).reduce((s, it) => s + Number(it?.basic || 0) + Number(it?.advanced || 0), 0) ||
              totalQ !== Number(prev.total_questions || 0)
            );
          }}
        >
          {() => {
            const items = form.getFieldValue(['structure', 'items']) || [];
            const fixed = items.reduce((s, it) => s + Number(it?.basic || 0) + Number(it?.advanced || 0), 0);
            const totalQ = form.getFieldValue('total_questions') || 0;
            const remaining = totalQ - fixed;
            const disabledPerc = remaining <= 0;
            return (
              <>
                <Form.Item label="% Cơ bản" name="basic_percent" rules={[{ required: true, message: 'Vui lòng nhập % cơ bản' }]}>
                  <InputNumber
                    min={0}
                    max={100}
                    step={10}
                    style={{ width: '100%' }}
                    placeholder="Nhập % cơ bản"
                    disabled={disabledPerc}
                    onChange={(value) => {
                      // Tự động cập nhật % nâng cao để tổng là 100
                      form.setFieldsValue({ advanced_percent: 100 - (Number(value) || 0) });
                    }}
                  />
                </Form.Item>
                <Form.Item label="% Nâng cao" name="advanced_percent" rules={[{ required: true, message: 'Vui lòng nhập % nâng cao' }]}>
                  <InputNumber min={0} max={100} step={10} disabled style={{ width: '100%' }} />
                </Form.Item>
                {disabledPerc ? <div style={{ color: '#888', fontSize: 12 }}>Các chỉ số % bị vô hiệu vì tổng mục cố định đã đầy.</div> : null}
              </>
            );
          }}
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

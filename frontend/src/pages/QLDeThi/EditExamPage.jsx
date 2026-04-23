import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, message, Spin, Card, Divider } from 'antd';
import api from '../../services/api';
import MathText from '../../utils/MathText';

const EditExamPage = () => {
  const params = useParams();
  const examId = params.id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [examRes, templateRes, questionRes] = await Promise.all([
          api.getAllExams().then((r) => r.data.find((e) => String(e.id) === String(examId))),
          api.getAllExamTemplates().then((r) => r.data),
          api.getQuestionsByExamId(examId).then((r) => r.data),
        ]);
        setExam(examRes);
        setTemplates(templateRes);
        setQuestions(questionRes);
      } catch (err) {
        message.error('Không thể tải dữ liệu đề thi');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [examId]);

  const handleExamSave = async (values) => {
    setSaving(true);
    try {
      await api.updateExam(examId, values);
      message.success('Cập nhật đề thi thành công');
      navigate('/qldethi');
    } catch {
      message.error('Cập nhật đề thi thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (q) => {
    setEditQuestionId(q.id);
    setEditQuestion({ ...q });
  };

  const handleQuestionChange = (field, value) => {
    setEditQuestion((q) => ({ ...q, [field]: value }));
  };

  const handleQuestionSave = async () => {
    // Kiểm tra điều kiện update
    if (
      !editQuestion.content?.trim() ||
      !editQuestion.ans_a?.trim() ||
      !editQuestion.ans_b?.trim() ||
      !editQuestion.ans_c?.trim() ||
      !editQuestion.ans_d?.trim()
    ) {
      message.error('Không được để trống nội dung hoặc đáp án!');
      return;
    }
    // Kiểm tra trùng nội dung trong đề
    if (questions.some((q) => q.id !== editQuestion.id && q.content.trim() === editQuestion.content.trim())) {
      message.error('Nội dung câu hỏi bị trùng trong đề thi!');
      return;
    }
    setSaving(true);
    try {
      await api.updateQuestion(editQuestion.id, editQuestion);
      message.success('Cập nhật câu hỏi thành công');
      // Đồng bộ lại danh sách câu hỏi
      setQuestions((qs) => qs.map((q) => (q.id === editQuestion.id ? { ...editQuestion } : q)));
      setEditQuestionId(null);
      setEditQuestion(null);
    } catch {
      message.error('Cập nhật câu hỏi thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !exam) return <Spin />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2>Chỉnh sửa đề thi</h2>
      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical" initialValues={exam} onFinish={handleExamSave}>
          <Form.Item label="Mã đề thi" name="exam_code" rules={[{ required: true, message: 'Nhập mã đề thi' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Cấu trúc đề thi" name="template_id" rules={[{ required: true, message: 'Chọn cấu trúc đề thi' }]}>
            <Select disabled options={templates.map((t) => ({ value: t.id, label: t.template_name }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Lưu đề thi
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form>
      </Card>
      <Divider orientation="left">Danh sách câu hỏi ({questions.length})</Divider>
      {questions.map((q, idx) => (
        <Card key={q.id} style={{ marginBottom: 16 }}>
          <div>
            <b>Câu {idx + 1}:</b>
          </div>
          {editQuestionId === q.id ? (
            <div>
              <Input.TextArea
                value={editQuestion.content}
                onChange={(e) => handleQuestionChange('content', e.target.value)}
                autoSize={{ minRows: 2 }}
                placeholder="Nội dung (có thể dùng LaTeX)"
              />
              <div style={{ margin: '8px 0' }}>
                <b>Xem trước:</b> <MathText>{editQuestion.content}</MathText>
              </div>
              <Input
                value={editQuestion.ans_a}
                onChange={(e) => handleQuestionChange('ans_a', e.target.value)}
                placeholder="Đáp án A"
                style={{ marginBottom: 4 }}
              />
              <Input
                value={editQuestion.ans_b}
                onChange={(e) => handleQuestionChange('ans_b', e.target.value)}
                placeholder="Đáp án B"
                style={{ marginBottom: 4 }}
              />
              <Input
                value={editQuestion.ans_c}
                onChange={(e) => handleQuestionChange('ans_c', e.target.value)}
                placeholder="Đáp án C"
                style={{ marginBottom: 4 }}
              />
              <Input
                value={editQuestion.ans_d}
                onChange={(e) => handleQuestionChange('ans_d', e.target.value)}
                placeholder="Đáp án D"
                style={{ marginBottom: 4 }}
              />
              <div style={{ margin: '8px 0' }}>
                <b>Xem trước đáp án:</b>
                <div>
                  A. <MathText>{editQuestion.ans_a}</MathText>
                </div>
                <div>
                  B. <MathText>{editQuestion.ans_b}</MathText>
                </div>
                <div>
                  C. <MathText>{editQuestion.ans_c}</MathText>
                </div>
                <div>
                  D. <MathText>{editQuestion.ans_d}</MathText>
                </div>
              </div>
              <Button type="primary" onClick={handleQuestionSave} loading={saving}>
                Lưu câu hỏi
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setEditQuestionId(null);
                  setEditQuestion(null);
                }}
              >
                Huỷ
              </Button>
            </div>
          ) : (
            <div>
              <div>
                <MathText>{q.content}</MathText>
              </div>
              <div style={{ marginLeft: 12 }}>
                <div>
                  A. <MathText>{q.ans_a}</MathText>
                </div>
                <div>
                  B. <MathText>{q.ans_b}</MathText>
                </div>
                <div>
                  C. <MathText>{q.ans_c}</MathText>
                </div>
                <div>
                  D. <MathText>{q.ans_d}</MathText>
                </div>
              </div>
              <Button size="small" style={{ marginTop: 8 }} onClick={() => handleEditQuestion(q)}>
                Sửa câu hỏi
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default EditExamPage;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Radio, Progress, message } from 'antd';
import participantApi from '../../services/participantApi';
import api from '../../services/api';
import MathText from '../../utils/MathText';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

function getRandomExamId(examIds) {
  if (!examIds || examIds.length === 0) return null;
  const idx = Math.floor(Math.random() * examIds.length);
  return examIds[idx];
}

const ThucHienBaiThi = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examCode, setExamCode] = useState('');
  const [initDone, setInitDone] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 phút mặc định
  const [totalTime, setTotalTime] = useState(3600);
  const [examResultId, setExamResultId] = useState(null); // Lưu id bài thi

  // Khi vào trang, gọi BE random mã đề và lấy câu hỏi
  useEffect(() => {
    const fetchSessionAndExam = async () => {
      try {
        setLoading(true);
        // Lấy thông tin ca thi (để lấy tên ca, thời lượng...)
        const res = await api.getExamSessionById(sessionId);
        setSession(res.data);
        // Đánh dấu đã vào thi
        if (user?.id && sessionId) {
          await participantApi.markJoined({ session_id: sessionId, user_id: user.id });
        }
        // Kiểm tra đã có exam_result cho session_id này chưa
        let existedResult = null;
        try {
          const existed = await api.getExamResultsByStudent(user?.id);
          existedResult = (existed.data || []).find((r) => r.session_id === Number(sessionId));
        } catch (err) {
          console.error('Lỗi khi kiểm tra bản ghi kết quả:', err);
        }
        if (existedResult) {
          // Đã có: dùng lại exam_id, exam_result_id, lấy lại câu hỏi theo exam_id cũ
          setExamId(existedResult.exam_id);
          setExamResultId(existedResult.id);
          // Lấy lại câu hỏi theo exam_id cũ
          try {
            const examQuestions = await api.getQuestionsByExamId(existedResult.exam_id);
            setQuestions(examQuestions.data || []);
          } catch {
            setQuestions([]);
          }
          setAnswers(existedResult.answers_log || {});
          setCurrent(0);
          setExamCode(''); // Nếu muốn lấy lại mã đề, cần thêm api lấy exam_code theo exam_id
        } else {
          // Chưa có: random mã đề mới và tạo bản ghi mới
          const examRes = await api.startExamSession(sessionId);
          setExamId(examRes.data.exam_id);
          setExamCode(examRes.data.exam_code);
          setQuestions(examRes.data.questions || []);
          setAnswers({});
          setCurrent(0);
          let result;
          try {
            result = await api.createExamResult({
              student_id: Number(user?.id),
              exam_id: Number(examRes.data.exam_id),
              session_id: Number(sessionId),
              answers_log: null,
              is_submitted: false,
              submitted_at: null,
              duration_seconds: 0,
            });
            if (result && result.data && result.data.id) setExamResultId(result.data.id);
          } catch (err) {
            console.error('Lỗi khi tạo bản ghi kết quả:', err);
          }
        }
        setInitDone(true);
      } catch {
        message.error('Không thể bắt đầu làm bài hoặc tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchSessionAndExam();
    // eslint-disable-next-line
  }, [sessionId]);

  // Không cần random mã đề và lấy câu hỏi ở FE nữa

  // Đếm ngược thời gian
  useEffect(() => {
    if (!session) return;
    const t = session.duration ? session.duration * 60 : 3600;
    setTimeLeft(t);
    setTotalTime(t);
  }, [session]);
  // Nộp tự động khi hết giờ
  useEffect(() => {
    if (timeLeft <= 0) {
      // Nếu chưa nộp chủ động thì gọi nộp tự động
      if (!submitting) {
        setSubmitting(true);
        const duration_seconds = totalTime;
        api
          .autoSubmitExamResult({ student_id: user?.id, exam_id: examId, session_id: sessionId, duration_seconds })
          .then(() => {
            message.success('Đã tự động nộp bài khi hết giờ!');
            navigate('/qlketquathi');
          })
          .catch(() => {
            message.error('Nộp bài tự động thất bại!');
            navigate('/qlketquathi');
          })
          .finally(() => setSubmitting(false));
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitting, user?.id, examId, sessionId, navigate, totalTime]);

  const handleAnswer = async (qid, val) => {
    const newAnswers = { ...answers, [qid]: val };
    setAnswers(newAnswers);
    // Lưu đáp án tạm thời lên server (is_submitted: false), chỉ update bản ghi đã có
    try {
      // Luôn update, không tạo mới
      await api.createExamResult({
        student_id: user?.id,
        exam_id: examId,
        session_id: sessionId,
        answers_log: newAnswers,
        is_submitted: false,
        submitted_at: null,
        duration_seconds: totalTime - timeLeft,
      });
    } catch {}
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const duration_seconds = totalTime - timeLeft;
      // Luôn update, không tạo mới
      await api.createExamResult({
        student_id: user?.id,
        exam_id: examId,
        session_id: sessionId,
        answers_log: answers,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        duration_seconds,
      });
      message.success('Nộp bài thành công!');
      navigate('/qlketquathi');
    } catch {
      message.error('Nộp bài thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !session || !initDone) return <div>Đang tải dữ liệu...</div>;
  if (!questions.length) return <div>Không có câu hỏi nào trong mã đề này.</div>;

  const q = questions[current];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{session.session_name}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            Mã đề: <b>{examCode}</b>
          </div>
          <div>
            Thời gian còn lại: <b>{formatTime(timeLeft)}</b>
          </div>
        </div>
        <Progress percent={((current + 1) / questions.length) * 100} showInfo={false} />
        <Card style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <b>
              Câu {current + 1}/{questions.length}:
            </b>
            <div style={{ marginTop: 8 }}>
              <MathText>{q.content}</MathText>
            </div>
          </div>
          <Radio.Group value={answers[q.id]} onChange={(e) => handleAnswer(q.id, e.target.value)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Radio value="A">
                <b>A.</b> <MathText>{q.ans_a}</MathText>
              </Radio>
              <Radio value="B">
                <b>B.</b> <MathText>{q.ans_b}</MathText>
              </Radio>
              <Radio value="C">
                <b>C.</b> <MathText>{q.ans_c}</MathText>
              </Radio>
              <Radio value="D">
                <b>D.</b> <MathText>{q.ans_d}</MathText>
              </Radio>
            </div>
          </Radio.Group>
        </Card>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            Câu trước
          </Button>
          {current === questions.length - 1 ? (
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              Nộp bài
            </Button>
          ) : (
            <Button type="primary" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
              Câu tiếp theo
            </Button>
          )}
        </div>
      </div>
      {/* Sidebar câu hỏi */}
      <div
        style={{
          width: 120,
          marginLeft: 32,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 24,
          height: 'fit-content',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Danh sách câu hỏi</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {questions.map((ques, idx) => {
            const answered = answers[ques.id] !== undefined && answers[ques.id] !== null && answers[ques.id] !== '';
            const isCurrent = idx === current;
            return (
              <button
                key={ques.id}
                onClick={() => setCurrent(idx)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: isCurrent ? '2px solid #1890ff' : '1px solid #ccc',
                  background: answered ? '#85b4e3' : '#fff',
                  color: isCurrent ? '#1890ff' : '#333',
                  fontWeight: answered ? 600 : 400,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: isCurrent ? '0 0 0 2px #bae7ff' : 'none',
                  transition: 'all 0.2s',
                }}
                title={`Câu ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThucHienBaiThi;

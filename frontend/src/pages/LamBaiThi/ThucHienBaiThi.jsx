import VoHieu from './VoHieu';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Radio, Progress, message, Modal } from 'antd';
import participantApi from '../../services/participantApi';
import api from '../../services/api';
import MathText from '../../utils/MathText';
import { ReloadOutlined } from '@ant-design/icons';

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

const ThucHienBaiThi = ({ setSidebarCollapsed }) => {
  // Ẩn header khi vào trang làm bài
  useEffect(() => {
    // Ẩn header nếu có
    const header = document.querySelector('.app-header, header, #header');
    if (header) {
      header.style.display = 'none';
    }
    return () => {
      if (header) header.style.display = '';
    };
  }, []);
  // Đảm bảo sidebar luôn đóng khi vào trang này, kể cả F5
  useEffect(() => {
    if (typeof setSidebarCollapsed === 'function') setSidebarCollapsed(true);
    // Lưu trạng thái vào localStorage để giữ khi F5
    localStorage.setItem('sidebarCollapsed', 'true');
    return () => {
      // Khi rời trang này, có thể mở lại sidebar nếu muốn (tùy logic)
      // localStorage.removeItem('sidebarCollapsed');
    };
  }, [setSidebarCollapsed]);
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  // Trạng thái khoá bài khi chuyển tab
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(120); // 2 phút mặc định
  const [showUnlockBtn, setShowUnlockBtn] = useState(false);
  const [viPhamCount, setViPhamCount] = useState(0); // Đếm số lần vi phạm
  const [lockDuration, setLockDuration] = useState(120); // Thời gian khoá lấy từ ca thi

  // Khi vi phạm (chuyển tab/cửa sổ), khoá bài và bắt đầu đếm ngược, đồng thời ghi log vi phạm
  const handleViPham = () => {
    // Ghi log vi phạm lên BE
    if (user?.id && sessionId) {
      api
        .addViolationLog({
          student_id: user.id,
          session_id: sessionId,
          type: 'tab_switch',
          note: 'Chuyển tab hoặc cửa sổ khi làm bài',
        })
        .catch(() => {});
    }
    setViPhamCount((prev) => {
      // Nếu đã locked thì không tăng tiếp và không nộp bài tự động nữa
      if (locked) return prev;
      const newCount = prev + 1;
      if (newCount >= 3) {
        handleSubmit(true); // true: là vi phạm
      } else {
        setLocked(true);
        setLockCountdown(lockDuration);
        setShowUnlockBtn(false);
      }
      return newCount;
    });
  };

  // Đếm ngược khi bị khoá
  useEffect(() => {
    if (!locked) return;
    if (lockCountdown <= 0) {
      setShowUnlockBtn(true);
      return;
    }
    const timer = setTimeout(() => setLockCountdown((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [locked, lockCountdown]);
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examCode, setExamCode] = useState('');
  const [initDone, setInitDone] = useState(false);
  const [current, setCurrent] = useState(0);
  // Lưu các câu đã xem nhưng chưa trả lời
  const [viewedQuestions, setViewedQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
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
        setLockDuration(res.data.lock_duration_seconds ?? 120);
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
          // Đã có: dùng lại exam_id, exam_result_id, lấy lại câu hỏi random từ BE (đảm bảo đúng thứ tự và đáp án)
          setExamId(existedResult.exam_id);
          setExamResultId(existedResult.id);
          try {
            // Gọi lại startExamSession để lấy lại thứ tự random câu hỏi/đáp án đúng với lần đầu
            const examRes = await api.startExamSession(sessionId);
            setQuestions(examRes.data.questions || []);
            setExamCode(examRes.data.exam_code);
          } catch {
            setQuestions([]);
            setExamCode('');
          }
          setAnswers(existedResult.answers_log || {});
          setCurrent(0);
        } else {
          // Chưa có: lấy đề và random từ BE, tạo bản ghi mới
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
    // Ưu tiên lấy manual_status_time (thời điểm thực tế ca thi bắt đầu), nếu không có thì lấy start_time
    const start = session.manual_status_time ? new Date(session.manual_status_time).getTime() : new Date(session.start_time).getTime();
    const duration = session.duration ? session.duration * 60 * 1000 : 3600 * 1000; // ms
    const end = start + duration;
    const now = Date.now();
    const timeLeftSec = Math.max(0, Math.floor((end - now) / 1000));
    setTimeLeft(timeLeftSec);
    setTotalTime(duration / 1000);
  }, [session]);
  // Nộp tự động khi hết giờ
  useEffect(() => {
    if (timeLeft <= 0) {
      // Nếu chưa nộp chủ động thì gọi nộp tự động
      if (!submitting && !autoSubmitted) {
        setSubmitting(true);
        setAutoSubmitted(true);
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
  }, [timeLeft, submitting, autoSubmitted, user?.id, examId, sessionId, navigate, totalTime]);

  // Khi chuyển câu hỏi, đánh dấu đã xem nếu chưa trả lời
  const handleSetCurrent = (idx) => {
    const qid = questions[idx]?.id;
    if (qid && !answers[qid] && !viewedQuestions.includes(qid)) {
      setViewedQuestions((prev) => [...prev, qid]);
    }
    setCurrent(idx);
  };

  const handleAnswer = async (qid, val) => {
    // Lưu key đáp án (A/B/C/D) vào state
    const newAnswers = { ...answers, [qid]: val };
    setAnswers(newAnswers);
    // Khi gửi lên BE, chuyển sang nội dung đáp án
    const fullAnswers = {};
    questions.forEach((q) => {
      const key = newAnswers[q.id];
      let answerText = '';
      if (key === 'A') answerText = q.ans_a;
      else if (key === 'B') answerText = q.ans_b;
      else if (key === 'C') answerText = q.ans_c;
      else if (key === 'D') answerText = q.ans_d;
      fullAnswers[q.id] = answerText || '';
    });
    try {
      await api.createExamResult({
        student_id: user?.id,
        exam_id: examId,
        session_id: sessionId,
        answers_log: fullAnswers,
        is_submitted: false,
        submitted_at: null,
        duration_seconds: totalTime - timeLeft,
      });
    } catch {}
  };
  const reloadExam = () => {
    setInitDone(false);
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isViPhamSubmit, setIsViPhamSubmit] = useState(false);

  const handleSubmit = async (isViPham = false) => {
    if (isViPham) {
      // Nộp do vi phạm, bỏ qua xác nhận
      await doSubmit(true);
      return;
    }
    setIsViPhamSubmit(false);
    setConfirmModalVisible(true);
  };

  const doSubmit = async (isViPham = false) => {
    if (submitting) return;
    setSubmitting(true);
    setLocked(false); // Đảm bảo đóng modal vi phạm khi nộp bài chủ động
    // Đảm bảo mọi câu hỏi đều có key, nếu chưa trả lời thì là ""
    const fullAnswers = {};
    questions.forEach((q) => {
      const key = answers[q.id];
      let answerText = '';
      if (key === 'A') answerText = q.ans_a;
      else if (key === 'B') answerText = q.ans_b;
      else if (key === 'C') answerText = q.ans_c;
      else if (key === 'D') answerText = q.ans_d;
      fullAnswers[q.id] = answerText || '';
    });
    try {
      const duration_seconds = totalTime - timeLeft;
      console.log('answers_log gửi lên BE (doSubmit):', fullAnswers);
      await api.createExamResult({
        student_id: user?.id,
        exam_id: examId,
        session_id: sessionId,
        answers_log: fullAnswers,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        duration_seconds,
      });
      if (isViPham) {
        message.error('Bạn đã vi phạm 3 lần. Bài thi đã bị nộp tự động!');
      } else {
        message.success('Nộp bài thành công!');
      }
      navigate('/qlketquathi');
    } catch {
      message.error('Nộp bài thất bại!');
    } finally {
      setSubmitting(false);
      setConfirmModalVisible(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !session || !initDone) return <div>Đang tải dữ liệu...</div>;
  if (!questions.length) return <div>Không có câu hỏi nào trong mã đề này.</div>;

  const q = questions[current];

  return (
    <>
      <VoHieu onViPham={handleViPham} />
      {locked && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff', background: 'rgba(0,0,0,0.7)', padding: 32, borderRadius: 12, minWidth: 320 }}>
            <h2>Bài thi đã bị khoá do bạn chuyển tab hoặc mở cửa sổ khác!</h2>
            <span>Nếu bạn vi phạm 3 lần, bài thi sẽ bị nộp tự động.</span>
            <p>
              Vui lòng chờ <b>{lockCountdown > 0 ? lockCountdown : 0}</b> giây để tiếp tục làm bài.
            </p>
            <p style={{ color: '#ff7875', fontWeight: 600 }}>Số lần vi phạm: {viPhamCount} / 3</p>
            {showUnlockBtn && (
              <Button type="primary" onClick={() => setLocked(false)}>
                Xác nhận tiếp tục làm bài
              </Button>
            )}
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          pointerEvents: locked ? 'none' : 'auto',
          opacity: locked ? 0.5 : 1,
        }}
      >
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <h2>{session.session_name}</h2>
            <ReloadOutlined onClick={reloadExam} title="Tải lại bài thi" />
          </div>
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
            <Button onClick={() => handleSetCurrent(Math.max(0, current - 1))} disabled={current === 0}>
              Câu trước
            </Button>
            {current === questions.length - 1 ? (
              <Button type="primary" onClick={() => handleSubmit(false)} loading={submitting}>
                Nộp bài
              </Button>
            ) : (
              <Button type="primary" onClick={() => handleSetCurrent(Math.min(questions.length - 1, current + 1))}>
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
              const answered = !!answers[ques.id] && answers[ques.id].trim() !== '';
              const isCurrent = idx === current;
              const viewed = viewedQuestions.includes(ques.id);
              let bg = '#fff';
              if (answered)
                bg = '#85b4e3'; // đã trả lời
              else if (viewed) bg = '#d9d9d9'; // đã xem nhưng chưa trả lời
              return (
                <button
                  key={ques.id}
                  onClick={() => handleSetCurrent(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: isCurrent ? '2px solid #1890ff' : '1px solid #ccc',
                    background: bg,
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
      {/* Modal xác nhận nộp bài */}
      <Modal
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={() => doSubmit(false)}
        okText="Xác nhận nộp bài"
        cancelText="Quay lại"
        title="Xác nhận nộp bài"
        centered
        confirmLoading={submitting}
      >
        {(() => {
          // Đếm số câu đã trả lời: chỉ tính những câu đã chọn đáp án (A/B/C/D)
          const answeredCount = questions.filter((q) => answers[q.id]).length;
          // Các câu chưa trả lời: chưa chọn đáp án (answers[q.id] là undefined hoặc rỗng)
          const unanswered = questions.filter((q) => !answers[q.id]);
          return (
            <div>
              <p>
                Bạn đã trả lời <b>{answeredCount}</b> / <b>{questions.length}</b> câu hỏi.
              </p>
              {unanswered.length > 0 ? (
                <div>
                  <p style={{ color: '#faad14' }}>
                    Các câu chưa trả lời: {unanswered.map((q) => questions.findIndex((ques) => ques.id === q.id) + 1).join(', ')}
                  </p>
                  <p>Bạn có chắc chắn muốn nộp bài không?</p>
                </div>
              ) : (
                <p>Bạn đã trả lời hết tất cả các câu hỏi. Xác nhận nộp bài?</p>
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
};

export default ThucHienBaiThi;

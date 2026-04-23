import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Spin, Alert, Button } from 'antd';
function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
import MathText from '../../utils/MathText';
import api from '../../services/api';

const columns = [
  {
    title: 'STT',
    dataIndex: 'index',
    key: 'index',
    render: (_, __, idx) => idx + 1,
    width: 60,
  },
  {
    title: 'Câu hỏi',
    dataIndex: 'question_content',
    key: 'question_content',
    render: (text) => <MathText>{text}</MathText>,
  },
  {
    title: 'A',
    dataIndex: 'ans_a',
    key: 'ans_a',
    render: (text) => <MathText>{text}</MathText>,
  },
  {
    title: 'B',
    dataIndex: 'ans_b',
    key: 'ans_b',
    render: (text) => <MathText>{text}</MathText>,
  },
  {
    title: 'C',
    dataIndex: 'ans_c',
    key: 'ans_c',
    render: (text) => <MathText>{text}</MathText>,
  },
  {
    title: 'D',
    dataIndex: 'ans_d',
    key: 'ans_d',
    render: (text) => <MathText>{text}</MathText>,
  },
  {
    title: 'Đáp án của bạn',
    dataIndex: 'your_answer',
    key: 'your_answer',
    render: (val) => val || <span style={{ color: 'gray' }}>Chưa chọn</span>,
  },
  {
    title: 'Đáp án đúng',
    dataIndex: 'correct_answer',
    key: 'correct_answer',
    render: (val) => <b style={{ color: 'blue' }}>{val}</b>,
  },
  {
    title: 'Kết quả',
    dataIndex: 'is_correct',
    key: 'is_correct',
    render: (val, row) =>
      row.your_answer ? (
        val ? (
          <span style={{ color: 'green' }}>Đúng</span>
        ) : (
          <span style={{ color: 'red' }}>Sai</span>
        )
      ) : (
        <span style={{ color: 'gray' }}>--</span>
      ),
  },
  {
    title: 'Lời giải',
    dataIndex: 'explanation',
    key: 'explanation',
    render: (val) => (val ? <MathText>{val}</MathText> : <span style={{ color: 'gray' }}>--</span>),
  },
];

export default function XemKetQuaThi() {
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState({}); // { [question_id]: true/false }
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getExamResultById(resultId);
        setData(res.data);
      } catch (err) {
        setError('Không thể tải kết quả thi.');
        console.error('API getExamResultById error:', err);
      }
      setLoading(false);
    }
    fetchResult();
  }, [resultId]);

  const [examInfo, setExamInfo] = useState({ exam_code: '', session_name: '', student_name: '' });

  useEffect(() => {
    if (data) {
      // Lấy thông tin mã đề, ca thi, học sinh
      Promise.all([api.getAllExams(), api.getAllExamSessions(), api.getAllUsers()]).then(([examsRes, sessionsRes, usersRes]) => {
        const exam = (examsRes.data || []).find((e) => e.id === data.exam_id);
        const session = (sessionsRes.data || []).find((s) => s.id === data.session_id);
        const user = (usersRes.data || []).find((u) => u.id === data.student_id);
        setExamInfo({
          exam_code: exam ? exam.exam_code : data.exam_id,
          session_name: session ? session.session_name : data.session_id,
          student_name: user ? user.full_name : data.student_id,
        });
      });
    }
  }, [data]);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return <Alert type="info" message="Không có dữ liệu kết quả thi." />;

  // Hàm mở/đóng tất cả lời giải
  const handleToggleAll = () => {
    if (!data || !data.details) return;
    if (!showAll) {
      // Mở tất cả
      const all = {};
      data.details.forEach((q) => {
        all[q.question_id] = true;
      });
      setShowExplanation(all);
      setShowAll(true);
    } else {
      // Đóng tất cả
      setShowExplanation({});
      setShowAll(false);
    }
  };

  // Tính tỷ lệ đúng/sai
  const total = data.details.length;
  const correct = data.details.filter((q) => q.is_correct).length;
  const wrong = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
      <Card title={`Kết quả thi của bạn`}>
        <div style={{ marginBottom: 24 }}>
          <table style={{ width: '100%', background: '#f8fafd', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: 160 }}>Họ tên học sinh</td>
                <td>{examInfo.student_name}</td>
                <td style={{ fontWeight: 600, width: 120 }}>Mã đề</td>
                <td>{examInfo.exam_code}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Ca thi</td>
                <td>{examInfo.session_name}</td>
                <td style={{ fontWeight: 600 }}>Điểm số</td>
                <td>{data.score}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Thời gian làm bài</td>
                <td>{formatTime(data.duration_seconds)}</td>
                <td style={{ fontWeight: 600 }}>Tỷ lệ đúng/sai</td>
                <td>
                  <span style={{ color: 'green', fontWeight: 600 }}>{correct}</span> / {total} &nbsp; (
                  <span style={{ color: 'green' }}>{percent}% đúng</span>, <span style={{ color: 'red' }}>{wrong} sai</span>)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleToggleAll}
            style={{ padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {showAll ? 'Ẩn tất cả lời giải' : 'Hiển thị tất cả lời giải'}
          </button>
        </div>
        <div>
          {data.details.map((row, idx) => (
            <div key={row.question_id} style={{ borderBottom: '1px solid #eee', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#1976d2', marginRight: 8 }}>{idx + 1}.</span>
                <MathText>{row.question_content}</MathText>
              </div>
              <div style={{ marginLeft: 32, marginBottom: 8 }}>
                <div>
                  A. <MathText>{row.ans_a}</MathText>
                </div>
                <div>
                  B. <MathText>{row.ans_b}</MathText>
                </div>
                <div>
                  C. <MathText>{row.ans_c}</MathText>
                </div>
                <div>
                  D. <MathText>{row.ans_d}</MathText>
                </div>
              </div>
              <div style={{ marginLeft: 32, marginBottom: 8 }}>
                <span>
                  Đáp án của bạn: <b style={{ color: row.your_answer === row.correct_answer ? 'green' : 'red' }}>{row.your_answer || 'Chưa chọn'}</b>
                </span>
                &nbsp;|&nbsp;
                <span>
                  Đáp án đúng: <b style={{ color: '#1976d2' }}>{row.correct_answer}</b>
                </span>
                &nbsp;|&nbsp;
                <span>
                  Kết quả:{' '}
                  {row.your_answer ? (
                    row.is_correct ? (
                      <span style={{ color: 'green' }}>Đúng</span>
                    ) : (
                      <span style={{ color: 'red' }}>Sai</span>
                    )
                  ) : (
                    <span style={{ color: 'gray' }}>--</span>
                  )}
                </span>
              </div>
              <div style={{ marginLeft: 32 }}>
                <a
                  href="#"
                  style={{ fontSize: 14, color: '#1976d2' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowExplanation((prev) => ({ ...prev, [row.question_id]: !prev[row.question_id] }));
                  }}
                >
                  {showExplanation[row.question_id] ? 'Ẩn lời giải' : 'Giải thích chi tiết đáp án'}
                </a>
                {(showExplanation[row.question_id] || showAll) && row.explanation && (
                  <div style={{ marginTop: 8, background: '#f6f8fa', padding: 12, borderRadius: 4 }}>
                    <MathText>{row.explanation}</MathText>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

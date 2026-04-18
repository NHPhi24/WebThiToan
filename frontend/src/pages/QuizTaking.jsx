import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, Progress, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import MathText from '../utils/MathText';
import axios from 'axios';

const QuizTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Mock questions for demo
      setQuestions([
        {
          id: 1,
          content: 'Giải phương trình: \\( x^2 - 4x + 3 = 0 \\)',
          ans_a: '\\( x = 1 \\)',
          ans_b: '\\( x = 3 \\)',
          ans_c: '\\( x = 1, 3 \\)',
          ans_d: '\\( x = -1, -3 \\)',
          correct_ans: 'C',
          level: 'BASIC',
        },
        {
          id: 2,
          content: 'Tính giới hạn: \\( \\lim_{x \\to 0} \\frac{\\sin x}{x} \\)',
          ans_a: '0',
          ans_b: '1',
          ans_c: '\\( \\infty \\)',
          ans_d: '-1',
          correct_ans: 'B',
          level: 'ADVANCED',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      await axios.post('http://localhost:3001/api/exam-results', {
        student_id: 1, // Mock student ID
        exam_id: id,
        session_id: 1, // Mock session ID
        answers_log: answers,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
      });
      message.success('Nộp bài thành công!');
      navigate('/results');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      message.error('Có lỗi xảy ra khi nộp bài!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div>Đang tải câu hỏi...</div>;
  }

  if (questions.length === 0) {
    return <div>Không có câu hỏi nào.</div>;
  }

  const question = questions[currentQuestion];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1>Bài thi {id}</h1>
        <div>
          <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
          <Progress
            percent={
              ((questions.length - currentQuestion) / questions.length) * 100
            }
            showInfo={false}
            style={{ width: 200, marginLeft: 16 }}
          />
        </div>
      </div>

      <Card className="quiz-question">
        <div style={{ marginBottom: 16 }}>
          <strong>
            Câu {currentQuestion + 1}/{questions.length}:
          </strong>
          <div className="math-formula" style={{ fontSize: 16, marginTop: 8 }}>
            <MathText>{question.content}</MathText>
          </div>
        </div>

        <Radio.Group
          value={answers[question.id]}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
        >
          <div className="quiz-options">
            <Radio value="A" className="quiz-option">
              <strong>A.</strong> <MathText>{question.ans_a}</MathText>
            </Radio>
            <Radio value="B" className="quiz-option">
              <strong>B.</strong> <MathText>{question.ans_b}</MathText>
            </Radio>
            <Radio value="C" className="quiz-option">
              <strong>C.</strong> <MathText>{question.ans_c}</MathText>
            </Radio>
            <Radio value="D" className="quiz-option">
              <strong>D.</strong> <MathText>{question.ans_d}</MathText>
            </Radio>
          </div>
        </Radio.Group>
      </Card>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button onClick={prevQuestion} disabled={currentQuestion === 0}>
          Câu trước
        </Button>

        {currentQuestion === questions.length - 1 ? (
          <Button type="primary" onClick={submitQuiz}>
            Nộp bài
          </Button>
        ) : (
          <Button type="primary" onClick={nextQuestion}>
            Câu tiếp theo
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizTaking;

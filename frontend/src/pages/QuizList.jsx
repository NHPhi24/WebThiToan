import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/exams');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      // Mock data for demo
      setQuizzes([
        {
          id: 1,
          exam_code: 'MATH101',
          template_id: 1,
          teacher_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          exam_code: 'MATH102',
          template_id: 1,
          teacher_id: 1,
          created_at: '2024-01-02T00:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div>
      <h1>Danh sách bài thi</h1>

      <List
        loading={loading}
        dataSource={quizzes}
        renderItem={(quiz) => (
          <List.Item>
            <Card
              style={{ width: '100%' }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => startQuiz(quiz.id)}
                >
                  Bắt đầu thi
                </Button>
              ]}
            >
              <Card.Meta
                title={`Bài thi ${quiz.exam_code}`}
                description={
                  <div>
                    <p>Mã đề: {quiz.exam_code}</p>
                    <p>Thời gian tạo: {new Date(quiz.created_at).toLocaleDateString('vi-VN')}</p>
                    <Tag color="blue">Toán học</Tag>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default QuizList;
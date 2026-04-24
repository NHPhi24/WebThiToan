import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const LamBaiThi = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  const fetchSessions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      // Sử dụng API mới để lấy trạng thái đăng ký
      const res = await api.getOngoingExamSessionsWithRegisterStatus(user.id);
      setSessions(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách ca thi');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (session) => {
    // Điều hướng sang trang làm bài, truyền session_id và exam_id đầu tiên (nếu có)
    if (session.exam_ids && session.exam_ids.length > 0) {
      navigate(`/lam-bai-thi/${session.id}?exam_id=${session.exam_ids[0]}`);
    } else {
      message.warning('Ca thi này chưa có đề thi!');
    }
  };

  return (
    <div>
      <h1>Ca thi đang diễn ra bạn được phép làm</h1>
      <List
        loading={loading}
        dataSource={sessions}
        renderItem={(session) => (
          <List.Item>
            <Card
              style={{ width: '100%' }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => navigate(`/lam-bai-thi/${session.id}?exam_id=${session.exam_ids?.[0]}`)}
                  disabled={!session.exam_ids || session.exam_ids.length === 0 || session.register_status !== 20}
                >
                  Bắt đầu thi
                </Button>,
              ]}
            >
              <Card.Meta
                title={session.session_name}
                description={
                  <div>
                    <p>Thời gian bắt đầu: {new Date(session.start_time).toLocaleString('vi-VN')}</p>
                    <p>Thời lượng: {session.duration} phút</p>
                    <Tag color="green">Đang diễn ra</Tag>
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

export default LamBaiThi;

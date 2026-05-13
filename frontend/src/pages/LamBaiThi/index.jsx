import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const LamBaiThi = ({ setSidebarCollapsed }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittedSessionIds, setSubmittedSessionIds] = useState([]); // các ca đã nộp bài
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    fetchSessions();
    fetchSubmittedSessions();
    // eslint-disable-next-line
  }, []);

  // Lấy danh sách ca thi đã nộp bài của học sinh
  const fetchSubmittedSessions = async () => {
    if (!user?.id) return;
    try {
      const res = await api.getExamResultsByStudent(user.id);
      // Lấy ra session_id của các bài đã nộp
      const submitted = (res.data || []).filter((r) => r.is_submitted).map((r) => r.session_id);
      setSubmittedSessionIds(submitted);
    } catch {}
  };

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
    // Đóng sidebar trước khi chuyển trang
    if (typeof setSidebarCollapsed === 'function') setSidebarCollapsed(true);
    // Nếu đã thi rồi thì không cho vào nữa
    const hasSubmitted = session.has_submitted || submittedSessionIds.includes(session.id);
    if (hasSubmitted) {
      message.warning('Bạn chỉ được thi 1 lần duy nhất cho ca này!');
      return;
    }
    if (session.exam_ids && session.exam_ids.length > 0) {
      navigate(`/lam-bai-thi/${session.id}?exam_id=${session.exam_ids[0]}`);
    } else {
      message.warning('Ca thi này chưa có đề thi!');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <h1>Ca thi đang diễn ra bạn được phép làm</h1>
        <ReloadOutlined onClick={fetchSessions} style={{ fontSize: 20, cursor: 'pointer' }} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          border: '1px solid #d7d7d7',
          padding: 16,
          backgroundColor: '#fff',
          borderRadius: 4,
        }}
      >
        <div>
          <b style={{ color: 'red' }}>Lưu ý:</b>
        </div>
        <div>
          - <strong>Bạn chỉ được thi 1 lần duy nhất cho mỗi ca thi.</strong>
        </div>
        <div>
          - Nếu trong quá trình thi mà bạn<strong> chuyển tabs</strong> hoặc <strong>mở ứng dụng khác</strong>, ngoài màn hình thi sẽ được xem là vi
          phạm.
        </div>
        <div>
          - Nếu vi phạm đến <strong>lần thứ 3</strong> thì hệ thống sẽ tự động nộp bài của bạn.
        </div>
        <div>- Nếu có bất kỳ lỗi nào xảy ra trong quá trình thi, vui lòng liên hệ giáo viên để được hỗ trợ.</div>
      </div>
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
                  onClick={() => startQuiz(session)}
                  disabled={
                    !session.exam_ids ||
                    session.exam_ids.length === 0 ||
                    session.register_status !== 20 ||
                    session.has_submitted ||
                    submittedSessionIds.includes(session.id)
                  }
                >
                  {session.has_submitted || submittedSessionIds.includes(session.id) ? 'Đã nộp bài' : 'Bắt đầu thi'}
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

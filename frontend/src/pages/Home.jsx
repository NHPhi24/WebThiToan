import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, List, Tag, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CalculatorOutlined, FieldNumberOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import apiService from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

// Lấy ca thi sắp diễn ra từ API

// Mock tổng thành tích
const mockStats = {
  totalExams: 12,
  bestScore: 9.5,
  avgScore: 7.8,
  totalQuestions: 320,
  rank: 5,
};

const Home = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  // Có thể fetch từ API thật nếu muốn
  useEffect(() => {
    // Lấy ca thi sắp diễn ra
    apiService
      .getAllExamSessions()
      .then((res) => {
        // Lọc các ca thi có thời gian bắt đầu trong tương lai
        const now = dayjs();
        const upcoming = (res.data || []).filter((e) => dayjs(e.start_time).isAfter(now));
        // Sắp xếp tăng dần theo thời gian bắt đầu
        upcoming.sort((a, b) => dayjs(a.start_time) - dayjs(b.start_time));
        setUpcomingExams(upcoming.slice(0, 5)); // chỉ lấy 5 ca gần nhất
      })
      .catch(() => setUpcomingExams([]));
    setStats(mockStats);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
      <Title level={1} style={{ marginBottom: 12, color: '#1890ff' }}>
        🎓 Chào mừng bạn đến với Web Thi Toán
      </Title>
      <Paragraph style={{ fontSize: 18, marginBottom: 24, color: '#555' }}>
        Website thi trắc nghiệm <b>Toán học THPT</b> - Nền tảng luyện tập, kiểm tra và thi thử các chuyên đề toán từ cơ bản đến nâng cao.
        <br />
        Hỗ trợ học sinh ôn luyện, giáo viên tổ chức thi, thống kê kết quả và nhiều tiện ích khác!
        <br />
        <br />
        <b>✔️ Kho đề phong phú</b>: Đề thi thử, kiểm tra định kỳ, luyện tập theo chuyên đề, cập nhật liên tục.
        <br />
        <b>✔️ Giao diện thân thiện</b>: Dễ sử dụng trên mọi thiết bị, từ máy tính đến điện thoại.
        <br />
        <b>✔️ Chấm điểm tự động</b>: Kết quả nhanh chóng, phân tích chi tiết từng câu hỏi.
        <br />
        <b>✔️ Cộng đồng học toán</b>: Cùng trao đổi, chia sẻ kinh nghiệm, giải đáp thắc mắc.
        <br />
        <b>✔️ Miễn phí & tiện lợi</b>: Truy cập mọi lúc, mọi nơi, không cần cài đặt.
        <br />
        <br />
        Hãy bắt đầu hành trình chinh phục Toán học cùng chúng tôi và nâng cao thành tích của bạn mỗi ngày!
      </Paragraph>

      <Row gutter={32} style={{ marginBottom: 32 }}>
        <Col xs={24} md={16}>
          <Card
            title={
              <span>
                <ClockCircleOutlined /> Ca thi sắp diễn ra
              </span>
            }
            bordered={false}
          >
            <List
              itemLayout="horizontal"
              dataSource={upcomingExams}
              locale={{ emptyText: 'Không có ca thi nào sắp diễn ra.' }}
              renderItem={(item) => (
                <List.Item
                  actions={[<Tag color="blue">Sắp diễn ra</Tag>]}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const user = JSON.parse(localStorage.getItem('user') || 'null');
                    if (!user || !user.id) {
                      message.info('Vui lòng đăng nhập để xem chi tiết ca thi.');
                      navigate('/dang-nhap');
                    } else {
                      navigate(`/qlcathi`);
                    }
                  }}
                >
                  <List.Item.Meta
                    title={<b>{item.session_name}</b>}
                    description={
                      <>
                        <Space>
                          <ClockCircleOutlined /> {dayjs(item.start_time).format('YYYY-MM-DD HH:mm')}
                          <FieldNumberOutlined /> {item.duration} phút
                        </Space>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={
              <span>
                <TrophyOutlined /> Thành tích của bạn
              </span>
            }
            bordered={false}
          >
            <Statistic title="Số lần thi" value={stats?.totalExams || 0} prefix={<CalculatorOutlined />} />
            <Statistic title="Điểm cao nhất" value={stats?.bestScore || 0} suffix="/ 10" style={{ marginTop: 16 }} />
            <Statistic title="Điểm trung bình" value={stats?.avgScore || 0} suffix="/ 10" style={{ marginTop: 16 }} />
            <Statistic title="Tổng số câu đã làm" value={stats?.totalQuestions || 0} style={{ marginTop: 16 }} />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 48, padding: '32px 0 0 0', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          <b>Liên hệ:</b> mathquiz@school.edu.vn &nbsp;|&nbsp; <b>Hotline:</b> 0123 456 789
        </div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          <i>"Chinh phục Toán học - Mở rộng tương lai!"</i>
        </div>
        <div style={{ fontSize: 14 }}>&copy; {new Date().getFullYear()} MathQuiz. Một sản phẩm hỗ trợ học sinh Việt Nam yêu Toán.</div>
      </div>
    </div>
  );
};

export default Home;

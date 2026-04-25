import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Tag, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  FieldNumberOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TeamOutlined,
  SolutionOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ScorePieChart from '../components/ScorePieChart';
import apiService from '../services/api';
import dayjs from 'dayjs';

import RequireLoginModal from '../components/RequireLoginModal';

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
  const [ongoingExams, setOngoingExams] = useState([]);
  const [scoreChartData, setScoreChartData] = useState([]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  // Có thể fetch từ API thật nếu muốn
  useEffect(() => {
    // Gọi API lấy ca thi đang diễn ra
    apiService
      .getOngoingExamSessions()
      .then((res) => {
        setOngoingExams(res.data || []);
      })
      .catch(() => setOngoingExams([]));

    // Gọi API lấy ca thi sẵn sàng (sắp diễn ra)
    apiService
      .getReadyExamSessions()
      .then((res) => {
        // Sắp xếp tăng dần theo thời gian bắt đầu, lấy 5 ca gần nhất
        const upcoming = (res.data || []).sort((a, b) => dayjs(a.start_time) - dayjs(b.start_time));
        setUpcomingExams(upcoming.slice(0, 5));
      })
      .catch(() => setUpcomingExams([]));

    // Lấy user từ localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || !user.id) {
      setScoreChartData([]);
    } else {
      // Lấy bảng điểm cá nhân
      apiService.getExamResultsByStudent(user.id).then((res) => {
        const results = res.data || [];
        // Gom nhóm điểm thành các khoảng: 0-2, 2-4, 4-6, 6-8, 8-10
        const ranges = [
          { range: '0-2', min: 0, max: 2 },
          { range: '2-4', min: 2, max: 4 },
          { range: '4-6', min: 4, max: 6 },
          { range: '6-8', min: 6, max: 8 },
          { range: '8-10', min: 8, max: 10.0001 },
        ];
        const chartData = ranges.map((r) => ({
          range: r.range,
          count: results.filter((rs) => rs.score >= r.min && rs.score < r.max).length,
        }));
        setScoreChartData(chartData);
      }).catch(() => setScoreChartData([]));
    }
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

      {/* Ca thi đang diễn ra & Thành tích */}
      <Row gutter={32} style={{ marginBottom: 32 }}>
        <Col xs={24} md={16}>
          <Card
            title={
              <span>
                <ClockCircleOutlined /> Ca thi đang diễn ra
              </span>
            }
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            {/* ca thi đang diễn ra */}
            <List
              itemLayout="horizontal"
              dataSource={ongoingExams}
              locale={{ emptyText: 'Không có ca thi nào đang diễn ra.' }}
              renderItem={(item) => (
                <List.Item
                  actions={[<Tag color="green">Đang diễn ra</Tag>]}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const user = JSON.parse(localStorage.getItem('user') || 'null');
                    if (!user || !user.id) {
                      setLoginModalOpen(true);
                    } else {
                      navigate(`/qlcathi`);
                    }
                  }}
                >
                  <List.Item.Meta
                    title={<b>{item.session_name}</b>}
                    description={
                      <Space>
                        <ClockCircleOutlined /> {dayjs(item.start_time).format('YYYY-MM-DD HH:mm')}
                        <FieldNumberOutlined /> {item.duration} phút
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
          {/* Ca thi sắp diễn ra */}
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
                      setLoginModalOpen(true);
                    } else {
                      navigate(`/qlcathi`);
                    }
                  }}
                >
                  <List.Item.Meta
                    title={<b>{item.session_name}</b>}
                    description={
                      <Space>
                        <ClockCircleOutlined /> {dayjs(item.start_time).format('YYYY-MM-DD HH:mm')}
                        <FieldNumberOutlined /> {item.duration} phút
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={<span><BarChartOutlined /> Biểu đồ tỷ lệ điểm thi</span>}
            bordered={false}
            style={{ minHeight: 340 }}
          >
            {scoreChartData.length > 0 ? (
              <ScorePieChart data={scoreChartData} />
            ) : (
              <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
                Hãy đăng nhập và làm bài để xem biểu đồ tỷ lệ điểm thi của bạn!
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Card chức năng - mỗi dòng 1 chức năng, mô tả rõ ràng */}
      <Row gutter={0} style={{ margin: '32px 0 0 0', flexDirection: 'column' }}>
        <Col xs={24} style={{ marginBottom: 24 }}>
          <Card
            hoverable
            style={{ minHeight: 100, display: 'flex', alignItems: 'center' }}
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (!user || !user.id) {
                setLoginModalOpen(true);
              } else {
                navigate('/qlcauhoi');
              }
            }}
          >
            <BookOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>Ngân hàng câu hỏi</div>
              <div style={{ color: '#888' }}>Quản lý, thêm mới và chỉnh sửa các câu hỏi trắc nghiệm dùng cho các đề thi.</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} style={{ marginBottom: 24 }}>
          <Card
            hoverable
            style={{ minHeight: 100, display: 'flex', alignItems: 'center' }}
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (!user || !user.id) {
                setLoginModalOpen(true);
              } else {
                navigate('/qlhocsinh');
              }
            }}
          >
            <TeamOutlined style={{ fontSize: 32, color: '#52c41a', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>Quản lý học sinh</div>
              <div style={{ color: '#888' }}>Thêm mới, chỉnh sửa và quản lý thông tin học sinh tham gia các kỳ thi.</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} style={{ marginBottom: 24 }}>
          <Card
            hoverable
            style={{ minHeight: 100, display: 'flex', alignItems: 'center' }}
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (!user || !user.id) {
                setLoginModalOpen(true);
              } else {
                navigate('/qldethi');
              }
            }}
          >
            <SolutionOutlined style={{ fontSize: 32, color: '#faad14', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>Quản lý đề thi</div>
              <div style={{ color: '#888' }}>Tạo mới, chỉnh sửa cấu trúc và quản lý các đề thi trắc nghiệm cho từng ca thi.</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} style={{ marginBottom: 24 }}>
          <Card
            hoverable
            style={{ minHeight: 100, display: 'flex', alignItems: 'center' }}
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (!user || !user.id) {
                setLoginModalOpen(true);
              } else {
                navigate('/qlketquathi');
              }
            }}
          >
            <BarChartOutlined style={{ fontSize: 32, color: '#eb2f96', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>Quản lý kết quả thi</div>
              <div style={{ color: '#888' }}>Xem, thống kê, xuất báo cáo kết quả thi của học sinh theo từng ca thi, đề thi.</div>
            </div>
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 48, padding: '32px 0 0 0', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          <b>Liên hệ:</b> nguyenphi24032003@gmail.com &nbsp;|&nbsp; <b>Hotline:</b> 0357212084
        </div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          <i>"Chinh phục Toán học - Mở rộng tương lai!"</i>
        </div>
        <div style={{ fontSize: 14 }}>&copy; {new Date().getFullYear()} NHPhi. Một sản phẩm hỗ trợ học sinh Việt Nam yêu Toán.</div>
      </div>
      <RequireLoginModal visible={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};

export default Home;

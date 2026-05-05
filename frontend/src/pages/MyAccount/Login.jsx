import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Login = ({ setIsLoggedIn, setUser }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.login({
        username: values.username,
        password: values.password,
      });
      // Nếu đăng nhập thành công, BE trả về { user, token }
      if (response && response.data && response.data.user && response.data.token) {
        const { user, token } = response.data;
        setUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify({ ...user, token }));
        message.success('Đăng nhập thành công!');
        navigate('/'); // Về trang chủ
      } else {
        message.error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        message.error('Tên đăng nhập hoặc mật khẩu không đúng');
      } else {
        message.error('Đã xảy ra lỗi khi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-form">
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Đăng nhập</h2>
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Đăng nhập
              </Button>
              <Button onClick={() => navigate(-1)} block>
                Quay lại
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Nếu là request đăng nhập thì không redirect để component xử lý và hiển thị thông báo
      if (!requestUrl.includes('/users/login')) {
        localStorage.removeItem('user');
        window.location.href = '/dang-nhap';
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;

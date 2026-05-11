import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from 'antd';

// Import các page cần thiết
import SystemLogs from './pages/QuanTriHeThong/XemLichSuHeThong/SystemLogs.jsx';
import NoAccess from './pages/NoAccess.jsx';
import QuestionBank from './pages/QLNganHangCauHoi/QuestionBank.jsx';
import QLCaThi from './pages/QLCaThi/index.jsx';
import AdminUsers from './pages/QuanTriHeThong/QuanLyNguoiDung/AdminUsers.jsx';
import Login from './pages/MyAccount/Login.jsx';
import Home from './pages/Home.jsx';
import QLDangKyCaThi from './pages/QLCaThi/QLDangKyCaThi/index.jsx';
import QLDeThi from './pages/QLDeThi/index.jsx';
import CauTruDeThi from './pages/QLDeThi/CauTrucDeThi/index.jsx';
import LamBaiThi from './pages/LamBaiThi/index.jsx';
import ThucHienBaiThi from './pages/LamBaiThi/ThucHienBaiThi.jsx';
import KetQuaThi from './pages/KetQuaThi/index.jsx';
import XemKetQuaThi from './pages/KetQuaThi/XemKetQuaThi.jsx';
import EditExamPage from './pages/QLDeThi/EditExamPage.jsx';
// Components
import Sidebar from './components/Sidebar.jsx';
import { useMatch } from 'react-router-dom';
import Header from './components/Header.jsx';
import '../src/AppHeader.css';

// Pages
const { Content } = Layout;

const AppLayout = ({ user, isLoggedIn, setUser, setIsLoggedIn }) => {
  // Đọc trạng thái sidebar từ localStorage để giữ khi F5
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });
  // Đồng bộ khi thay đổi
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);
  const handleToggleSidebar = () => setSidebarCollapsed((c) => !c);
  // Ẩn sidebar khi đang làm bài thi
  const matchDoingExam = useMatch('/lam-bai-thi/:sessionId');
  return (
    <div>
      <Header user={user} onToggleSidebar={handleToggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      {!matchDoingExam && <Sidebar user={user} collapsed={sidebarCollapsed} />}
      <div
        className="body-with-header"
        style={{
          marginLeft: !matchDoingExam && !sidebarCollapsed ? 260 : 0,
          background: '#f0f2f5',
          minHeight: '100vh',
          transition: 'margin-left 0.2s',
        }}
      >
        <div style={{ padding: 24, background: '#fff', minHeight: '100vh' }}>
          <Routes>
            <Route path="/">
              <Route element={<Home />} path="" />
            </Route>
            <Route path="/dang-nhap" element={<Login setUser={setUser} setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/qlcathi" element={<QLCaThi user={user} isLoggedIn={isLoggedIn} />} />
            <Route path="/qlcathi">
              <Route path="qldangkycathi/:id" element={<QLDangKyCaThi user={user} isLoggedIn={isLoggedIn} />} />
            </Route>
            <Route path="/lam-bai-thi">
              <Route path="" element={<LamBaiThi user={user} isLoggedIn={isLoggedIn} setSidebarCollapsed={setSidebarCollapsed} />} />
              <Route path=":sessionId" element={<ThucHienBaiThi user={user} isLoggedIn={isLoggedIn} setSidebarCollapsed={setSidebarCollapsed} />} />
            </Route>
            <Route path="/qldethi">
              <Route path="" element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <QLDeThi /> : <NoAccess />} />
              <Route
                path="cautrucdethi"
                element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <CauTruDeThi /> : <NoAccess />}
              />
              <Route
                path="chinh-sua/:id"
                element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <EditExamPage /> : <NoAccess />}
              />
            </Route>
            <Route path="/system-logs" element={isLoggedIn && user?.role === 'ADMIN' ? <SystemLogs /> : <NoAccess />} />
            <Route path="/qlcauhoi" element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <QuestionBank /> : <NoAccess />} />
            <Route path="/qlketquathi" element={isLoggedIn ? <KetQuaThi /> : <NoAccess />} />
            <Route path="/qlketquathi/:resultId" element={isLoggedIn ? <XemKetQuaThi /> : <NoAccess />} />
            <Route path="/qlnguoidung" element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <AdminUsers /> : <NoAccess />} />
            <Route path="/qlhocsinh" element={isLoggedIn && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? <AdminUsers /> : <NoAccess />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AppRouter = ({ user, setIsLoggedIn, setUser, isLoggedIn }) => {
  return (
    <Router>
      <Routes>
        <Route path="/dang-nhap" element={<Login setUser={setUser} setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="*" element={<AppLayout user={user} isLoggedIn={isLoggedIn} setUser={setUser} setIsLoggedIn={setIsLoggedIn} />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;

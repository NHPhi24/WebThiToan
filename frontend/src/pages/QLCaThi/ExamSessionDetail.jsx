import React from 'react';
import { Tag, Button, Select } from 'antd';
import participantApi from '../../services/participantApi';
import { useNavigate } from 'react-router-dom';
import useTeacherFullName from '../../hooks/useTeacherFullName';
import { EXAM_SESSION_STATUS } from '../../constants/constant';
const statusColors = {
  READY: 'blue',
  ONGOING: 'green',
  FINISHED: 'red',
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};


const ExamSessionDetail = ({ data, onViewResult, canEdit, onStatusChange, registeredSessionId }) => {
  const navigate = useNavigate();
  const { fullName: teacherName } = useTeacherFullName(data?.teacher_id);
  const currentUser = getCurrentUser();
  if (!data) return null;

  const handleGoToRegisterList = () => {
    navigate(`/qlcathi/qldangkycathi/${data.id}`);
  };

  // Chỉ enable nút đăng ký ca thi nếu:
  // - Học sinh chưa đăng ký ca thi READY nào (registeredSessionId == null)
  // - Hoặc ca thi đang xem là ca thi đã đăng ký (registeredSessionId == data.id)
  // Ngược lại thì disable
  const disableRegister = !!registeredSessionId && registeredSessionId !== data.id;

  return (
    <div>
      <p>
        <b>Tên ca thi:</b> {data.session_name}
      </p>
      <p>
        <b>Thời gian bắt đầu:</b> {new Date(data.start_time).toLocaleString()}
      </p>
      <p>
        <b>Thời lượng:</b> {data.duration} phút
      </p>
      <p>
        <b>Trạng thái:</b>
        <Tag color={statusColors[data.status]}>{EXAM_SESSION_STATUS.find((s) => s.value === data.status)?.label || data.status}</Tag>
      </p>
      <p>
        <b>Giáo viên tạo:</b> {teacherName}
      </p>
      {data.status === 'READY' && (
        <Button type="primary" onClick={handleGoToRegisterList} style={{ marginTop: 16 }} disabled={disableRegister}>
          Đăng ký ca thi
        </Button>
      )}
      {data.status === 'FINISHED' && (
        <Button type="default" style={{ marginTop: 16, marginLeft: 8 }} onClick={() => navigate(`/qlketquathi`)}>
          Xem kết quả thi
        </Button>
      )}
      {data.status === 'ONGOING' && currentUser?.role === 'TEACHER' && (
        <Button type="default" style={{ marginTop: 16, marginLeft: 8 }} onClick={handleGoToRegisterList}>
          Xem danh sách thí sinh đang thi
        </Button>
      )}
      {data.status === 'ONGOING' && currentUser?.role !== 'TEACHER' && (
        <Button type="primary" style={{ marginTop: 16, marginLeft: 8 }} onClick={() => navigate(`/lam-bai-thi/${data.id}`)}>
          Đến làm bài thi
        </Button>
      )}
    </div>
  );
};

export default ExamSessionDetail;

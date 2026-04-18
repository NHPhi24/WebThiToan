import React from 'react';
import { Tag, Button, message } from 'antd';
import participantApi from '../../services/participantApi';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  READY: 'blue',
  ONGOING: 'green',
  FINISHED: 'red',
};

const ExamSessionDetail = ({ data, onViewResult, canEdit, onStatusChange }) => {
  const navigate = useNavigate();
  if (!data) return null;

  const handleGoToRegisterList = () => {
    navigate(`/qlcathi/qldangkycathi/${data.id}`);
  };

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
        <b>Trạng thái:</b> <Tag color={statusColors[data.status]}>{data.status}</Tag>
        {canEdit && (
          <div style={{ marginTop: 8 }}>
            <Select value={data.status} style={{ minWidth: 120 }} onChange={onStatusChange} options={EXAM_SESSION_STATUS} optionLabelProp="label">
              {EXAM_SESSION_STATUS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </p>
      <p>
        <b>Giáo viên tạo:</b> {data.teacher_id}
      </p>
      {data.status === 'READY' && (
        <Button type="primary" onClick={handleGoToRegisterList} style={{ marginTop: 16 }}>
          Đăng ký thi
        </Button>
      )}
      {data.status === 'FINISHED' && (
        <Button type="default" style={{ marginTop: 16, marginLeft: 8 }} onClick={onViewResult}>
          Xem kết quả thi
        </Button>
      )}
    </div>
  );
};

export default ExamSessionDetail;

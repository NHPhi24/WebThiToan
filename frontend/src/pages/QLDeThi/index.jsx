import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, message, Tooltip, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import OperationColumn from '../../components/ActionIcons';

// Modal chỉnh sửa cấu trúc đề thi
const ExamStructureModal = ({ visible, onClose, exam }) => {
  // Placeholder: Hiển thị thông tin cấu trúc đề thi
  return (
    <Modal open={visible} onCancel={onClose} onOk={onClose} title="Chỉnh sửa cấu trúc đề thi">
      <div>
        <p>Chức năng chỉnh sửa cấu trúc đề thi sẽ được phát triển ở đây.</p>
        <pre>{JSON.stringify(exam, null, 2)}</pre>
      </div>
    </Modal>
  );
};

const QLDeThi = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.getAllExams();
      setExams(res.data);
    } catch {
      message.error('Không thể tải danh sách đề thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleEditStructure = (exam) => {
    setSelectedExam(exam);
    setShowStructure(true);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên đề thi', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Thời gian (phút)', dataIndex: 'duration', key: 'duration', width: 120 },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_, record) => <OperationColumn handleEdit={() => handleEditStructure(record)} canEdit={true} />,
    },
  ];

  return (
    <div>
      <h1>Quản lý đề thi</h1>
      <Table columns={columns} dataSource={exams} rowKey="id" loading={loading} bordered scroll={{ x: 'max-content' }} />
      <ExamStructureModal visible={showStructure} onClose={() => setShowStructure(false)} exam={selectedExam} onSuccess={fetchExams} />
    </div>
  );
};

export default QLDeThi;

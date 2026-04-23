import React, { useEffect, useState } from 'react';
import { Table, Button, message, Modal } from 'antd';
import api from '../../../services/api';
import OperationColumn from '../../../components/ActionIcons';
import CauTrucDeThiModal from './CauTrucDeThiModal';
import CauTrucDeThiDetailModal from './CauTrucDeThiDetailModal';
import { useNavigate } from 'react-router-dom';
const CauTruDeThi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const handleView = (record) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
  };
  const navigate = useNavigate();
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getAllExamTemplates();
      setData(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách cấu trúc đề thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record) => {
    setEditRecord(record);
    setEditModalOpen(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa cấu trúc "${record.template_name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.deleteExamTemplate(record.id);
          message.success('Xóa cấu trúc thành công');
          fetchData();
        } catch (err) {
          const detail = err?.response?.data?.error || err?.message || 'Xóa cấu trúc thất bại';
          message.error('Xóa cấu trúc thất bại: ' + detail);
        }
      },
    });
  };

  const columns = [
    { title: 'Tên cấu trúc', dataIndex: 'template_name', key: 'template_name' },
    { title: 'Tổng số câu', dataIndex: 'total_questions', key: 'total_questions' },
    { title: '% Cơ bản', dataIndex: 'basic_percent', key: 'basic_percent' },
    { title: '% Nâng cao', dataIndex: 'advanced_percent', key: 'advanced_percent' },
    {
      title: 'Giáo viên tạo',
      dataIndex: 'teacher_id',
      key: 'teacher_id',
      render: (_, record) => (record.teacher_full_name ? `${record.teacher_full_name}` : record.teacher_id),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <OperationColumn handleView={() => handleView(record)} handleEdit={() => handleEdit(record)} handleDelete={() => handleDelete(record)} />
      ),
    },
  ];

  return (
    <div>
      <h1>Danh sách cấu trúc đề thi</h1>
      <Button style={{ marginRight: 12 }} onClick={() => navigate(-1)}>
        Quay lại
      </Button>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setAddModalOpen(true)}>
        Thêm cấu trúc
      </Button>
      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      <CauTrucDeThiModal
        open={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setEditRecord(null);
        }}
        onSuccess={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setEditRecord(null);
          fetchData();
        }}
        editRecord={editModalOpen ? editRecord : null}
      />
      <CauTrucDeThiDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailRecord(null);
        }}
        record={detailRecord}
      />
    </div>
  );
};

export default CauTruDeThi;

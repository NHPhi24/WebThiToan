import React, { useEffect, useState } from 'react';
import { Table, message, Modal, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import OperationColumn from '../../components/ActionIcons';
import AddDeThi from './AddDeThi';
import api from '../../services/api';
import MathText from '../../utils/MathText';
import { render } from 'katex';

const QLDeThi = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
  const [questionList, setQuestionList] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalLoading, setAddModalLoading] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getAllExams();
      setData(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách đề thi');
    } finally {
      setLoading(false);
    }
  };
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    fetchData();
    api.getAllUsers().then((res) => setUsers(res.data || []));
    api.getAllExamTemplates().then((res) => setTemplates(res.data || []));
  }, []);

  useEffect(() => {
    fetchData();
    api.getAllUsers().then((res) => setUsers(res.data || []));
  }, []);

  // Xem chi tiết đề thi
  const handleView = async (record) => {
    setModalData(record);
    setModalMode('view');
    setModalOpen(true);
    setQuestionList([]);
    setQuestionLoading(true);
    try {
      const res = await api.getQuestionsByExamId(record.id);
      setQuestionList(res.data);
    } catch (err) {
      setQuestionList([]);
      message.error('Không thể tải danh sách câu hỏi');
    } finally {
      setQuestionLoading(false);
    }
  };

  // Sửa đề thi
  const handleEdit = (record) => {
    // console.log(record.id);
    window.location.href = `/qldethi/chinh-sua/${record.id}`;
  };

  // Thêm mới đề thi (placeholder)
  const handleAddNew = () => {
    setAddModalOpen(true);
  };

  // Xóa đề thi
  const handleDelete = async (record) => {
    try {
      await api.deleteExam(record.id);
      message.success('Xóa đề thi thành công');
      fetchData();
    } catch (err) {
      message.error('Xóa đề thi thất bại');
    }
  };

  const columns = [
    { title: 'Mã đề thi', dataIndex: 'exam_code', key: 'exam_code' },
    {
      title: 'Cấu trúc đề thi',
      dataIndex: 'template_id',
      key: 'template_id',
      render: (template_id) => {
        const template = templates.find((t) => t.id === template_id);
        return <span>{template ? template.template_name : template_id || '-'}</span>;
      },
    },
    {
      title: 'Giáo viên tạo',
      dataIndex: 'teacher_id',
      key: 'teacher_id',
      render: (teacher_id) => {
        const user = users.find((u) => u.id === teacher_id);
        return <span>{user ? user.full_name : teacher_id}</span>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => (text ? new Date(text).toLocaleString('vi-VN', { hour12: false }) : ''),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <OperationColumn handleView={() => handleView(record)} handleEdit={() => handleEdit(record)} handleDelete={() => handleDelete(record)} />
      ),
    },
  ];

  return (
    <div>
      <h1>Quản lý đề thi</h1>
      <Button type="primary" onClick={handleAddNew} style={{ marginBottom: 16 }} icon={<PlusOutlined />}>
        Thêm đề thi
      </Button>

      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={modalMode === 'edit' ? 'Sửa đề thi' : 'Chi tiết đề thi'}
        onOk={() => setModalOpen(false)}
        okText="Đóng"
        cancelText="Hủy"
        footer={null}
      >
        {modalMode === 'view' && modalData && (
          <div>
            <p>
              <b>Mã đề thi:</b> {modalData.exam_code}
            </p>
            <p>
              <b>Template ID:</b> {modalData.template_id}
            </p>
            <p>
              <b>Giáo viên tạo:</b>{' '}
              {(() => {
                const user = users.find((u) => u.id === modalData.teacher_id);
                return user ? user.full_name : modalData.teacher_id;
              })()}
            </p>
            <p>
              <b>Ngày tạo:</b> {modalData.created_at ? new Date(modalData.created_at).toLocaleString('vi-VN', { hour12: false }) : ''}
            </p>
            <div style={{ marginTop: 16 }}>
              <b>Danh sách câu hỏi ({questionList.length}):</b>
              {questionLoading ? (
                <div>Đang tải câu hỏi...</div>
              ) : questionList.length === 0 ? (
                <div>Không có câu hỏi nào.</div>
              ) : (
                <ol style={{ paddingLeft: 20 }}>
                  {questionList.map((q, idx) => (
                    <li key={q.id} style={{ marginBottom: 8 }}>
                      <div>
                        <b>Câu {idx + 1}:</b> <MathText>{q.content}</MathText>
                      </div>
                      <div style={{ marginLeft: 12 }}>
                        <div>
                          A. <MathText>{q.ans_a}</MathText>
                        </div>
                        <div>
                          B. <MathText>{q.ans_b}</MathText>
                        </div>
                        <div>
                          C. <MathText>{q.ans_c}</MathText>
                        </div>
                        <div>
                          D. <MathText>{q.ans_d}</MathText>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
        {modalMode === 'edit' && modalData && (
          <div>
            <p>Chức năng sửa đề thi sẽ được phát triển ở đây.</p>
          </div>
        )}
      </Modal>
      <Modal open={addModalOpen} onCancel={() => setAddModalOpen(false)} footer={null} title="Tạo đề thi tự động" confirmLoading={addModalLoading}>
        <AddDeThi
          loading={addModalLoading}
          onSubmit={({ exam_code, template_id, teacher_id }) => {
            setAddModalLoading(true);
            api
              .autoGenerateExam({ exam_code, template_id, teacher_id })
              .then((res) => {
                const code = res.data?.exam_code;
                message.success(code ? `Tạo đề thi thành công. Mã đề: ${code}` : 'Tạo đề thi tự động thành công');
                setAddModalOpen(false);
                fetchData();
              })
              .catch(() => message.error('Tạo đề thi tự động thất bại'))
              .finally(() => setAddModalLoading(false));
          }}
          onOpenStructure={() => setStructureModalOpen(true)}
          autoMode
        />
      </Modal>
    </div>
  );
};

export default QLDeThi;

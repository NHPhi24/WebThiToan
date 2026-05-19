import Filter from '../../components/Filter';
import React, { useEffect, useState } from 'react';
import { Table, message, Modal, Button } from 'antd';
import SearchInput from '../../components/SearchInput';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({ grade: 'ALL' });

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
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUser();
  // Hàm so sánh id an toàn cho mọi kiểu dữ liệu
  const isSameId = (a, b) => String(a) === String(b);
  const canEditExam = (record) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return isSameId(record.teacher_id, currentUser.id);
  };
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    fetchData();
    api.getAllUsers().then((res) => setUsers(res.data || []));
    api.getAllExamTemplates().then((res) => setTemplates(res.data || []));
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

  // Lọc dữ liệu theo mã đề, tên template và theo lớp
  const filteredData = data.filter((row) => {
    const q = search.toLowerCase();
    const template = templates.find((t) => t.id === row.template_id);
    let match = row.exam_code?.toLowerCase().includes(q) || (template?.template_name?.toLowerCase().includes(q) ?? false);
    if (filterValues.grade && filterValues.grade !== 'ALL') {
      match = match && String(row.grade) === String(filterValues.grade);
    }
    return match;
  });

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
    { title: 'Khối/Lớp', dataIndex: 'grade', key: 'grade', render: (grade) => <span>{grade ? `Lớp ${grade}` : '-'}</span> },
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
        <OperationColumn
          handleView={() => handleView(record)}
          handleEdit={canEditExam(record) ? () => handleEdit(record) : undefined}
          handleDelete={canEditExam(record) ? () => handleDelete(record) : undefined}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1>Quản lý đề thi</h1>
        <ReloadOutlined onClick={fetchData} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddNew} icon={<PlusOutlined />}>
          Thêm đề thi
        </Button>
        <Filter filterKeys={['grade']} onChange={(vals) => setFilterValues((prev) => ({ ...prev, ...vals }))} />
        <SearchInput
          placeholder="Tìm kiếm mã đề hoặc tên cấu trúc..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          showTotal: (total, range) => `${range[0]}-${range[1]}: ${total}`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />
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
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <p>
              <b>Mã đề thi:</b> {modalData.exam_code}
            </p>
            <p>
              <b>Lớp:</b> {modalData.grade ? `Lớp ${modalData.grade}` : '-'}
            </p>
            <p>
              <b>Cấu trúc đề thi:</b> {modalData.template_id}
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
          onSubmit={({ exam_code, template_id, teacher_id, grade }) => {
            setAddModalLoading(true);
            api
              .autoGenerateExam({ exam_code, template_id, teacher_id, grade })
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

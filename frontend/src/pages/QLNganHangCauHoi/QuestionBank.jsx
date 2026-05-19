import Filter from '../../components/Filter';
import React, { useEffect, useState } from 'react';
import useModal from '../../hooks/useModal';
import { Table, Button, Tooltip, Space, Modal, message } from 'antd';
import SearchInput from '../../components/SearchInput';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import OperationColumn from '../../components/ActionIcons';
import apiService from '../../services/api';
import AddQuestionModal from './AddQuestionModal';
import ImportQuestionModal from './ImportQuestionModal';
import 'katex/dist/katex.min.css';
import MathText from '../../utils/MathText';
import { Search } from 'lucide-react';
import { render } from 'katex';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showView, setShowView] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({ grade: 'ALL' });

  // Hook modal import
  const importModal = useModal();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllQuestions();
      setQuestions(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };
  // Lấy user hiện tại từ localStorage
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const canEditQuestion = (record) => {
    if (!currentUser) return false;
    // Chỉ cho phép user là người tạo ra câu hỏi mới được sửa/xóa
    return String(record.teacher_id) === String(currentUser.id);
  };
  // console.log('canedit', currentUser);

  useEffect(() => {
    fetchQuestions();
    // Lấy danh sách user để map id sang tên
    apiService
      .getAllUsers()
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xoá',
      content: 'Bạn có chắc chắn muốn xoá câu hỏi này?',
      okText: 'Xoá',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await apiService.deleteQuestion(id);
          message.success('Đã xoá câu hỏi');
          fetchQuestions();
        } catch {
          message.error('Xoá thất bại');
        }
      },
    });
  };

  const handleEdit = async (id) => {
    setEditId(id);
    setShowEdit(true);
    try {
      const res = await apiService.getQuestionById(id);
      setEditData(res.data);
    } catch {
      message.error('Không lấy được dữ liệu câu hỏi');
      setShowEdit(false);
    }
  };
  const handleView = async (id) => {
    try {
      const res = await apiService.getQuestionById(id);
      setViewData(res.data);
      setShowView(true);
    } catch {
      message.error('Không lấy được dữ liệu câu hỏi');
    }
  };

  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: 60,
    // },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'A',
      dataIndex: 'ans_a',
      key: 'ans_a',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'B',
      dataIndex: 'ans_b',
      key: 'ans_b',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'C',
      dataIndex: 'ans_c',
      key: 'ans_c',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'D',
      dataIndex: 'ans_d',
      key: 'ans_d',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'Đáp án đúng',
      dataIndex: 'correct_ans',
      key: 'correct_ans',
      width: 200,
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'Giải thích',
      dataIndex: 'explanation',
      key: 'explanation',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'Khối/Lớp',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      render: (grade) => <span>{grade ? `Lớp ${grade}` : 'N/A'}</span>,
    },
    {
      title: 'Độ khó',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level) => <span>{String(level) === '1' ? 'Nâng cao' : 'Cơ bản'}</span>,
    },
    {
      title: 'Người tạo',
      dataIndex: 'teacher_id',
      key: 'teacher_id',
      width: 120,
      render: (teacher_id) => {
        const user = users.find((u) => u.id === teacher_id);
        return <span>{user ? user.full_name : teacher_id}</span>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('vi-VN', { hour12: false }),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <OperationColumn
          handleView={() => handleView(record.id)}
          handleEdit={canEditQuestion(record) ? () => handleEdit(record.id) : undefined}
          handleDelete={canEditQuestion(record) ? () => handleDelete(record.id) : undefined}
        />
      ),
    },
  ];

  // Lọc dữ liệu theo nội dung câu hỏi và theo lớp
  const filteredQuestions = questions.filter((q) => {
    let match = q.content?.toLowerCase().includes(search.toLowerCase());
    if (filterValues.grade && filterValues.grade !== 'ALL') {
      match = match && String(q.grade) === String(filterValues.grade);
    }
    if (filterValues.level && filterValues.level !== 'ALL') {
      match = match && String(q.level) === String(filterValues.level);
    }
    return match;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <h1>Quản lý ngân hàng câu hỏi</h1>
        <ReloadOutlined onClick={fetchQuestions} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
          Thêm câu hỏi
        </Button>
        <Button type="default" onClick={importModal.open}>
          Import
        </Button>
        <Filter filterKeys={['grade', 'level']} onChange={(vals) => setFilterValues((prev) => ({ ...prev, ...vals }))} />
        <SearchInput
          placeholder="Tìm kiếm theo nội dung câu hỏi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      <ImportQuestionModal
        visible={importModal.visible}
        onClose={importModal.close}
        onImport={async (data, options = {}) => {
          // Nếu là dryRun, chỉ gửi lên BE để lấy mathStruct, không import thật
          if (options.dryRun) {
            try {
              const formData = new FormData();
              const blob = new Blob(
                [new Uint8Array(await (await fetch('data:application/json,' + encodeURIComponent(JSON.stringify(data)))).arrayBuffer())],
                { type: 'application/json' },
              );
              formData.append('file', blob, 'import.json');
              const res = await apiService.importQuestions(formData, true); // true = dryRun
              return res.data;
            } catch {
              return { mathStruct: [] };
            }
          }
          // Import thật
          const results = [];
          for (const q of data) {
            try {
              await apiService.createQuestion(q);
              results.push({ ...q, status: 'created' });
            } catch (err) {
              let errorMsg = err?.response?.data?.error || err?.message || 'Lỗi';
              results.push({ ...q, status: 'error', error: errorMsg });
            }
          }
          message.success(
            `Import thành công: ${results.filter((r) => r.status === 'created').length}, thất bại: ${results.filter((r) => r.status !== 'created').length}`,
          );
          fetchQuestions();
          return results;
        }}
      />
      {/* <Table columns={columns} dataSource={filteredQuestions} rowKey="id" loading={loading} bordered scroll={{ x: 'max-content' }} /> */}
      <Table
        columns={columns}
        dataSource={filteredQuestions}
        loading={loading}
        rowKey="id"
        pagination={{
          showTotal: (total, range) => `${range[0]}-${range[1]}: ${total}`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 'max-content' }}
      />
      <AddQuestionModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchQuestions} edit={false} />
      <AddQuestionModal
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditData(null);
          setEditId(null);
        }}
        onSuccess={() => {
          setShowEdit(false);
          setEditData(null);
          setEditId(null);
          fetchQuestions();
        }}
        edit={true}
        data={editData}
        editId={editId}
      />
      <AddQuestionModal
        open={showView}
        onClose={() => {
          setShowView(false);
          setViewData(null);
        }}
        edit={true}
        view={true}
        data={
          viewData
            ? {
                ...viewData,
                level: String(viewData.level), // Đảm bảo luôn là chuỗi
              }
            : viewData
        }
      />
    </div>
  );
};

export default QuestionBank;

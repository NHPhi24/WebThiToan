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
      title: 'Đúng',
      dataIndex: 'correct_ans',
      key: 'correct_ans',
      width: 60,
      render: (text) => <b style={{ color: '#1890ff' }}>{text}</b>,
    },
    {
      title: 'Giải thích',
      dataIndex: 'explanation',
      key: 'explanation',
      render: (text) => <MathText>{text}</MathText>,
    },
    {
      title: 'Độ khó',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level) => <span>{level === '0' ? 'Cơ bản' : 'Nâng cao'}</span>,
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
          handleEdit={() => handleEdit(record.id)}
          handleDelete={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  // Lọc dữ liệu theo nội dung câu hỏi
  const filteredQuestions = questions.filter((q) => q.content?.toLowerCase().includes(search.toLowerCase()));

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
        onImport={async (data) => {
          try {
            for (const q of data) {
              await apiService.createQuestion(q);
            }
            message.success('Import thành công!');
            fetchQuestions();
          } catch {
            message.error('Import thất bại!');
          }
        }}
      />
      <Table columns={columns} dataSource={filteredQuestions} rowKey="id" loading={loading} bordered scroll={{ x: 'max-content' }} />
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
        data={viewData}
      />
    </div>
  );
};

export default QuestionBank;

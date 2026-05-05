import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Button, Select } from 'antd';
import SearchInput from '../../components/SearchInput';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const KetQuaThi = () => {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  // Hàm fetch lại dữ liệu
  const fetchData = () => {
    setLoading(true);
    let u = null;
    try {
      u = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {}
    setUser(u);
    const role = u?.role?.toLowerCase();
    if (u && role === 'student') {
      Promise.all([api.getExamResultsByStudent(u.id), api.getAllExams(), api.getAllExamSessions(), api.getAllUsers()])
        .then(([resultsRes, examsRes, sessionsRes, usersRes]) => {
          const allResults = Array.isArray(resultsRes) ? resultsRes : resultsRes?.data || [];
          setData(allResults);
          setExams(examsRes.data || []);
          setSessions(sessionsRes.data || []);
          setUsers(usersRes.data || []);
        })
        .finally(() => setLoading(false));
    } else {
      Promise.all([api.getAllExamResults(), api.getAllExams(), api.getAllExamSessions(), api.getAllUsers()])
        .then(([resultsRes, examsRes, sessionsRes, usersRes]) => {
          const allResults = Array.isArray(resultsRes) ? resultsRes : resultsRes?.data || [];
          setData(allResults);
          setExams(examsRes.data || []);
          setSessions(sessionsRes.data || []);
          setUsers(usersRes.data || []);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Học sinh',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (student_id) => {
        const u = users.find((x) => x.id === student_id);
        return u ? u.full_name : student_id;
      },
    },
    {
      title: 'Mã đề',
      dataIndex: 'exam_id',
      key: 'exam_id',
      render: (exam_id) => {
        const exam = exams.find((e) => e.id === exam_id);
        return <span>{exam ? exam.exam_code : exam_id}</span>;
      },
    },
    {
      title: 'Ca thi',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (session_id) => {
        const session = sessions.find((s) => s.id === session_id);
        return <span>{session ? session.session_name : session_id}</span>;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (score != null ? score : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_submitted',
      key: 'is_submitted',
      render: (is_submitted) => (is_submitted ? <Tag color="green">Đã nộp</Tag> : <Tag color="red">Chưa nộp</Tag>),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (t) => (t ? new Date(t).toLocaleString() : '-'),
    },
    {
      title: 'Thời gian làm bài',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      render: (seconds) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
        const h = Math.floor(seconds / 3600)
          .toString()
          .padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60)
          .toString()
          .padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      },
    },
    {
      title: 'Xem chi tiết',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/qlketquathi/${record.id}`)}>
          Xem kết quả
        </Button>
      ),
    },
  ];

  // Lọc kết quả theo ca thi đã chọn (chỉ giáo viên/admin mới lọc)
  const sessionOptions = sessions.map((s) => ({ label: s.session_name, value: s.id }));
  let filteredResults = data;
  let selectedSessionObj = null;
  const role = user?.role?.toLowerCase();
  if (user && role !== 'student') {
    selectedSessionObj = sessions.find((s) => s.id === selectedSession);
    filteredResults = selectedSession ? data.filter((r) => r.session_id === selectedSession) : [];
  }
  // Lọc theo search
  if (search) {
    const q = search.toLowerCase();
    filteredResults = filteredResults.filter((r) => {
      const student = users.find((u) => u.id === r.student_id);
      const exam = exams.find((e) => e.id === r.exam_id);
      const session = sessions.find((s) => s.id === r.session_id);
      return (
        (student?.full_name?.toLowerCase().includes(q) ?? false) ||
        (exam?.exam_code?.toLowerCase().includes(q) ?? false) ||
        (session?.session_name?.toLowerCase().includes(q) ?? false)
      );
    });
  }

  // Hàm xuất file Excel
  const exportToExcel = () => {
    // Chỉ xuất các cột chính
    const exportData = filteredResults.map((r) => {
      const student = users.find((u) => u.id === r.student_id);
      const exam = exams.find((e) => e.id === r.exam_id);
      const session = sessions.find((s) => s.id === r.session_id);
      return {
        'Học sinh': student ? student.full_name : r.student_id,
        'Mã đề': exam ? exam.exam_code : r.exam_id,
        'Ca thi': session ? session.session_name : r.session_id,
        Điểm: r.score,
        'Trạng thái': r.is_submitted ? 'Đã nộp' : 'Chưa nộp',
        'Thời gian nộp': r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-',
        'Thời gian làm bài':
          typeof r.duration_seconds === 'number' && !isNaN(r.duration_seconds)
            ? `${String(Math.floor(r.duration_seconds / 3600)).padStart(2, '0')}:${String(Math.floor((r.duration_seconds % 3600) / 60)).padStart(2, '0')}:${String(r.duration_seconds % 60).padStart(2, '0')}`
            : '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DiemThi');
    XLSX.writeFile(wb, 'ket_qua_thi.xlsx');
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <h2>Kết quả thi</h2>
        <ReloadOutlined onClick={fetchData} title="Tải lại dữ liệu" />
      </div>

      {/* Nếu không phải học sinh thì mới cho chọn ca thi */}
      {role === 'teacher' || role === 'admin' ? (
        <div style={{ maxWidth: 400, marginBottom: 16 }}>
          <span>Chọn ca thi: </span>
          <Select
            style={{ minWidth: 200 }}
            options={sessionOptions}
            value={selectedSession}
            onChange={setSelectedSession}
            placeholder="Chọn ca thi để xem kết quả"
            allowClear
          />
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        <Button type="primary" onClick={exportToExcel}>
          Xuất file điểm
        </Button>
        <SearchInput
          placeholder="Tìm kiếm học sinh, mã đề, ca thi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </div>
      <Spin spinning={loading}>
        {role === 'teacher' || role === 'admin' ? (
          selectedSessionObj && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#1976d2' }}>{selectedSessionObj.session_name}</h3>
              </div>
              <Table
                columns={columns}
                dataSource={filteredResults}
                rowKey={(r) => r.id}
                pagination={filteredResults.length > 10 ? { pageSize: 10 } : false}
                locale={{ emptyText: 'Chưa có kết quả nào cho ca thi này.' }}
              />
            </div>
          )
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={filteredResults}
              rowKey={(r) => r.id}
              pagination={filteredResults.length > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: 'Bạn chưa có kết quả thi nào.' }}
            />
          </>
        )}
      </Spin>
    </div>
  );
};

export default KetQuaThi;

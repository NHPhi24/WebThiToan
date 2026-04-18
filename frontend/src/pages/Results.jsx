import React, { useState, useEffect } from 'react';
import { Table, Card, Statistic, Tag } from 'antd';
import axios from 'axios';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/exam-results');
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      // Mock data for demo
      setResults([
        {
          id: 1,
          student_id: 1,
          exam_id: 1,
          session_id: 1,
          score: 8.5,
          answers_log: { '1': 'C', '2': 'B' },
          is_submitted: true,
          submitted_at: '2024-01-01T10:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Bài thi',
      dataIndex: 'exam_id',
      key: 'exam_id',
      render: (exam_id) => `Bài thi ${exam_id}`,
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Tag color={score >= 8 ? 'green' : score >= 6 ? 'orange' : 'red'}>
          {score}/10
        </Tag>
      ),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_submitted',
      key: 'is_submitted',
      render: (submitted) => (
        <Tag color={submitted ? 'green' : 'orange'}>
          {submitted ? 'Đã nộp' : 'Chưa nộp'}
        </Tag>
      ),
    },
  ];

  const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
  const averageScore = results.length > 0 ? (totalScore / results.length).toFixed(1) : 0;

  return (
    <div>
      <h1>Kết quả thi</h1>

      <div style={{ marginBottom: 24 }}>
        <Card>
          <Statistic
            title="Điểm trung bình"
            value={averageScore}
            suffix="/10"
            valueStyle={{ color: averageScore >= 8 ? '#3f8600' : averageScore >= 6 ? '#faad14' : '#cf1322' }}
          />
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={results}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Results;
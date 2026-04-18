import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Table, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import stringSimilarity from 'string-similarity';
import useNotify from '../../hooks/useNotify';
import api from '../../services/api';
// Header tiếng Việt cho file mẫu (có ID giáo viên)
const headers = [
  'ID giáo viên', // teacher_id
  'Nội dung câu hỏi', // content
  'Đáp án A', // ans_a
  'Đáp án B', // ans_b
  'Đáp án C', // ans_c
  'Đáp án D', // ans_d
  'Đáp án đúng', // correct_ans
  'Giải thích', // explanation
  'Độ khó', // level
];

// Map trường tiếng Việt về trường DB (có ID giáo viên)
const fieldMap = {
  'ID giáo viên': 'teacher_id',
  'Nội dung câu hỏi': 'content',
  'Đáp án A': 'ans_a',
  'Đáp án B': 'ans_b',
  'Đáp án C': 'ans_c',
  'Đáp án D': 'ans_d',
  'Đáp án đúng': 'correct_ans',
  'Giải thích': 'explanation',
  'Độ khó': 'level',
};

const ImportQuestionModal = ({ visible, onClose, onImport }) => {
  const notify = useNotify();
  const [previewData, setPreviewData] = useState([]);
  const [validateErrors, setValidateErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);

  // Fetch all questions from DB when modal is opened
  useEffect(() => {
    if (visible) {
      api
        .getAllQuestions()
        .then((res) => setAllQuestions(res.data || res))
        .catch(() => setAllQuestions([]));
    }
  }, [visible]);
  const handleExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuestionsTemplate');
    XLSX.writeFile(wb, 'questions_template.xlsx');
  };

  // Hàm tự động format các trường LaTeX: chuyển \( ... \) thành $...$
  const autoFormatLatex = (str) => {
    if (!str || typeof str !== 'string') return str;
    let s = str.trim();
    // Chuyển tất cả \( ... \) thành $...$
    s = s.replace(/\\\((.*?)\\\)/g, (match, p1) => `$${p1.trim()}$`);
    // Nếu còn sót \( hoặc \) riêng lẻ thì xóa
    s = s.replace(/\\\(|\\\)/g, '');
    // Loại bỏ khoảng trắng thừa giữa các ký tự latex
    s = s.replace(/ +/g, ' ');
    return s;
  };

  // Chuẩn hóa nội dung giống BE (giữ khoảng trắng đơn)
  const normalizeContent = (content) => {
    return String(content)
      .replace(/20\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .trim();
  };

  // Validate dữ liệu: trả về mảng lỗi, mỗi lỗi là {row, message}
  const validateData = (data) => {
    const errors = [];
    data.forEach((row, idx) => {
      // Kiểm tra các trường string không được undefined/null/rỗng/chỉ chứa khoảng trắng
      if (
        row.content === undefined ||
        row.content === null ||
        String(row.content).trim() === '' ||
        row.ans_a === undefined ||
        row.ans_a === null ||
        String(row.ans_a).trim() === '' ||
        row.ans_b === undefined ||
        row.ans_b === null ||
        String(row.ans_b).trim() === '' ||
        row.ans_c === undefined ||
        row.ans_c === null ||
        String(row.ans_c).trim() === '' ||
        row.ans_d === undefined ||
        row.ans_d === null ||
        String(row.ans_d).trim() === '' ||
        row.correct_ans === undefined ||
        row.correct_ans === null ||
        String(row.correct_ans).trim() === '' ||
        row.level === undefined ||
        row.level === null ||
        row.level === ''
      ) {
        errors.push({ row: idx + 1, message: 'Thiếu trường bắt buộc' });
        return;
      }
      // Kiểm tra level phải là số
      if (isNaN(Number(row.level))) {
        errors.push({ row: idx + 1, message: 'Độ khó phải là số (0 hoặc 1)' });
      }
      // Kiểm tra tương đồng nội dung với DB (giống BE)
      if (allQuestions.length > 0) {
        const norm = normalizeContent(row.content);
        const found = allQuestions.find((q) => {
          const normQ = normalizeContent(q.content);
          if (norm === normQ) return true; // giống hệt
          const similarity = stringSimilarity.compareTwoStrings(norm, normQ);
          return similarity >= 0.8;
        });
        if (found) {
          errors.push({
            row: idx + 1,
            message: 'Câu hỏi này đã tồn tại hoặc tương đồng nội dung trong ngân hàng!',
          });
        }
      }
    });
    return errors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const mappedData = json.map((row) => {
        const mappedRow = {};
        Object.keys(fieldMap).forEach((vi) => {
          let val = row[vi];
          if (['Nội dung câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Giải thích'].includes(vi)) {
            val = autoFormatLatex(val);
          }
          mappedRow[fieldMap[vi]] = val;
        });
        mappedRow['teacher_id'] = user?.id || null;
        return mappedRow;
      });
      setPreviewData(mappedData);
      // Check duplicate with DB
      const errors = validateData(mappedData);
      setValidateErrors(errors);
      if (errors.length > 0) {
        // Nếu có lỗi trùng hoặc lỗi khác, báo lỗi ngay
        notify.error('Import thất bại: Dữ liệu có lỗi hoặc bị trùng với ngân hàng, vui lòng kiểm tra lại!');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    setImporting(true);
    if (validateErrors.length > 0) {
      notify.error('Import thất bại: Dữ liệu có lỗi, vui lòng kiểm tra lại!');
      setImporting(false);
      return;
    }
    try {
      if (onImport) onImport(previewData);
      setPreviewData([]);
      setValidateErrors([]);
      notify.success('Đã gửi dữ liệu import!');
      onClose();
    } catch (err) {
      notify.error('Import thất bại: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setImporting(false);
    }
  };

  // Cột cho bảng preview
  const columns = [
    { title: 'Nội dung', dataIndex: 'content', key: 'content' },
    { title: 'A', dataIndex: 'ans_a', key: 'ans_a' },
    { title: 'B', dataIndex: 'ans_b', key: 'ans_b' },
    { title: 'C', dataIndex: 'ans_c', key: 'ans_c' },
    { title: 'D', dataIndex: 'ans_d', key: 'ans_d' },
    { title: 'Đúng', dataIndex: 'correct_ans', key: 'correct_ans' },
    { title: 'Giải thích', dataIndex: 'explanation', key: 'explanation' },
    { title: 'Độ khó', dataIndex: 'level', key: 'level' },
  ];

  return (
    <Modal
      title="Import Ngân Hàng Câu Hỏi"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExportTemplate}>
          Tải file mẫu Excel
        </Button>,
        <Button
          key="refresh"
          onClick={() => {
            setPreviewData([]);
            setValidateErrors([]);
          }}
        >
          Làm Mới
        </Button>,
        <Button
          key="import"
          type="primary"
          disabled={previewData.length === 0 || validateErrors.length > 0}
          loading={importing}
          onClick={handleImport}
        >
          Import
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <p>Bạn có thể tải file mẫu Excel để nhập câu hỏi theo đúng cấu trúc.</p>
      <input type="file" accept=".xlsx, .xls" style={{ marginTop: 16, marginBottom: 16 }} onChange={handleFileChange} />
      {validateErrors.length > 0 && (
        <Alert
          type="error"
          message="Có lỗi trong dữ liệu, vui lòng kiểm tra lại!"
          description={
            <ul style={{ margin: 0 }}>
              {validateErrors.map((err, idx) => (
                <li key={idx}>
                  Dòng {err.row}: {err.message}
                </li>
              ))}
            </ul>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {previewData.length > 0 && (
        <Table
          dataSource={previewData.map((row, idx) => ({ ...row, key: idx }))}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default ImportQuestionModal;

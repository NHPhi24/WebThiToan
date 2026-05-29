import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Table, Alert, Input, Card } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import stringSimilarity from 'string-similarity';
import useNotify from '../../hooks/useNotify';
import api from '../../services/api';
import MathText from '../../utils/MathText';
// Header tiếng Việt cho file mẫu (có ID giáo viên)
const headers = [
  // 'ID giáo viên', // teacher_id
  'Nội dung câu hỏi', // content
  'Đáp án A', // ans_a
  'Đáp án B', // ans_b
  'Đáp án C', // ans_c
  'Đáp án D', // ans_d
  'Đáp án đúng', // correct_ans
  'Giải thích', // explanation
  'Độ khó', // level
  'Khối lớp', // grade
  'Dạng bài', // topic
];

// Map trường tiếng Việt về trường DB (có ID giáo viên)
const fieldMap = {
  // 'ID giáo viên': 'teacher_id',
  'Nội dung câu hỏi': 'content',
  'Đáp án A': 'ans_a',
  'Đáp án B': 'ans_b',
  'Đáp án C': 'ans_c',
  'Đáp án D': 'ans_d',
  'Đáp án đúng': 'correct_ans',
  'Giải thích': 'explanation',
  'Độ khó': 'level',
  'Khối lớp': 'grade',
  'Dạng bài': 'topic',
};

const ImportQuestionModal = ({ visible, onClose, onImport, onImported }) => {
  const notify = useNotify();
  const [previewData, setPreviewData] = useState([]);
  const [validateErrors, setValidateErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const fileInputRef = React.useRef();
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [selectedFileName, setSelectedFileName] = useState('');
  // Import nhiều câu hỏi, xác nhận nếu có lỗi, chỉ gửi bản ghi hợp lệ
  const [importResult, setImportResult] = useState(null);
  const [mathStructList, setMathStructList] = useState([]);
  const [showMathStructModal, setShowMathStructModal] = useState(false);
  // Gộp modal lỗi và warning mathStruct thành một modal xác nhận duy nhất
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Câu hỏi');
    XLSX.writeFile(wb, 'Cấu_trúc_mẫu_câu_hỏi.xlsx');
  };
  useEffect(() => {
    if (previewData.length > 0) {
      const { errors, mathStructs } = validateData(previewData);

      // Cập nhật state song song
      setValidateErrors(errors);
      setMathStructList(mathStructs);

      // Sử dụng biến cục bộ vừa tính toán xong, không sợ bất đồng bộ
      if (errors.length > 0 || mathStructs.length > 0) {
        setShowConfirmModal(true); // Hiển thị cảnh báo ngay khi load file xong nếu có lỗi/warning
      }
    } else {
      setValidateErrors([]);
      setMathStructList([]);
    }
  }, [allQuestions, previewData]);

  // Hàm tự động format các trường LaTeX: chuyển \( ... \) thành $...$
  const autoFormatLatex = (str) => {
    if (!str || typeof str !== 'string') return str;
    let s = str.trim();
    s = s.replace(/\\\((.*?)\\\)/g, (match, p1) => `$${p1.trim()}$`);
    s = s.replace(/\\\(|\\\)/g, '');
    s = s.replace(/ +/g, ' ');
    return s;
  };

  // Chuẩn hóa nội dung giống BE (giữ khoảng trắng đơn)
  const normalizeContent = (content) => {
    if (!content || typeof content !== 'string') return '';
    return String(content)
      .replace(/20\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .trim();
  };

  // Chuẩn hóa cho mathStruct: bỏ số, biến thành x
  const normalizeContentForMath = (content) => {
    if (!content || typeof content !== 'string') return '';
    return String(content)
      .replace(/20\d{2}/g, '')
      .replace(/\d+/g, '#')
      .replace(/[a-zA-Z]/g, 'x')
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z0-9\s#]/g, '')
      .toLowerCase()
      .trim();
  };

  // Validate dữ liệu: trả về mảng lỗi, mỗi lỗi là {row, message}
  // Gom mathStruct vào mathStructList, chỉ báo lỗi nếu trùng exact
  const validateData = (data) => {
    const errors = [];
    const mathStructs = [];
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
        row.level === '' ||
        row.grade === undefined ||
        row.grade === null ||
        row.grade === ''
      ) {
        errors.push({ row: idx + 1, message: 'Thiếu trường bắt buộc' });
        return;
      }
      // Kiểm tra level phải là số
      if (isNaN(Number(row.level))) {
        errors.push({ row: idx + 1, message: 'Độ khó phải là số (0 hoặc 1)' });
      }
      // Kiểm tra grade phải là số và hợp lệ
      if (isNaN(Number(row.grade)) || ![10, 11, 12].includes(Number(row.grade))) {
        errors.push({ row: idx + 1, message: 'Khối lớp phải là 10, 11 hoặc 12' });
      }
      // Kiểm tra trùng exact và mathStruct
      if (allQuestions.length > 0) {
        const norm = normalizeContent(row.content);
        const normMath = normalizeContentForMath(row.content);
        let foundExact = false;
        let foundMathStruct = false;

        for (const q of allQuestions) {
          const normQ = normalizeContent(q.content);
          const normMathQ = normalizeContentForMath(q.content);
          if (norm === normQ) foundExact = true;
          else if (normMath === normMathQ) foundMathStruct = true;
        }

        if (foundExact) {
          errors.push({ row: idx + 1, message: 'Câu hỏi này đã tồn tại (trùng hoàn toàn)!' });
        } else if (foundMathStruct) {
          mathStructs.push({ row: { ...row }, idx });
        }
      }
    });
    return { errors, mathStructs };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFileName(file ? file.name : '');
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
          if (['Nội dung câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Giải thích', 'Đáp án đúng'].includes(vi)) {
            val = autoFormatLatex(val);
          }
          mappedRow[fieldMap[vi]] = val;
        });
        mappedRow['teacher_id'] = user?.id || null;
        return mappedRow;
      });
      setPreviewData(mappedData);
      // Không validate ngay, sẽ validate khi allQuestions đã load xong
    };
    reader.readAsArrayBuffer(file);
    setFileInputKey(Date.now());
    // Validate lại dữ liệu và show modal xác nhận khi có lỗi hoặc mathStructList
  };

  const handleImport = async () => {
    // Nếu phát hiện có lỗi nghiêm trọng hoặc cảnh báo cấu trúc, hiện modal và DỪNG LẠI NGAY
    if (validateErrors.length > 0 || mathStructList.length > 0) {
      setShowConfirmModal(true);
      return; // <--- Cực kỳ quan trọng, đảm bảo không chạy xuống dưới
    }

    setImporting(true);
    try {
      if (onImport) {
        const result = await onImport(previewData, { dryRun: true });
        if (result && result.mathStruct && result.mathStruct.length > 0) {
          setMathStructList(result.mathStruct);
          setShowConfirmModal(true);
          setImporting(false);
          return;
        }
      }
      // Nếu hoàn toàn sạch sẽ, không trùng, không cảnh báo thì mới thực hiện import luôn
      await doImport(false);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  // Thực hiện import, nếu skipInvalid=true thì chỉ gửi bản ghi hợp lệ
  const doImport = async (skipInvalid, importMathStruct = false) => {
    setImporting(true);
    try {
      let dataToImport = previewData;
      // Lấy các dòng lỗi (thiếu trường, sai kiểu, trùng hoàn toàn)
      const invalidRows = validateErrors.map((e) => e.row);
      // Lấy content các bản ghi mathStruct
      const mathStructContents = mathStructList.map((m) => m.row.content);
      if (importMathStruct && mathStructList.length > 0) {
        // Import cả các bản ghi hợp lệ (không lỗi, không trùng hoàn toàn) và các bản ghi mathStruct
        dataToImport = previewData.filter((row, idx) => {
          // Loại bỏ các dòng lỗi (validateErrors) và các dòng trùng hoàn toàn (đã bị validateErrors đánh dấu)
          if (invalidRows.includes(idx + 1)) return false;
          // Nếu là mathStruct hoặc là hợp lệ (không thuộc mathStruct, không lỗi)
          return true;
        });
      } else if (skipInvalid) {
        // Chỉ import các bản ghi không lỗi
        dataToImport = previewData.filter((_, idx) => !invalidRows.includes(idx + 1));
      } else if (!importMathStruct && mathStructList.length > 0) {
        // Nếu chưa xác nhận import mathStruct thì chỉ gửi bản ghi không thuộc mathStruct
        dataToImport = previewData.filter((row) => !mathStructContents.includes(row.content));
      }
      if (dataToImport.length === 0) {
        notify.error('Không có bản ghi hợp lệ nào để import!');
        setImporting(false);
        return;
      }
      if (onImport) {
        // Nếu parent có cung cấp onImport, gọi nó. Nếu nó xử lý import thật, hy vọng nó trả về kết quả.
        const result = await onImport(dataToImport);
        if (result) {
          // Nếu parent trả về kết quả (inserted/skipped/mathStruct), hiển thị chi tiết
          if (result && (result.inserted || result.skipped || result.mathStruct)) {
            const importDetails = [];
            if (Array.isArray(result.inserted)) {
              result.inserted.forEach((q) => {
                importDetails.push({ content: q.content, status: 'created', info: 'Thành công' });
              });
            }
            if (Array.isArray(result.skipped)) {
              result.skipped.forEach((q) => {
                importDetails.push({ content: q.content, status: 'skipped', info: q.reason || 'Bị bỏ qua' });
              });
            }
            if (Array.isArray(result.mathStruct)) {
              result.mathStruct.forEach((q) => {
                importDetails.push({ content: q.row?.content, status: 'mathStruct', info: q.warning || 'Cảnh báo cấu trúc toán học' });
              });
            }
            setImportResult(importDetails);
            if (typeof onImported === 'function') {
              try {
                onImported();
              } catch (e) {}
            }
          } else {
            setImportResult(result);
            if (typeof onImported === 'function') {
              try {
                onImported();
              } catch (e) {}
            }
          }
        } else {
          // Nếu parent không thực hiện import thật (trả về undefined), thực hiện import tại đây
          const importDetails = [];
          for (const q of dataToImport) {
            try {
              // Gọi BE để kiểm tra tương đồng trước khi insert (dry-run)
              let sim;
              try {
                const simRes = await api.checkQuestionSimilarity(q.content);
                sim = simRes.data || simRes;
              } catch (e) {
                // Nếu lỗi khi check, xử lý như lỗi
                importDetails.push({ content: q.content, status: 'error', info: e?.message || 'Lỗi khi kiểm tra tương đồng' });
                continue;
              }
              if (sim?.decision === 'warning') {
                const proceed = await new Promise((resolve) => {
                  Modal.confirm({
                    title: 'Cảnh báo tương đồng',
                    content: (
                      <div>
                        <div>{sim.reason || 'Câu hỏi này có độ tương đồng cao với câu hỏi hiện có. Bạn có muốn tiếp tục import không?'}</div>
                        {sim.matched_question_content ? (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Câu hỏi tương đồng:</div>
                            <div style={{ padding: 8, background: '#fafafa', borderRadius: 4 }}>
                              <MathText>{sim.matched_question_content}</MathText>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ),
                    okText: 'Import',
                    cancelText: 'Bỏ qua',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false),
                  });
                });
                if (!proceed) {
                  importDetails.push({ content: q.content, status: 'skipped', info: sim.reason || 'Bị bỏ qua bởi người dùng' });
                  continue;
                }
                // Người dùng xác nhận, gọi BE với force để insert
                try {
                  await api.createQuestion({ ...q, force: true });
                  importDetails.push({ content: q.content, status: 'created', info: 'Thành công' });
                } catch (err2) {
                  let errorMsg2 = err2?.response?.data?.error || err2?.message || 'Lỗi';
                  importDetails.push({ content: q.content, status: 'error', info: errorMsg2 });
                }
              } else if (sim?.decision === 'reject') {
                importDetails.push({ content: q.content, status: 'skipped', info: sim.reason || 'Bị từ chối bởi hệ thống' });
              } else {
                // allowed -> insert normally
                try {
                  await api.createQuestion(q);
                  importDetails.push({ content: q.content, status: 'created', info: 'Thành công' });
                } catch (err3) {
                  let errorMsg3 = err3?.response?.data?.error || err3?.message || 'Lỗi';
                  importDetails.push({ content: q.content, status: 'error', info: errorMsg3 });
                }
              }
            } catch (err) {
              let errorMsg = err?.response?.data?.error || err?.message || 'Lỗi';
              importDetails.push({ content: q.content, status: 'error', info: errorMsg });
            }
          }
          setImportResult(importDetails);
          if (typeof onImported === 'function') {
            try {
              onImported();
            } catch (e) {}
          }
        }
      }
      setPreviewData([]);
      setValidateErrors([]);
      setMathStructList([]);
      setShowMathStructModal(false);
      // onImported sẽ được gọi sau khi import kết thúc (nếu được cung cấp)
      // Không notify và không đóng modal, chỉ hiển thị chi tiết trong modal
    } catch (err) {
      notify.error('Import thất bại: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setImporting(false);
    }
  };

  // Cột cho bảng preview
  const columns = [
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      render: (text) => text,
    },
    { title: 'A', dataIndex: 'ans_a', key: 'ans_a', render: (text) => text },
    { title: 'B', dataIndex: 'ans_b', key: 'ans_b', render: (text) => text },
    { title: 'C', dataIndex: 'ans_c', key: 'ans_c', render: (text) => text },
    { title: 'D', dataIndex: 'ans_d', key: 'ans_d', render: (text) => text },
    { title: 'Đúng', dataIndex: 'correct_ans', key: 'correct_ans', render: (text) => text },
    { title: 'Giải thích', dataIndex: 'explanation', key: 'explanation', render: (text) => text },
    { title: 'Độ khó', dataIndex: 'level', key: 'level' },
    { title: 'Khối lớp', dataIndex: 'grade', key: 'grade' },
    { title: 'Dạng bài', dataIndex: 'topic', key: 'topic' },
  ];

  return (
    <Modal
      title="Import Ngân Hàng Câu Hỏi"
      open={visible}
      onCancel={onClose}
      width={1000}
      style={{ maxHeight: '600px', overflowY: 'auto' }}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExportTemplate}>
          Tải file mẫu Excel
        </Button>,
        <Button
          key="refresh"
          onClick={() => {
            setPreviewData([]);
            setValidateErrors([]);
            setFileInputKey(Date.now());
            setSelectedFileName('');
            setImportResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        >
          Làm Mới
        </Button>,
        <Button key="import" type="primary" disabled={previewData.length === 0} loading={importing} onClick={handleImport}>
          Import
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div></div>
      <p>Bạn có thể tải file mẫu Excel để nhập câu hỏi theo đúng cấu trúc.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          key={fileInputKey}
          type="file"
          accept=".xlsx, .xls"
          style={{ marginTop: 16, marginBottom: 16, flex: 1 }}
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <span style={{ minWidth: 120, marginTop: 16, marginBottom: 16 }}>{selectedFileName || 'Chưa chọn file'}</span>
      </div>
      {/* Hiển thị lỗi validate chi tiết ngay dưới input file, giống ImportUsers */}
      {validateErrors.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f', background: '#fff1f0' }}>
          <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Có lỗi trong dữ liệu, vui lòng kiểm tra lại!</div>
          <ul style={{ margin: 0, color: '#ff4d4f', fontWeight: 'bold' }}>
            {validateErrors.map((err, idx) => (
              <li key={idx}>
                Dòng {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {previewData.length > 0 && (
        <Table
          dataSource={previewData.map((row, idx) => ({ ...row, key: idx }))}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
      {/* Modal xác nhận gộp lỗi và warning mathStruct */}
      <Modal
        open={showConfirmModal}
        title="Xác nhận import tất cả các bản ghi hợp lệ và các câu hỏi chỉ khác số/biến/năm"
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button
            key="confirm"
            type="primary"
            loading={importing}
            onClick={() => {
              setShowConfirmModal(false);
              doImport(false, true);
            }}
          >
            Xác nhận import tất cả
          </Button>,
          <Button key="close" onClick={() => setShowConfirmModal(false)}>
            Đóng
          </Button>,
        ]}
      >
        {validateErrors.length > 0 && (
          <Alert
            type="error"
            message="Các dòng sau bị lỗi, sẽ không được import:"
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
        {mathStructList.length > 0 && (
          <Alert
            type="warning"
            message="Các câu hỏi sau có cấu trúc toán học giống với câu hỏi khác, chỉ khác số/biến/năm. Bạn có muốn import tất cả không?"
            description={
              <ul style={{ margin: 0 }}>
                {mathStructList.map((m, idx) => (
                  <li key={idx}>{m.row.content}</li>
                ))}
              </ul>
            }
            showIcon
          />
        )}
      </Modal>
      {/* Hiển thị kết quả import từng dòng */}
      {importResult && previewData.length === 0 && (
        <div style={{ marginTop: 16 }}>
          {/* Hiển thị danh sách lỗi chi tiết, không dùng Alert/Notify */}
          {importResult.some((r) => r.status === 'skipped') && (
            <div style={{ marginBottom: 16 }}>
              <div>
                <b>Có lỗi trong dữ liệu, vui lòng kiểm tra lại!</b>
              </div>
              <ul style={{ margin: 0 }}>
                {importResult
                  .filter((r) => r.status === 'skipped')
                  .map((r, idx) => (
                    <li key={idx}>
                      {r.content?.slice(0, 60) || 'Câu hỏi'}: {r.info || 'Bị bỏ qua'}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {importResult.some((r) => r.status === 'mathStruct') && (
            <div style={{ marginBottom: 16 }}>
              <div>
                <b>Các câu hỏi sau có cấu trúc toán học giống với câu hỏi khác, chỉ khác số/biến/năm:</b>
              </div>
              <ul style={{ margin: 0 }}>
                {importResult
                  .filter((r) => r.status === 'mathStruct')
                  .map((r, idx) => (
                    <li key={idx}>
                      {r.content?.slice(0, 60) || 'Câu hỏi'}: {r.info || 'Cảnh báo cấu trúc toán học'}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {importResult.every((r) => r.status === 'created') && (
            <div style={{ marginBottom: 16 }}>
              <b>Import thành công tất cả các câu hỏi!</b>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ImportQuestionModal;

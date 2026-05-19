import React, { useState } from 'react';
import { Modal, Button, message, Table, Alert, Modal as AntdModal } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../../services/api';

const headers = ['Tên đăng nhập', 'Mật khẩu', 'Tên học sinh', 'Email', 'Khối'];

const fieldMap = {
  'Tên đăng nhập': 'username',
  'Mật khẩu': 'password',
  'Tên học sinh': 'full_name',
  Email: 'email',
  Khối: 'grade',
};

const ImportDKCaThi = ({ visible, onClose, sessionId, onImport }) => {
  const [previewData, setPreviewData] = useState([]);
  const [validateErrors, setValidateErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // Lưu kết quả trả về từ BE
  const [sessionGrade, setSessionGrade] = useState(null);
  const fileInputRef = React.useRef();
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [selectedFileName, setSelectedFileName] = useState('');

  // Lấy grade của ca thi khi mở modal
  React.useEffect(() => {
    if (visible && sessionId) {
      api.getExamSessionById(sessionId).then((res) => {
        setSessionGrade(res.data.grade);
      });
    }
  }, [visible, sessionId]);

  const handleExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Import Học Sinh');
    XLSX.writeFile(wb, 'Mau_Import_Hoc_Sinh.xlsx');
  };

  // Validate dữ liệu: trả về mảng lỗi, mỗi lỗi là {row, message}
  const validateData = (data) => {
    const errors = [];
    // Lấy danh sách username đã tồn tại
    let existedUsernames = [];
    // Đồng bộ, nên sẽ kiểm tra tồn tại trước khi validate
    // (nếu muốn tối ưu, có thể chuyển validateData thành async và gọi api.checkDuplicateUsers)
    // Ở đây sẽ chỉ kiểm tra username trùng trong file
    const usernameCount = {};
    data.forEach((row) => {
      if (row.username) {
        usernameCount[row.username] = (usernameCount[row.username] || 0) + 1;
      }
    });
    data.forEach((row, idx) => {
      // Nếu username bị trùng trong file
      if (row.username && usernameCount[row.username] > 1) {
        errors.push({ row: idx + 1, message: 'Tên đăng nhập bị trùng trong file import' });
      }
    });
    // Kiểm tra tồn tại trên hệ thống
    // (giả lập: nếu có api.checkDuplicateUsers thì nên gọi ở handleFileChange, ở đây chỉ kiểm tra đủ trường)
    data.forEach((row, idx) => {
      // Nếu là user mới (chưa có trong hệ thống), bắt buộc nhập đủ các trường
      const isNewUser = !row.id && row.password && row.full_name && row.email && row.grade;
      if (!row.username || (isNewUser && (!row.password || !row.full_name || !row.email || !row.grade))) {
        errors.push({ row: idx + 1, message: 'Thiếu trường bắt buộc cho học sinh mới (username, mật khẩu, tên, email, khối)' });
      }
      // Kiểm tra grade có khớp với grade của ca thi không
      if (sessionGrade && String(row.grade) !== String(sessionGrade)) {
        errors.push({ row: idx + 1, message: `Khối của học sinh (${row.grade}) không khớp với khối của ca thi (${sessionGrade})` });
      }
    });
    return errors;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setSelectedFileName(file ? file.name : '');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const mappedData = json.map((row) => {
        const mappedRow = {};
        Object.keys(fieldMap).forEach((vi) => {
          mappedRow[fieldMap[vi]] = row[vi];
        });
        return mappedRow;
      });
      setPreviewData(mappedData);
      setImportResult(null);
      // FE validate trước
      let errors = validateData(mappedData);
      // Nếu không có lỗi FE, gọi thử BE để lấy lỗi logic (READY, trùng, ...)
      if (errors.length === 0 && mappedData.length > 0) {
        try {
          // Gọi thử import với skipInvalid=true, không lưu kết quả, chỉ lấy lỗi
          const res = await api.importSessionParticipants({ session_id: Number(sessionId), users: mappedData });
          // Xử lý lỗi từng dòng trả về từ BE
          const beErrors = [];
          res.data.forEach((r, idx) => {
            if (
              r.status === 'ready_other_session' ||
              r.status === 'grade_mismatch' ||
              r.status === 'exists' ||
              r.status === 'duplicate_username' ||
              r.status === 'duplicate_email' ||
              r.status === 'invalid'
            ) {
              beErrors.push({
                row: idx + 1,
                message:
                  r.error ||
                  (r.status === 'ready_other_session'
                    ? 'Học sinh đã đăng ký ca thi READY khác'
                    : r.status === 'grade_mismatch'
                      ? 'Khối của học sinh không khớp với ca thi'
                      : r.status === 'exists'
                        ? 'Học sinh đã có trong ca thi này'
                        : r.status === 'duplicate_username'
                          ? 'Tên đăng nhập đã tồn tại'
                          : r.status === 'duplicate_email'
                            ? 'Email đã tồn tại'
                            : 'Thiếu trường bắt buộc'),
              });
            }
          });
          errors = beErrors;
        } catch (err) {
          // Nếu lỗi hệ thống thì vẫn giữ validate FE
        }
      }
      setValidateErrors(errors);
      if (errors.length > 0) {
        message.error('Import thất bại: Dữ liệu có lỗi, vui lòng kiểm tra lại!');
      }
    };
    reader.readAsArrayBuffer(file);
    setFileInputKey(Date.now());
  };

  const handleImport = async () => {
    // Nếu có lỗi, hỏi xác nhận trước khi import phần hợp lệ
    if (validateErrors.length > 0) {
      const errorRows = validateErrors.map((e) => e.row).join(', ');
      AntdModal.confirm({
        title: 'Có dữ liệu không hợp lệ!',
        content: `Dòng lỗi: ${errorRows}. Bạn có muốn xác nhận import các bản ghi hợp lệ không?`,
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          await doImport(true);
        },
      });
      return;
    }
    await doImport(false);
  };

  // Thực hiện import, nếu skipInvalid=true thì chỉ gửi bản ghi hợp lệ
  const doImport = async (skipInvalid) => {
    setImporting(true);
    try {
      let dataToImport = previewData;
      if (skipInvalid) {
        // Lấy các dòng hợp lệ (không nằm trong validateErrors)
        const invalidRows = validateErrors.map((e) => e.row);
        dataToImport = previewData.filter((_, idx) => !invalidRows.includes(idx + 1));
      }
      if (dataToImport.length === 0) {
        message.error('Không có bản ghi hợp lệ nào để import!');
        setImporting(false);
        return;
      }
      const res = await api.importSessionParticipants({ session_id: Number(sessionId), users: dataToImport });
      // Xử lý lỗi từng dòng trả về từ BE và tách bản ghi lỗi/thành công
      const newErrors = [];
      const failedRows = [];
      const successRows = [];
      res.data.forEach((r, idx) => {
        if (
          r.status === 'ready_other_session' ||
          r.status === 'grade_mismatch' ||
          r.status === 'exists' ||
          r.status === 'duplicate_username' ||
          r.status === 'duplicate_email' ||
          r.status === 'invalid'
        ) {
          newErrors.push({
            row: failedRows.length + 1,
            message:
              r.error ||
              (r.status === 'ready_other_session'
                ? 'Học sinh đã đăng ký ca thi READY khác'
                : r.status === 'grade_mismatch'
                  ? 'Khối của học sinh không khớp với ca thi'
                  : r.status === 'exists'
                    ? 'Học sinh đã có trong ca thi này'
                    : r.status === 'duplicate_username'
                      ? 'Tên đăng nhập đã tồn tại'
                      : r.status === 'duplicate_email'
                        ? 'Email đã tồn tại'
                        : 'Thiếu trường bắt buộc'),
          });
          failedRows.push(previewData[idx]);
        } else {
          successRows.push(previewData[idx]);
        }
      });
      setImportResult(res.data.filter((r) => r.newAccount));
      setPreviewData(failedRows); // Chỉ hiển thị lại các bản ghi lỗi
      setValidateErrors(newErrors);
      if (newErrors.length > 0) {
        message.error('Import thất bại: Có bản ghi lỗi, vui lòng kiểm tra lại!');
      } else {
        message.success('Đã import học sinh hợp lệ vào ca thi!');
        setPreviewData([]);
        setValidateErrors([]);
        onImport && onImport();
      }
    } catch (err) {
      message.error('Import thất bại: ' + (err?.response?.data?.error || err?.message || 'Lỗi không xác định'));
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Mật khẩu', dataIndex: 'password', key: 'password' },
    { title: 'Tên học sinh', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Khối', dataIndex: 'grade', key: 'grade' },
  ];

  // Cột cho bảng tài khoản mới tạo
  const newAccountColumns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Mật khẩu', dataIndex: 'password', key: 'password' },
    { title: 'Tên học sinh', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Khối', dataIndex: 'grade', key: 'grade' },
  ];

  return (
    <Modal
      title="Import học sinh vào ca thi"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExportTemplate}>
          Tải file mẫu Excel
        </Button>,
        <Button
          key="refresh"
          onClick={() => {
            setPreviewData([]);
            setValidateErrors([]);
            setImportResult(null);
            setFileInputKey(Date.now());
            setSelectedFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        >
          Làm Mới
        </Button>,
        <Button
          key="import"
          type="primary"
          disabled={
            previewData.length === 0 ||
            (validateErrors.length > 0 && previewData.filter((_, idx) => !validateErrors.some((e) => e.row === idx + 1)).length === 0)
          }
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
      <p>Bạn có thể tải file mẫu Excel để nhập danh sách học sinh theo đúng cấu trúc. Nếu là học sinh mới, chỉ cần nhập đủ tên, email, khối.</p>
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
      {importResult && (
        <div style={{ marginTop: 24 }}>
          <Alert type="info" message="Tài khoản học sinh mới được tạo (vui lòng phát cho học sinh):" showIcon style={{ marginBottom: 8 }} />
          <Table
            dataSource={importResult.filter((r) => r.newAccount).map((r, idx) => ({ ...r.newAccount, key: idx }))}
            columns={newAccountColumns}
            pagination={false}
            scroll={{ x: true }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportDKCaThi;

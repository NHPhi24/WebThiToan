import * as XLSX from 'xlsx';
import { Button, Table, Modal, Alert, message } from 'antd';
import api from '../../../services/api';
import { useState, useRef } from 'react';
import { DownloadOutlined } from '@ant-design/icons';

const USER_HEADERS = [
  'Tên đăng nhập', // username
  'Mật khẩu', // password
  'Xác nhận mật khẩu', // confirm_password
  'Họ và tên', // full_name
  'Email', // email
  'Vai trò', // role
];

const USER_FIELD_MAP = {
  'Tên đăng nhập': 'username',
  'Mật khẩu': 'password',
  'Xác nhận mật khẩu': 'confirm_password',
  'Họ và tên': 'full_name',
  Email: 'email',
  'Vai trò': 'role',
};

const USER_REQUIRED = ['username', 'password', 'confirm_password', 'full_name', 'role'];

const USER_COLUMNS = [
  { title: 'Tên đăng nhập', dataIndex: 'username' },
  { title: 'Mật khẩu', dataIndex: 'password' },
  { title: 'Xác nhận mật khẩu', dataIndex: 'confirm_password' },
  { title: 'Họ và tên', dataIndex: 'full_name' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Vai trò', dataIndex: 'role' },
];

const ImportUsers = ({ visible, onClose, onImported }) => {
  const [previewData, setPreviewData] = useState([]);
  const [validateErrors, setValidateErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef();

  // Xuất file mẫu Excel
  const handleExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([USER_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UsersTemplate');
    XLSX.writeFile(wb, 'users_template.xlsx');
  };

  // Đọc file Excel
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: USER_HEADERS, range: 1 });
      // Map về đúng field và đảm bảo role luôn uppercase
      const mapped = rows.map((row) => {
        const obj = {};
        Object.entries(USER_FIELD_MAP).forEach(([header, key]) => {
          if (key === 'role') {
            obj[key] = (row[header] || '').toUpperCase();
          } else {
            obj[key] = row[header] || '';
          }
        });
        return obj;
      });
      setPreviewData(mapped);
      // Validate
      let errors = [];
      mapped.forEach((row, idx) => {
        USER_REQUIRED.forEach((field) => {
          if (!row[field] || String(row[field]).trim() === '') {
            errors.push({ row: idx + 2, message: `${field} bắt buộc nhập` });
          }
        });
        // So khớp mật khẩu và xác nhận mật khẩu
        if (row['password'] !== row['confirm_password']) {
          errors.push({ row: idx + 2, message: 'Mật khẩu và xác nhận mật khẩu không khớp' });
        }
      });
      // Kiểm tra trùng username/email với CSDL
      try {
        const res = await api.checkDuplicateUsers(mapped);
        if (res.data.duplicates && res.data.duplicates.length > 0) {
          res.data.duplicates.forEach((dup) => {
            if (dup.duplicateUsername) {
              errors.push({ row: dup.index + 2, message: 'Tên đăng nhập đã tồn tại' });
            }
            if (dup.duplicateEmail) {
              errors.push({ row: dup.index + 2, message: 'Email đã tồn tại' });
            }
          });
        }
      } catch (err) {
        errors.push({ row: 0, message: 'Lỗi kiểm tra trùng tài khoản với hệ thống' });
      }
      setValidateErrors(errors);
    };
    reader.readAsArrayBuffer(file);
  };

  // Import nhiều user
  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let fail = 0;
    for (const user of previewData) {
      try {
        // Không gửi confirm_password lên BE, đảm bảo role luôn uppercase
        const { confirm_password, ...userData } = user;
        userData.role = (userData.role || '').toUpperCase();
        await api.createUser(userData);
        success++;
      } catch (err) {
        fail++;
      }
    }
    message.success(`Import thành công: ${success}, thất bại: ${fail}`);
    setImporting(false);
    setPreviewData([]);
    setValidateErrors([]);
    if (onImported) onImported();
    if (onClose) onClose();
  };

  return (
    <Modal
      title="Import học sinh/giáo viên từ Excel"
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
            if (fileInputRef.current) fileInputRef.current.value = '';
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
      <p>Bạn có thể tải file mẫu Excel để nhập học sinh/giáo viên theo đúng cấu trúc.</p>
      <input type="file" accept=".xlsx, .xls" style={{ marginTop: 16, marginBottom: 16 }} onChange={handleFileChange} ref={fileInputRef} />
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
          columns={USER_COLUMNS}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default ImportUsers;

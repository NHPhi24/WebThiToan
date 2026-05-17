import * as XLSX from 'xlsx';
import { Button, Table, Modal, Alert, message, Select } from 'antd';
import api from '../../../services/api';
import { useState, useRef } from 'react';
import { DownloadOutlined } from '@ant-design/icons';

const USER_HEADERS = [
  'Tên đăng nhập', // username
  'Mật khẩu', // password
  'Họ và tên', // full_name
  'Email', // email
  'Vai trò', // role
  'Khối', // grade
];

const USER_FIELD_MAP = {
  'Tên đăng nhập': 'username',
  'Mật khẩu': 'password',
  'Họ và tên': 'full_name',
  Email: 'email',
  'Vai trò': 'role',
  Khối: 'grade',
};

const USER_REQUIRED = ['username', 'password', 'full_name', 'role', 'grade'];

const USER_COLUMNS = [
  { title: 'Tên đăng nhập', dataIndex: 'username' },
  { title: 'Mật khẩu', dataIndex: 'password' },
  { title: 'Họ và tên', dataIndex: 'full_name' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Vai trò', dataIndex: 'role' },
  { title: 'Khối/lớp', dataIndex: 'grade' },
];

const ImportUsers = ({ visible, onClose, onImported }) => {
  const [previewData, setPreviewData] = useState([]);
  const [validateErrors, setValidateErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [exportGradeModal, setExportGradeModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState();
  const fileInputRef = useRef();

  // Xuất file mẫu Excel
  const handleExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([USER_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UsersTemplate');
    // Lấy role từ localStorage.user (object) thay vì chỉ lấy key 'role'
    let role = '';
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      role = user?.role || '';
    } catch (e) {
      role = '';
    }
    const isAdmin = role.toUpperCase() === 'ADMIN';
    const fileName = isAdmin ? 'Mau_nhap_nguoi_dung.xlsx' : 'Mau_nhap_hoc_sinh.xlsx';
    XLSX.writeFile(wb, fileName);
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
          } else if (key === 'grade') {
            obj[key] = row[header] !== undefined && row[header] !== null && row[header] !== '' ? Number(row[header]) : '';
          } else {
            obj[key] = row[header];
          }
        });
        return obj;
      });
      setPreviewData(mapped);
      // Validate
      let errors = [];
      let existedUsernames = [];
      try {
        const res = await api.checkDuplicateUsers(mapped);
        if (res.data.duplicates && res.data.duplicates.length > 0) {
          res.data.duplicates.forEach((dup) => {
            if (dup.duplicateUsername) existedUsernames.push(dup.username);
            if (dup.duplicateUsername) errors.push({ row: dup.index + 2, message: 'Tên đăng nhập đã tồn tại' });
            if (dup.duplicateEmail) errors.push({ row: dup.index + 2, message: 'Email đã tồn tại' });
          });
        }
      } catch (err) {
        errors.push({ row: 0, message: 'Lỗi kiểm tra trùng tài khoản với hệ thống' });
      }
      mapped.forEach((row, idx) => {
        // Nếu là user mới (username chưa tồn tại), bắt buộc nhập đủ các trường
        const isNewUser = !existedUsernames.includes(row.username);
        USER_REQUIRED.filter((f) => f !== 'grade' && (isNewUser || f === 'username')).forEach((field) => {
          if (!row[field] || String(row[field]).trim() === '') {
            errors.push({ row: idx + 2, message: `${field} bắt buộc nhập` });
          }
        });
        // Username không được chứa dấu cách
        if (row.username && String(row.username).includes(' ')) {
          errors.push({ row: idx + 2, message: 'Tên đăng nhập không được chứa dấu cách' });
        }
        // Chỉ bắt buộc grade nếu là học sinh
        if (row.role === 'STUDENT') {
          if (row.grade === '' || row.grade === undefined || row.grade === null) {
            errors.push({ row: idx + 2, message: 'Thiếu trường Khối đối với học sinh' });
          } else if (isNaN(row.grade) || ![10, 11, 12].includes(Number(row.grade))) {
            errors.push({ row: idx + 2, message: 'Khối phải là 10, 11 hoặc 12 đối với học sinh' });
          }
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
  // Import nhiều user, cho phép import phần hợp lệ
  const [importResult, setImportResult] = useState(null);
  // Import nhiều user, cho phép import phần hợp lệ, xác nhận nếu có lỗi
  const handleImport = async () => {
    if (validateErrors.length > 0) {
      const errorRows = validateErrors.map((e) => e.row).join(', ');
      Modal.confirm({
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
        const invalidRows = validateErrors.map((e) => e.row);
        dataToImport = previewData.filter((_, idx) => !invalidRows.includes(idx + 2));
      }
      if (dataToImport.length === 0) {
        message.error('Không có bản ghi hợp lệ nào để import!');
        setImporting(false);
        return;
      }
      const res = await api.importUsers(dataToImport);
      setImportResult(res.data);
      const success = res.data.filter((r) => r.status === 'created').length;
      const fail = res.data.length - success;
      message.success(`Import thành công: ${success}, thất bại: ${fail}`);
      setPreviewData([]);
      setValidateErrors([]);
      if (onImported) onImported();
    } catch (err) {
      message.error('Import thất bại: ' + (err?.response?.data?.error || err?.message || 'Lỗi không xác định'));
    } finally {
      setImporting(false);
    }
  };

  const handleExportUserInGrade = async (grade) => {
    if (!grade || !['10', '11', '12'].includes(String(grade))) {
      message.error('Vui lòng chọn lớp hợp lệ (10, 11 hoặc 12)');
      return;
    }
    try {
      const res = await api.getAllStudents(String(grade));
      const students = res.data || [];
      if (students.length === 0) {
        message.info('Không có học sinh nào trong lớp này!');
        return;
      }
      // Chuyển về định dạng xuất Excel đúng mẫu import ca thi
      const exportData = students.map((u) => ({
        'Tên đăng nhập': u.username,
        'Mật khẩu': '',
        'Tên học sinh': u.full_name,
        Email: u.email,
        Khối: u.grade,
      }));
      const headers = ['Tên đăng nhập', 'Mật khẩu', 'Tên học sinh', 'Email', 'Khối'];
      const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Lop${grade}`);
      XLSX.writeFile(wb, `Danh_sach_hoc_sinh_lop_${grade}.xlsx`);
      setExportGradeModal(false);
      setSelectedGrade(undefined);
    } catch (err) {
      message.error('Lỗi khi xuất file excel theo lớp');
    }
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
        <Button key="exportByGrade" icon={<DownloadOutlined />} onClick={() => setExportGradeModal(true)}>
          Xuất file excel theo lớp
        </Button>,
        <Button
          key="refresh"
          onClick={() => {
            setPreviewData([]);
            setValidateErrors([]);
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
      <p>Bạn có thể tải file mẫu Excel để nhập học sinh/giáo viên theo đúng cấu trúc.</p>
      <Modal
        open={exportGradeModal}
        title="Chọn lớp muốn xuất"
        onCancel={() => {
          setExportGradeModal(false);
          setSelectedGrade(undefined);
        }}
        onOk={() => handleExportUserInGrade(selectedGrade)}
        okText="Xuất file"
        cancelText="Hủy"
      >
        <div style={{ margin: '16px 0' }}>
          <Select
            style={{ width: 200 }}
            placeholder="Chọn lớp"
            value={selectedGrade}
            onChange={setSelectedGrade}
            options={[
              { value: '10', label: 'Lớp 10' },
              { value: '11', label: 'Lớp 11' },
              { value: '12', label: 'Lớp 12' },
            ]}
          />
        </div>
      </Modal>
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
          columns={(() => {
            // Nếu có ít nhất 1 học sinh thì hiển thị cột khối/lớp, còn lại ẩn
            const hasStudent = previewData.some((row) => row.role === 'STUDENT');
            if (hasStudent) return USER_COLUMNS;
            // Ẩn cột khối/lớp nếu không có học sinh
            return USER_COLUMNS.filter((col) => col.dataIndex !== 'grade');
          })()}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
      {/* Hiển thị kết quả import từng dòng */}
      {importResult && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type="info"
            message="Kết quả import từng dòng"
            description={
              <ul style={{ margin: 0 }}>
                {importResult.map((r, idx) => (
                  <li key={idx} style={{ color: r.status === 'created' ? 'green' : 'red' }}>
                    {r.username}: {r.status === 'created' ? 'Thành công' : r.error || r.status}
                  </li>
                ))}
              </ul>
            }
            showIcon
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportUsers;

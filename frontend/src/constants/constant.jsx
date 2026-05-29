// Trạng thái đăng ký ca thi
export const EXAM_SESSION_REGISTER_STATUS = [
  { value: 10, label: 'Chờ duyệt' },
  { value: 20, label: 'Phê duyệt' },
  { value: 50, label: 'Từ chối' },
];
export const REGISTER_EXAM_STATUS = [
  { value: 10, label: 'Chờ duyệt' },
  { value: 20, label: 'Phê duyệt' },
  { value: 50, label: 'Từ chối' },
];
// Trạng thái ca thi
export const EXAM_SESSION_STATUS = [
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'FINISHED', label: 'Đã kết thúc' },
];
export const QUESTION_LEVELS = [
  { label: 'Cơ bản', value: 0 },
  { label: 'Nâng cao', value: 1 },
];
export const ROLES = [
  { label: 'Quản trị', value: 'ADMIN' },
  { label: 'Giáo viên', value: 'TEACHER' },
  { label: 'Học sinh', value: 'STUDENT' },
];

export const DANGCAUHOI = [
  // Toán lớp 10
  { label: 'Đại số', value: 'daiSo', grade: 10 },
  { label: 'Phương trình', value: 'phuongTrinh', grade: 10 },
  { label: 'Hàm số', value: 'hamSo', grade: 10 },
  { label: 'Tổ hợp & Xác suất', value: 'toHopXacSuat', grade: 10 },
  { label: 'Hình học phẳng & Vectơ', value: 'hinhHocPhangVecto', grade: 10 },

  // Toán lớp 11
  { label: 'Lượng giác', value: 'luongGiac', grade: 11 },
  { label: 'Dãy số', value: 'daySo', grade: 11 },
  { label: 'Giải tích & đạo hàm', value: 'giaiTich', grade: 11 },
  { label: 'Mũ & Logarit', value: 'muLogarit', grade: 11 },
  { label: 'Hình không gian', value: 'hinhKhongGian', grade: 11 },

  // Toán lớp 12
  { label: 'Khảo sát hàm số', value: 'khaoSatHamSo', grade: 12 },
  { label: 'Số phức', value: 'soPhuc', grade: 12 },
  { label: 'Nguyên hàm & Tích phân', value: 'nguyenHamTichPhan', grade: 12 },
  { label: 'Xác suất nâng cao', value: 'xacSuatNangCao', grade: 12 },
  { label: 'Hình không gian Oxyz', value: 'hinhKhongGianOxyz', grade: 12 },
];

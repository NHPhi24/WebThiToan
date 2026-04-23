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

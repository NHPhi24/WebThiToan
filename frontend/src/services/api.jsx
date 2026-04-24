import axiosClient from './axiosClient';

const api = {
  // Người dùng / học sinh
  login: (credentials) => axiosClient.post('/users/login', credentials),
  // Đổi mật khẩu (không mã hóa)
  changePassword: (userId, newPassword) => axiosClient.post(`/users/${userId}/change-password`, { newPassword }),
  // Quản lý người dùng
  getAllUsers: () => axiosClient.get('/users'),
  getUserById: (id) => axiosClient.get(`/users/${id}`),
  createUser: (data) => axiosClient.post('/users', data),
  updateUser: (id, data) => axiosClient.put(`/users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
  getAllStudents: () => axiosClient.get('/users/students'),
  // Kiểm tra trùng user khi import
  checkDuplicateUsers: (users) => axiosClient.post('/users/check-duplicates', { users }),

  // ngân hàng câu hỏi
  getAllQuestions: () => axiosClient.get('/questions'),
  getQuestionById: (id) => axiosClient.get(`/questions/${id}`),
  createQuestion: (data) => axiosClient.post('/questions', data),
  updateQuestion: (id, data) => axiosClient.put(`/questions/${id}`, data),
  deleteQuestion: (id) => axiosClient.delete(`/questions/${id}`),

  // Cấu trúc đề thi
  getAllExamTemplates: () => axiosClient.get('/exam-templates'),
  createExamTemplate: (data) => axiosClient.post('/exam-templates', data),
  updateExamTemplate: (id, data) => axiosClient.put(`/exam-templates/${id}`, data),
  deleteExamTemplate: (id) => axiosClient.delete(`/exam-templates/${id}`),
  // Đề thi
  getAllExams: () => axiosClient.get('/exams'),
  getQuestionsByExamId: (id) => axiosClient.get(`/exams/${id}/questions`),
  autoGenerateExam: (data) => axiosClient.post('/exams/auto-generate', data),
  deleteExam: (id) => axiosClient.delete(`/exams/${id}`),

  // Ca thi
  getAllExamSessions: () => axiosClient.get('/exam-sessions'),
  getExamSessionById: (id) => axiosClient.get(`/exam-sessions/${id}`),
  createExamSession: (data) => axiosClient.post('/exam-sessions', data),
  updateExamSession: (id, data) => axiosClient.put(`/exam-sessions/${id}`, data),
  deleteExamSession: (id) => axiosClient.delete(`/exam-sessions/${id}`),
  updateExamSessionStatus: (id, status) => axiosClient.patch(`/exam-sessions/${id}/status`, { status }),

  getOngoingExamSessions: () => axiosClient.get('/exam-sessions/ongoing'),
  getReadyExamSessions: () => axiosClient.get('/exam-sessions/ready'),
  // Bắt đầu làm bài thi (random mã đề và lấy câu hỏi từ BE)
  startExamSession: (sessionId) => axiosClient.post(`/exam-sessions/${sessionId}/start`),
  // Danh sách đăng ký ca thi
  getAllSessionParticipants: () => axiosClient.get('/session-participants'),
  // Lấy danh sách user đã đăng ký của 1 ca thi
  getUsersBySession: (session_id) => axiosClient.get(`/session-participants/${session_id}/users`),
  registerSessionParticipant: ({ session_id, user_id }) => axiosClient.post('/session-participants/register', { session_id, user_id }),
  // Ca thi đang diễn ra kèm trạng thái đăng ký của user
  getOngoingExamSessionsWithRegisterStatus: (user_id) => axiosClient.get(`/exam-sessions/ongoing/with-register-status?user_id=${user_id}`),
  // Nộp bài (manual submit)
  createExamResult: (data) => axiosClient.post('/exam-results', data),
  // Nộp tự động bài thi (auto submit)
  autoSubmitExamResult: ({ student_id, exam_id, session_id, duration_seconds }) =>
    axiosClient.post('/exam-results/auto-submit', { student_id, exam_id, session_id, duration_seconds }),
  // Ca thi đang diễn ra mà học sinh đã được phê duyệt
  getOngoingApprovedExamSessions: (user_id) => axiosClient.get(`/exam-sessions/ongoing/approved?user_id=${user_id}`),
  // Kết quả thi
  getAllExamResults: () => axiosClient.get('/exam-results'),
  getExamResultById: (id) => axiosClient.get(`/exam-results/${id}`),
  // Kết quả thi của học sinh hiện tại
  getExamResultsByStudent: (student_id) => axiosClient.get(`/exam-results/student?student_id=${student_id}`),

  // Ghi nhật ký lịch sử
  getAllSystemLogs: () => axiosClient.get('/system-logs'),
};

export default api;

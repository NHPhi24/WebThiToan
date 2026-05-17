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
  importUsers: (users) => axiosClient.post('/users/import', { users }),
  getAllStudents: (grade) => axiosClient.get('/users/students' + (grade ? `?grade=${encodeURIComponent(grade)}` : '')),
  // Kiểm tra trùng user khi import
  checkDuplicateUsers: (users) => axiosClient.post('/users/check-duplicates', { users }),

  // ngân hàng câu hỏi
  getAllQuestions: () => axiosClient.get('/questions'),
  getQuestionById: (id) => axiosClient.get(`/questions/${id}`),
  createQuestion: (data) => axiosClient.post('/questions', data).then((res) => res.data),
  updateQuestion: (id, data) => axiosClient.put(`/questions/${id}`, data).then((res) => res.data),
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
  updateExam: (id, data) => axiosClient.put(`/exams/${id}`, data),
  deleteExam: (id) => axiosClient.delete(`/exams/${id}`),

  // Ca thi
  getAllExamSessions: () => axiosClient.get('/exam-sessions'),
  getExamSessionById: (id) => axiosClient.get(`/exam-sessions/${id}`),
  createExamSession: (data) => axiosClient.post('/exam-sessions', data),
  updateExamSession: (id, data) => axiosClient.put(`/exam-sessions/${id}`, data),
  deleteExamSession: (id) => axiosClient.delete(`/exam-sessions/${id}`),
  updateExamSessionStatus: (id, status, actor_id) => axiosClient.patch(`/exam-sessions/${id}/status`, { status, actor_id }),
  getOngoingExamSessions: () => axiosClient.get('/exam-sessions/ongoing'),
  getReadyExamSessions: () => axiosClient.get('/exam-sessions/ready'),
  getOngoingApprovedExamSessions: (user_id) => axiosClient.get(`/exam-sessions/ongoing/approved?user_id=${user_id}`),
  // Import học sinh vào ca thi
  importSessionParticipants: ({ session_id, users }) => axiosClient.post('/session-participants/import', { session_id, users }),
  startExamSession: (sessionId) => axiosClient.post(`/exam-sessions/${sessionId}/start`),
  // đăng kỳ tham thi
  getAllSessionParticipants: () => axiosClient.get('/session-participants'),
  getUsersBySession: (session_id) => axiosClient.get(`/session-participants/${session_id}/users`),
  registerSessionParticipant: ({ session_id, user_id }) => axiosClient.post('/session-participants/register', { session_id, user_id }),
  getOngoingExamSessionsWithRegisterStatus: (user_id) => axiosClient.get(`/exam-sessions/ongoing/with-register-status?user_id=${user_id}`),
  // vi phạm khi thi
  addViolationLog: ({ student_id, session_id, type, note }) =>
    axiosClient.post('/exam-results/violation-log', { student_id, session_id, type, note }),
  // nộp bài thi
  createExamResult: (data) => {
    // Ép kiểu số cho các id để tránh lỗi duplicate key
    return axiosClient.post('/exam-results', {
      ...data,
      student_id: Number(data.student_id),
      exam_id: Number(data.exam_id),
      session_id: Number(data.session_id),
    });
  },
  // Nộp tự động bài thi (auto submit)
  autoSubmitExamResult: ({ student_id, exam_id, session_id, duration_seconds }) =>
    axiosClient.post('/exam-results/auto-submit', {
      student_id: Number(student_id),
      exam_id: Number(exam_id),
      session_id: Number(session_id),
      duration_seconds,
    }),

  // Kết quả thi
  getAllExamResults: () => axiosClient.get('/exam-results'),
  getExamResultById: (id) => axiosClient.get(`/exam-results/${id}`),
  getExamResultsByStudent: (student_id) => axiosClient.get(`/exam-results/student?student_id=${student_id}`),
  // Ghi nhật ký lịch sử
  getAllSystemLogs: () => axiosClient.get('/system-logs'),
};

export default api;

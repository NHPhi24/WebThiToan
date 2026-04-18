import axiosClient from './axiosClient';

const api = {
  // User
  login: (credentials) => axiosClient.post('/users/login', credentials),
  getAllUsers: () => axiosClient.get('/users'),
  getUserById: (id) => axiosClient.get(`/users/${id}`),
  createUser: (data) => axiosClient.post('/users', data),
  updateUser: (id, data) => axiosClient.put(`/users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
  getAllStudents: () => axiosClient.get('/users/students'),

  // Question
  getAllQuestions: () => axiosClient.get('/questions'),
  getQuestionById: (id) => axiosClient.get(`/questions/${id}`),
  createQuestion: (data) => axiosClient.post('/questions', data),
  updateQuestion: (id, data) => axiosClient.put(`/questions/${id}`, data),
  deleteQuestion: (id) => axiosClient.delete(`/questions/${id}`),

  // Exam Template
  getAllExamTemplates: () => axiosClient.get('/exam-templates'),
  createExamTemplate: (data) => axiosClient.post('/exam-templates', data),

  // Exam
  getAllExams: () => axiosClient.get('/exams'),

  // Exam Session
  getAllExamSessions: () => axiosClient.get('/exam-sessions'),
  getExamSessionById: (id) => axiosClient.get(`/exam-sessions/${id}`),
  createExamSession: (data) => axiosClient.post('/exam-sessions', data),
  updateExamSession: (id, data) => axiosClient.put(`/exam-sessions/${id}`, data),
  deleteExamSession: (id) => axiosClient.delete(`/exam-sessions/${id}`),
  updateExamSessionStatus: (id, status) => axiosClient.patch(`/exam-sessions/${id}/status`, { status }),

  // Exam Result
  getAllExamResults: () => axiosClient.get('/exam-results'),
  getExamResultById: (id) => axiosClient.get(`/exam-results/${id}`),

  // System Log
  getAllSystemLogs: () => axiosClient.get('/system-logs'),
};

export default api;

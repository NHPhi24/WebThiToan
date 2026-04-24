const express = require('express');
const router = express.Router();
const examSessionController = require('../controllers/examSessionController');

// Danh sách, tạo mới
router.get('/', examSessionController.getAllExamSessions);
router.post('/', examSessionController.createExamSession);

// Ca thi đang diễn ra (phải đặt trước /:id)
router.get('/ongoing', examSessionController.getOngoingExamSessions);
// API: GET /exam-sessions/ongoing/approved?user_id=...
router.get('/ongoing/approved', examSessionController.getOngoingApprovedExamSessionsByUser);
// API: GET /exam-sessions/ongoing/with-register-status?user_id=...
router.get('/ongoing/with-register-status', examSessionController.getOngoingExamSessionsWithRegisterStatus);
// Ca thi sẵn sàng (chưa bắt đầu)
router.get('/ready', examSessionController.getReadyExamSessions);

// Xem chi tiết
router.get('/:id', examSessionController.getExamSessionById);
// Bắt đầu làm bài: random mã đề và trả về câu hỏi
router.post('/:id/start', examSessionController.startExamSessionForStudent);
// Sửa ca thi
router.put('/:id', examSessionController.updateExamSession);
// Xóa ca thi
router.delete('/:id', examSessionController.deleteExamSession);
// Đổi trạng thái
router.patch('/:id/status', examSessionController.updateExamSessionStatus);

module.exports = router;

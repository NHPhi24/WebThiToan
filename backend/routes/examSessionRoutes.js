const express = require('express');
const router = express.Router();
const examSessionController = require('../controllers/examSessionController');


// Danh sách, tạo mới
router.get('/', examSessionController.getAllExamSessions);
router.post('/', examSessionController.createExamSession);

// Xem chi tiết
router.get('/:id', examSessionController.getExamSessionById);
// Sửa ca thi
router.put('/:id', examSessionController.updateExamSession);
// Xóa ca thi
router.delete('/:id', examSessionController.deleteExamSession);
// Đổi trạng thái
router.patch('/:id/status', examSessionController.updateExamSessionStatus);

module.exports = router;
const express = require('express');
const router = express.Router();
const examResultController = require('../controllers/examResultController');

// Xem danh sách kết quả
router.get('/', examResultController.getAllExamResults);
// API riêng cho học sinh xem kết quả của mình
router.get('/student', examResultController.getExamResultsByStudent);
// Xem chi tiết kết quả thi
router.get('/:id', examResultController.getExamResultDetail);
// Nộp chủ động (manual submit)
router.post('/', examResultController.createExamResult);
// Nộp tự động (auto submit)
router.post('/auto-submit', examResultController.autoSubmitExamResult);

module.exports = router;

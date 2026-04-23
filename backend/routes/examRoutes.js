const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const examAutoController = require('../controllers/examAutoController');
router.get('/', examController.getAllExams);
router.get('/:id/questions', examController.getQuestionsByExamId); // Thêm route lấy câu hỏi theo exam_id
router.post('/auto-generate', examAutoController.autoGenerateExam);
router.delete('/:id', examController.deleteExam);

module.exports = router;

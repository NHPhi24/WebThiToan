const express = require('express');
const router = express.Router();
const examAutoController = require('../controllers/examAutoController');

// Tạo đề thi tự động dựa trên cấu trúc đề thi
router.post('/auto-generate', examAutoController.autoGenerateExam);

module.exports = router;

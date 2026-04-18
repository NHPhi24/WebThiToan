const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', questionController.getAllQuestions);
router.post('/', questionController.createQuestion);

// Sửa câu hỏi
router.put('/:id', questionController.updateQuestion);
// Xóa câu hỏi
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;

// Nhập hàng loạt câu hỏi bằng Excel
router.post('/import-excel', upload.single('file'), questionController.importQuestionsFromExcel);
// Xuất file mẫu Excel
router.get('/export-template', questionController.exportQuestionsTemplate);
router.get('/:id', questionController.getQuestionById);

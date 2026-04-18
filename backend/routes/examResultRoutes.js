const express = require('express');
const router = express.Router();
const examResultController = require('../controllers/examResultController');

router.get('/', examResultController.getAllExamResults);
router.post('/', examResultController.createExamResult);

module.exports = router;
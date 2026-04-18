const express = require('express');
const router = express.Router();
const examTemplateController = require('../controllers/examTemplateController');

router.get('/', examTemplateController.getAllExamTemplates);
router.post('/', examTemplateController.createExamTemplate);

module.exports = router;

const express = require('express');
const router = express.Router();
const examTemplateController = require('../controllers/examTemplateController');

router.get('/', examTemplateController.getAllExamTemplates);
router.post('/', examTemplateController.createExamTemplate);
router.put('/:id', examTemplateController.updateExamTemplate);
router.delete('/:id', examTemplateController.deleteExamTemplate);

module.exports = router;

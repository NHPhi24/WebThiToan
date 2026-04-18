const express = require('express');
const router = express.Router();
const systemLogController = require('../controllers/systemLogController');

router.get('/', systemLogController.getAllSystemLogs);

module.exports = router;

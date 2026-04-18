const express = require('express');
const router = express.Router();
const sessionParticipantController = require('../controllers/sessionParticipantController');

// Đăng ký ca thi (cho mọi user)
router.post('/register', sessionParticipantController.register);

module.exports = router;
// Giáo viên duyệt hoặc từ chối đăng ký ca thi
router.patch('/:session_id/:user_id/register-status', sessionParticipantController.updateRegisterStatus);

const express = require('express');
const router = express.Router();
const sessionParticipantController = require('../controllers/sessionParticipantController');

// Lấy danh sách đăng ký ca thi
router.get('/', sessionParticipantController.getAllSessionParticipants);
// Đăng ký ca thi (cho mọi user)
router.post('/register', sessionParticipantController.register);
// Xóa học sinh khỏi ca thi
router.delete('/:session_id/:user_id', sessionParticipantController.removeParticipant);
// Giáo viên duyệt hoặc từ chối đăng ký ca thi
router.patch('/:session_id/:user_id/register-status', sessionParticipantController.updateRegisterStatus);
// Lấy danh sách user đã đăng ký của 1 ca thi
router.get('/:session_id/users', sessionParticipantController.getUsersBySession);
// Học sinh tự hủy đăng ký ca thi
router.post('/cancel-register', sessionParticipantController.cancelRegister);

// Học sinh bắt đầu vào phòng thi: cập nhật has_joined
router.post('/mark-joined', sessionParticipantController.markJoined);
module.exports = router;

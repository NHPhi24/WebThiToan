const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = userController;

router.post('/login', userController.loginUser);
// Các route dưới đây yêu cầu xác thực JWT
router.use(authenticateToken);
router.post('/check-duplicates', userController.checkDuplicateUsers);
router.post('/:id/change-password', userController.changePassword);
router.get('/students', userController.getAllStudents);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById); // Thêm route lấy user theo id
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

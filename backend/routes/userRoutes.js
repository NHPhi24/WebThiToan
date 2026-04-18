const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// Lấy tất cả học sinh
router.get('/students', userController.getAllStudents);

router.post('/login', userController.loginUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById); // Thêm route lấy user theo id
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

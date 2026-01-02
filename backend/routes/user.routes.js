const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Tất cả routes đều cần authentication và admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Lấy danh sách tất cả users
router.get('/', getAllUsers);

// Lấy thông tin một user
router.get('/:id', getUserById);

// Tạo user mới
router.post('/', createUser);

// Cập nhật thông tin user
router.put('/:id', updateUser);

// Cập nhật mật khẩu user
router.patch('/:id/password', updateUserPassword);

// Xóa user
router.delete('/:id', deleteUser);

module.exports = router;


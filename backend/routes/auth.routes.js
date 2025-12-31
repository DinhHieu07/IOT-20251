const express = require('express');
const router = express.Router();
const { login, refreshToken, getCurrentUser, logout } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Đăng nhập 
router.post('/login', login);

// Refresh token 
router.post('/refresh', refreshToken);

// Lấy thông tin user hiện tại 
router.get('/me', authenticateToken, getCurrentUser);

// Đăng xuất 
router.post('/logout', authenticateToken, logout);

module.exports = router;


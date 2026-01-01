const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceStatus
} = require('../controllers/device.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// Lấy danh sách thiết bị
router.get('/', requireAdmin, getAllDevices);

// Lấy thông tin một thiết bị
router.get('/:id', requireAdmin, getDeviceById);

// Tạo thiết bị mới
router.post('/', requireAdmin, createDevice);

// Cập nhật thiết bị
router.put('/:id', requireAdmin, updateDevice);

// Cập nhật trạng thái thiết bị
router.patch('/:id/status', requireAdmin, updateDeviceStatus);

// Xóa thiết bị
router.delete('/:id', requireAdmin, deleteDevice);

module.exports = router;


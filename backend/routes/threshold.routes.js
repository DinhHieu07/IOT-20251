const express = require('express');
const router = express.Router();
const {
  getThresholdByDevice,
  updateThreshold
} = require('../controllers/threshold.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// Lấy threshold của device
router.get('/device/:deviceId', getThresholdByDevice);

// Cập nhật threshold của device
router.put('/device/:deviceId', updateThreshold);

module.exports = router;


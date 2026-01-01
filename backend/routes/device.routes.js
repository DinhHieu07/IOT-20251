const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getDevices,
  getDeviceById,
  controlDevice,
  getDeviceSensorData,
  getLatestSensorData,
  getFanRuntime
} = require('../controllers/device.controller');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// Routes
router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/:id/control', controlDevice);
router.get('/:id/sensor-data', getDeviceSensorData);
router.get('/:id/sensor-data/latest', getLatestSensorData);
router.get('/:id/fan-runtime', getFanRuntime);

module.exports = router;


const express = require('express');
const router = express.Router();
const { getSensorDataHistory, getSensorDataStats } = require('../controllers/sensorData.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

router.get('/history', getSensorDataHistory);
router.get('/stats', getSensorDataStats);

module.exports = router;


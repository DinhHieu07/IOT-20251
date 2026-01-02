const express = require('express');
const router = express.Router();
const { getAlertHistory, updateAlertStatus, getAlertStats } = require('../controllers/alert.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

router.get('/history', getAlertHistory);
router.get('/stats', getAlertStats);
router.patch('/:id/status', updateAlertStatus);

module.exports = router;


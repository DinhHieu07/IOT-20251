const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);
router.post('/', authMiddleware.verifyToken, notificationController.createNotification);
router.put('/read-all', authMiddleware.verifyToken, notificationController.markAllAsRead);
router.put('/:id/read', authMiddleware.verifyToken, notificationController.markAsRead);

module.exports = router;

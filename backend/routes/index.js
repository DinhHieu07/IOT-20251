const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const deviceRoutes = require('./device.routes');
const thresholdRoutes = require('./threshold.routes');
const userRoutes = require('./user.routes');
const sensorDataRoutes = require('./sensorData.routes');
const alertRoutes = require('./alert.routes');
// const notificationRoutes = require('./notification.routes');
// const sensorRoutes = require('./sensor.routes');

// Route definitions
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/thresholds', thresholdRoutes);
router.use('/users', userRoutes);
router.use('/sensor-data', sensorDataRoutes);
router.use('/alerts', alertRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/sensors', sensorRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API routes đang hoạt động' });
});

module.exports = router;

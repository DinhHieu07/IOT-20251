const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
// const deviceRoutes = require('./device.routes');
// const sensorRoutes = require('./sensor.routes');

// Route definitions
router.use('/auth', authRoutes);
// router.use('/devices', deviceRoutes);
// router.use('/sensors', sensorRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API routes đang hoạt động' });
});

module.exports = router;

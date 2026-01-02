const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },

  type: {
    type: String,
    enum: ['MQ2', 'MQ7', 'MQ135'],
    required: true
  },

  unit: {
    type: String,
    default: 'ppm'
  },

  description: {
    type: String,
    default: ''
  }, // CO, LPG, Smoke... - Mô tả loại khí mà sensor này đo

  // Trạng thái sensor
  isActive: {
    type: Boolean,
    default: true
  },

  // Vị trí lắp đặt sensor trên device (nếu có nhiều sensor cùng loại)
  position: {
    type: String,
    default: ''
  }, // VD: "Vị trí 1", "Khu vực A"

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để query nhanh
sensorSchema.index({ deviceId: 1, type: 1 }); // Tìm sensor theo device và loại
sensorSchema.index({ deviceId: 1, isActive: 1 }); // Tìm sensor active của device

module.exports = mongoose.model('Sensor', sensorSchema);

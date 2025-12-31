const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  type: { type: String, enum: ['WARNING', 'DANGER', 'ERROR'], required: true }, // Warning: Mức 2, Danger: Mức 3
  message: { type: String }, // VD: "Nồng độ CO vượt ngưỡng mức 3!"
  sensorValues: { // Snapshot lại giá trị lúc xảy ra sự cố
    mq2: Number,
    mq7: Number,
    mq135: Number
  },
  isResolved: { type: Boolean, default: false }, // Đã xử lý xong chưa
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
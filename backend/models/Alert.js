const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  sensorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sensor', 
    required: true 
  },
  
  type: { 
    type: String, 
    enum: ['WARNING', 'DANGER', 'ERROR'], 
    required: true 
  }, // Warning: vượt ngưỡng warning, Danger: vượt ngưỡng danger
  
  message: { 
    type: String 
  }, // VD: "Nồng độ CO vượt ngưỡng mức 3!"
  
  // Giá trị cảm biến tại thời điểm xảy ra cảnh báo
  sensorValue: { 
    type: Number, 
    required: true 
  },
  
  // Ngưỡng bị vượt
  thresholdValue: {
    type: Number,
    required: true
  },
  
  isResolved: { 
    type: Boolean, 
    default: false 
  }, // Đã xử lý xong chưa
  
  resolvedAt: {
    type: Date
  },
  
  timestamp: { type: Date, default: Date.now }
});

// Index để query nhanh
alertSchema.index({ sensorId: 1, timestamp: -1 });
alertSchema.index({ isResolved: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
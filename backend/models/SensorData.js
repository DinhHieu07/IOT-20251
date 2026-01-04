const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sensor', 
    required: true 
  },
  
  // Giá trị cảm biến tại thời điểm này
  value: { 
    type: Number, 
    required: true 
  },

  // Trạng thái hệ thống tại thời điểm đó (Để biết lúc đó logic chạy đúng không)
  // Lưu ở đây để biết trạng thái tổng thể của device khi sensor này gửi dữ liệu
  systemStatus: {
    safetyLevel: { type: Number, enum: [1, 2, 3], required: true }, // 1: An toàn, 2: TB, 3: Nguy hiểm
    fan1Status: { type: Boolean, default: false }, // false: tắt, true: bật
    fan2Status: { type: Boolean, default: false }
  },

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
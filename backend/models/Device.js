const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ví dụ: "Khu vực A - Hầm B1"
  macAddress: { type: String, required: true }, // Định danh duy nhất của ESP32
  location: { type: String }, // Mô tả vị trí
  status: { 
    type: String, 
    enum: ['online', 'offline', 'maintenance'], 
    default: 'offline' 
  },
  lastSeen: { type: Date }, // Thời điểm cuối cùng ESP32 gửi dữ liệu
  // Thời gian hoạt động quạt (tính bằng milliseconds)
  fanRuntime: {
    fan1TotalMs: { type: Number, default: 0 },  // Tổng thời gian quạt 1 đã chạy
    fan2TotalMs: { type: Number, default: 0 },  // Tổng thời gian quạt 2 đã chạy
    lastUpdated: { type: Date, default: Date.now } // Thời điểm cập nhật cuối
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
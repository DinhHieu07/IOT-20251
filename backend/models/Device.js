const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ví dụ: "Khu vực A - Hầm B1"
  macAddress: { type: String, required: true, unique: true }, // Định danh duy nhất của ESP32
  location: { type: String }, // Mô tả vị trí
  status: { 
    type: String, 
    enum: ['online', 'offline', 'maintenance'], 
    default: 'offline' 
  },
  lastSeen: { type: Date }, // Thời điểm cuối cùng ESP32 gửi dữ liệu
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
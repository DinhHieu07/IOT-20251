const mongoose = require('mongoose');

const thresholdSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  // Cấu hình ngưỡng cho Mức 2 (Bật 1 quạt)
  level2: {
    mq2: { type: Number, default: 200 },
    mq7: { type: Number, default: 100 },
    mq135: { type: Number, default: 150 }
  },
  // Cấu hình ngưỡng cho Mức 3 (Bật 2 quạt)
  level3: {
    mq2: { type: Number, default: 400 },
    mq7: { type: Number, default: 200 },
    mq135: { type: Number, default: 300 }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Threshold', thresholdSchema);
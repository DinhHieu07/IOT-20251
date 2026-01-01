const mongoose = require('mongoose');

const thresholdSchema = new mongoose.Schema({
  deviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Device', 
    required: true,
    unique: true // Mỗi device chỉ có 1 bộ threshold
  },
  
  // Ngưỡng cho cảm biến MQ2
  mq2: {
    warning: { 
      type: Number, 
      required: true,
      default: 100 
    }, // Ngưỡng cảnh báo (Mức 2 - Bật 1 quạt)
    danger: { 
      type: Number, 
      required: true,
      default: 200 
    } // Ngưỡng nguy hiểm (Mức 3 - Bật 2 quạt)
  },
  
  // Ngưỡng cho cảm biến MQ7
  mq7: {
    warning: { 
      type: Number, 
      required: true,
      default: 25 
    },
    danger: { 
      type: Number, 
      required: true,
      default: 100 
    }
  },
  
  // Ngưỡng cho cảm biến MQ135
  mq135: {
    warning: { 
      type: Number, 
      required: true,
      default: 700 
    },
    danger: { 
      type: Number, 
      required: true,
      default: 1000 
    }
  },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Threshold', thresholdSchema);
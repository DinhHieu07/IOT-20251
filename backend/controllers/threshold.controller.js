const Threshold = require('../models/Threshold');
const Device = require('../models/Device');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Lấy threshold của device
 */
const getThresholdByDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  let threshold = await Threshold.findOne({ deviceId });
  
  // Nếu chưa có threshold, tạo mới với giá trị mặc định
  if (!threshold) {
    threshold = new Threshold({ deviceId });
    await threshold.save();
  }
  
  res.json({
    success: true,
    data: threshold
  });
});

/**
 * Cập nhật threshold của device
 */
const updateThreshold = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { mq2, mq7, mq135 } = req.body;
  
  // Kiểm tra device tồn tại
  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }
  
  let threshold = await Threshold.findOne({ deviceId });
  
  // Nếu chưa có, tạo mới
  if (!threshold) {
    threshold = new Threshold({ deviceId });
  }
  
  // Cập nhật ngưỡng cho từng cảm biến
  if (mq2) {
    if (mq2.warning !== undefined) threshold.mq2.warning = mq2.warning;
    if (mq2.danger !== undefined) threshold.mq2.danger = mq2.danger;
  }
  
  if (mq7) {
    if (mq7.warning !== undefined) threshold.mq7.warning = mq7.warning;
    if (mq7.danger !== undefined) threshold.mq7.danger = mq7.danger;
  }
  
  if (mq135) {
    if (mq135.warning !== undefined) threshold.mq135.warning = mq135.warning;
    if (mq135.danger !== undefined) threshold.mq135.danger = mq135.danger;
  }
  
  threshold.updatedAt = new Date();
  await threshold.save();
  
  res.json({
    success: true,
    message: 'Cập nhật ngưỡng thành công',
    data: threshold
  });
});

module.exports = {
  getThresholdByDevice,
  updateThreshold
};


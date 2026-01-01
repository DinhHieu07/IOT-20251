const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const mqttService = require('../services/mqttService');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Lấy danh sách tất cả devices
 */
const getDevices = asyncHandler(async (req, res) => {
  const devices = await Device.find().sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: devices
  });
});

/**
 * Lấy thông tin device theo ID
 */
const getDeviceById = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.id);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device không tồn tại'
    });
  }
  
  res.json({
    success: true,
    data: device
  });
});

/**
 * Điều khiển thiết bị qua MQTT
 * Params: id (device ID hoặc macAddress)
 * Body: { cmd, fan1?, fan2? }
 */
const controlDevice = asyncHandler(async (req, res) => {
  const { id } = req.params; // Device ID hoặc macAddress
  const { cmd, fan1, fan2 } = req.body;
  
  // Validation
  if (!cmd) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp cmd'
    });
  }
  
  // Tìm device theo ID hoặc macAddress
  let device = await Device.findById(id);
  if (!device) {
    device = await Device.findOne({ macAddress: id });
  }
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device không tồn tại'
    });
  }
  
  // Sử dụng macAddress làm deviceId cho MQTT
  const deviceId = device.macAddress;
  
  // Tạo command message
  let command = { cmd };
  
  if (cmd === 'fan_on') {
    if (fan1 !== undefined) command.fan1 = fan1 ? 1 : 0;
    if (fan2 !== undefined) command.fan2 = fan2 ? 1 : 0;
  }
  
  // Gửi lệnh qua MQTT
  try {
    const success = await mqttService.controlDevice(deviceId, command);
    
    if (success) {
      res.json({
        success: true,
        message: 'Đã gửi lệnh điều khiển thành công',
        data: { deviceId, command }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Không thể gửi lệnh điều khiển'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi lệnh điều khiển: ' + error.message
    });
  }
});

/**
 * Lấy dữ liệu cảm biến của device
 */
const getDeviceSensorData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 100, startDate, endDate } = req.query;
  
  // Kiểm tra device có tồn tại không
  const device = await Device.findById(id);
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device không tồn tại'
    });
  }
  
  // Tạo query
  const query = { deviceId: id };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const sensorData = await SensorData.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .populate('deviceId', 'name macAddress location');
  
  res.json({
    success: true,
    data: sensorData,
    count: sensorData.length
  });
});

/**
 * Lấy dữ liệu cảm biến mới nhất của device
 */
const getLatestSensorData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Kiểm tra device có tồn tại không
  const device = await Device.findById(id);
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device không tồn tại'
    });
  }
  
  const latestData = await SensorData.findOne({ deviceId: id })
    .sort({ timestamp: -1 })
    .populate('deviceId', 'name macAddress location');
  
  if (!latestData) {
    return res.json({
      success: true,
      message: 'Chưa có dữ liệu cảm biến',
      data: null
    });
  }
  
  res.json({
    success: true,
    data: latestData
  });
});

module.exports = {
  getDevices,
  getDeviceById,
  controlDevice,
  getDeviceSensorData,
  getLatestSensorData
};


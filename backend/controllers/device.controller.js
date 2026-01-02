const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const Threshold = require('../models/Threshold');
const SensorData = require('../models/SensorData');
const mqttService = require('../services/mqttService');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Lấy danh sách tất cả thiết bị
 */
const getAllDevices = asyncHandler(async (req, res) => {
  const devices = await Device.find().sort({ createdAt: -1 });
  
  // Populate sensors và threshold cho mỗi device
  const devicesWithDetails = await Promise.all(
    devices.map(async (device) => {
      const sensors = await Sensor.find({ deviceId: device._id });
      const threshold = await Threshold.findOne({ deviceId: device._id });
      
      // Lấy giá trị mới nhất của mỗi sensor
      const sensorsWithLatestData = await Promise.all(
        sensors.map(async (sensor) => {
          const latestData = await SensorData.findOne({ sensorId: sensor._id })
            .sort({ timestamp: -1 })
            .limit(1);
          return {
            ...sensor.toObject(),
            latestValue: latestData?.value || null,
            latestTimestamp: latestData?.timestamp || null,
          };
        })
      );
      
      return {
        ...device.toObject(),
        sensors: sensorsWithLatestData,
        threshold: threshold || null,
      };
    })
  );
  
  res.json({
    success: true,
    data: devicesWithDetails,
    count: devicesWithDetails.length
  });
});

/**
 * Lấy thông tin một thiết bị theo ID
 */
const getDeviceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const device = await Device.findById(id);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }
  
  // Populate sensors
  const sensors = await Sensor.find({ deviceId: device._id });
  
  // Populate threshold
  let threshold = await Threshold.findOne({ deviceId: device._id });
  if (!threshold) {
    // Tạo threshold mặc định nếu chưa có
    threshold = new Threshold({ deviceId: device._id });
    await threshold.save();
  }
  
  // Lấy giá trị mới nhất của mỗi sensor
  const sensorsWithLatestData = await Promise.all(
    sensors.map(async (sensor) => {
      const latestData = await SensorData.findOne({ sensorId: sensor._id })
        .sort({ timestamp: -1 })
        .limit(1);
      return {
        ...sensor.toObject(),
        latestValue: latestData?.value || null,
        latestTimestamp: latestData?.timestamp || null,
        systemStatus: latestData?.systemStatus || null,
      };
    })
  );
  
  res.json({
    success: true,
    data: {
      ...device.toObject(),
      sensors: sensorsWithLatestData,
      threshold: threshold,
    }
  });
});

/**
 * Tạo thiết bị mới
 */
const createDevice = asyncHandler(async (req, res) => {
  const { name, macAddress, location, status } = req.body;
  
  // Validation
  if (!name || !macAddress) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ tên và MAC Address'
    });
  }
  
  // Kiểm tra MAC Address đã tồn tại chưa
  const existingDevice = await Device.findOne({ macAddress });
  if (existingDevice) {
    return res.status(400).json({
      success: false,
      message: 'MAC Address đã tồn tại'
    });
  }
  
  const device = new Device({
    name,
    macAddress,
    location: location || '',
    status: status || 'offline'
  });
  
  await device.save();
  
  // Tự động tạo 3 sensors (MQ2, MQ7, MQ135) cho device mới
  const sensorTypes = [
    { type: 'MQ2', description: 'LPG, Propane, Butane, Smoke' },
    { type: 'MQ7', description: 'Carbon Monoxide (CO)' },
    { type: 'MQ135', description: 'NH3, NOx, Alcohol, Benzene, Smoke, CO2' },
  ];
  
  const sensors = await Promise.all(
    sensorTypes.map(({ type, description }) =>
      Sensor.create({
        deviceId: device._id,
        type,
        description,
        isActive: true,
      })
    )
  );
  
  // Tạo threshold mặc định cho device
  const threshold = new Threshold({ deviceId: device._id });
  await threshold.save();
  
  res.status(201).json({
    success: true,
    message: 'Tạo thiết bị thành công',
    data: {
      ...device.toObject(),
      sensors: sensors,
      threshold: threshold,
    }
  });
});

/**
 * Cập nhật thiết bị
 */
const updateDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, macAddress, location, status } = req.body;
  
  const device = await Device.findById(id);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }
  
  // Kiểm tra MAC Address nếu có thay đổi
  if (macAddress && macAddress !== device.macAddress) {
    const existingDevice = await Device.findOne({ macAddress });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'MAC Address đã tồn tại'
      });
    }
    device.macAddress = macAddress;
  }
  
  // Cập nhật các trường khác
  if (name) device.name = name;
  if (location !== undefined) device.location = location;
  if (status) device.status = status;
  
  await device.save();
  
  res.json({
    success: true,
    message: 'Cập nhật thiết bị thành công',
    data: device
  });
});

/**
 * Xóa thiết bị
 */
const deleteDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const device = await Device.findById(id);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }
  
  await Device.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Xóa thiết bị thành công'
  });
});

/**
 * Cập nhật trạng thái thiết bị (online/offline/maintenance)
 */
const updateDeviceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['online', 'offline', 'maintenance'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái không hợp lệ'
    });
  }
  
  const device = await Device.findById(id);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }
  
  device.status = status;
  if (status === 'online') {
    device.lastSeen = new Date();
  }
  
  await device.save();
  
  res.json({
    success: true,
    message: 'Cập nhật trạng thái thành công',
    data: device
  });
});

/**
 * Điều khiển thiết bị (Quạt)
 */
const controlDevice = asyncHandler(async (req, res) => {
  const { deviceId, command, fan1, fan2 } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu thông tin deviceId hoặc command'
    });
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Thiết bị không tồn tại'
    });
  }

  try {
    let result;
    switch (command) {
      case 'fan_off':
        result = await mqttService.turnOffAllFans(device.macAddress);
        break;
      case 'fan_on':
        result = await mqttService.turnOnFans(device.macAddress, fan1, fan2);
        break;
      case 'auto':
        result = await mqttService.setAutoMode(device.macAddress);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Command không hợp lệ'
        });
    }

    res.json({
      success: true,
      message: 'Gửi lệnh điều khiển thành công',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi lệnh điều khiển: ' + error.message
    });
  }
});

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceStatus,
  controlDevice
};


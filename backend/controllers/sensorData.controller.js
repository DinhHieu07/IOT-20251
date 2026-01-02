const SensorData = require('../models/SensorData');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const { asyncHandler } = require('../middleware/error.middleware');

const getSensorDataHistory = asyncHandler(async (req, res) => {
  const { deviceId, sensorId, sensorType, timeRange, limit = 100, page = 1 } = req.query;

  // Xây dựng query filter
  const filter = {};

  // Filter theo sensorId
  if (sensorId) {
    filter.sensorId = sensorId;
  }

  // Filter theo deviceId hoặc sensorType
  if (deviceId || sensorType) {
    const sensorFilter = {};
    if (deviceId) sensorFilter.deviceId = deviceId;
    if (sensorType) sensorFilter.type = sensorType;

    const sensors = await Sensor.find(sensorFilter).select('_id');
    const sensorIds = sensors.map(s => s._id);
    filter.sensorId = { $in: sensorIds };
  }

  // Filter theo thời gian
  if (timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filter.timestamp = { $gte: startDate };
    }
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Lấy dữ liệu với populate sensor và device
  const sensorData = await SensorData.find(filter)
    .populate({
      path: 'sensorId',
      select: 'type unit deviceId',
      populate: {
        path: 'deviceId',
        select: 'name macAddress location',
      },
    })
    .sort({ timestamp: -1 })
    .limit(limitNum)
    .skip(skip);

  // Đếm tổng số
  const total = await SensorData.countDocuments(filter);

  res.json({
    success: true,
    data: sensorData,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Lấy thống kê dữ liệu cảm biến
 */
const getSensorDataStats = asyncHandler(async (req, res) => {
  const { deviceId, sensorType, timeRange } = req.query;

  const filter = {};

  if (deviceId || sensorType) {
    const sensorFilter = {};
    if (deviceId) sensorFilter.deviceId = deviceId;
    if (sensorType) sensorFilter.type = sensorType;

    const sensors = await Sensor.find(sensorFilter).select('_id');
    const sensorIds = sensors.map(s => s._id);
    filter.sensorId = { $in: sensorIds };
  }

  if (timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filter.timestamp = { $gte: startDate };
    }
  }

  const stats = await SensorData.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: stats[0] || { avg: 0, min: 0, max: 0, count: 0 },
  });
});

module.exports = {
  getSensorDataHistory,
  getSensorDataStats,
};


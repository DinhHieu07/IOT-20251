const Alert = require('../models/Alert');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const { asyncHandler } = require('../middleware/error.middleware');

const getAlertHistory = asyncHandler(async (req, res) => {
  const { deviceId, sensorId, type, isResolved, timeRange, limit = 100, page = 1 } = req.query;

  // Xây dựng query filter
  const filter = {};

  // Filter theo sensorId
  if (sensorId) {
    filter.sensorId = sensorId;
  }

  // Filter theo deviceId
  if (deviceId) {
    const sensors = await Sensor.find({ deviceId }).select('_id');
    const sensorIds = sensors.map(s => s._id);
    filter.sensorId = { $in: sensorIds };
  }

  // Filter theo type
  if (type) {
    filter.type = type;
  }

  // Filter theo isResolved
  if (isResolved !== undefined) {
    filter.isResolved = isResolved === 'true';
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
  const alerts = await Alert.find(filter)
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
  const total = await Alert.countDocuments(filter);

  res.json({
    success: true,
    data: alerts,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Cập nhật trạng thái cảnh báo (đánh dấu đã xử lý)
 */
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isResolved } = req.body;

  const alert = await Alert.findByIdAndUpdate(
    id,
    {
      isResolved: isResolved,
      resolvedAt: isResolved ? new Date() : null,
    },
    { new: true }
  ).populate({
    path: 'sensorId',
    select: 'type unit deviceId',
    populate: {
      path: 'deviceId',
      select: 'name macAddress location',
    },
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy cảnh báo',
    });
  }

  res.json({
    success: true,
    data: alert,
  });
});

/**
 * Lấy thống kê cảnh báo
 */
const getAlertStats = asyncHandler(async (req, res) => {
  const { deviceId, timeRange } = req.query;

  const filter = {};

  if (deviceId) {
    const sensors = await Sensor.find({ deviceId }).select('_id');
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

  const stats = await Alert.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  const resolvedCount = await Alert.countDocuments({ ...filter, isResolved: true });
  const unresolvedCount = await Alert.countDocuments({ ...filter, isResolved: false });

  res.json({
    success: true,
    data: {
      byType: stats,
      resolved: resolvedCount,
      unresolved: unresolvedCount,
      total: resolvedCount + unresolvedCount,
    },
  });
});

module.exports = {
  getAlertHistory,
  updateAlertStatus,
  getAlertStats,
};


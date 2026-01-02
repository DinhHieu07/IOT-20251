import api from './api';

export const sensorDataService = {
  /**
   * Lấy lịch sử dữ liệu cảm biến
   * @param {Object} params - Query parameters
   * @param {string} params.deviceId - ID của device
   * @param {string} params.sensorId - ID của sensor
   * @param {string} params.sensorType - Loại sensor (MQ2, MQ7, MQ135)
   * @param {string} params.timeRange - Khoảng thời gian (24h, 7d, 30d)
   * @param {number} params.limit - Số lượng kết quả
   * @param {number} params.page - Trang hiện tại
   */
  getHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params.sensorId) queryParams.append('sensorId', params.sensorId);
    if (params.sensorType) queryParams.append('sensorType', params.sensorType);
    if (params.timeRange) queryParams.append('timeRange', params.timeRange);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/sensor-data/history?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Lấy thống kê dữ liệu cảm biến
   */
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params.sensorType) queryParams.append('sensorType', params.sensorType);
    if (params.timeRange) queryParams.append('timeRange', params.timeRange);

    const response = await api.get(`/sensor-data/stats?${queryParams.toString()}`);
    return response.data;
  },
};


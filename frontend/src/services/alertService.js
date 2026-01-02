import api from './api';

export const alertService = {
  /**
   * Lấy lịch sử cảnh báo
   * @param {Object} params - Query parameters
   * @param {string} params.deviceId - ID của device
   * @param {string} params.sensorId - ID của sensor
   * @param {string} params.type - Loại cảnh báo (WARNING, DANGER, ERROR)
   * @param {boolean} params.isResolved - Trạng thái đã xử lý
   * @param {string} params.timeRange - Khoảng thời gian (24h, 7d, 30d)
   * @param {number} params.limit - Số lượng kết quả
   * @param {number} params.page - Trang hiện tại
   */
  getHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params.sensorId) queryParams.append('sensorId', params.sensorId);
    if (params.type) queryParams.append('type', params.type);
    if (params.isResolved !== undefined) queryParams.append('isResolved', params.isResolved);
    if (params.timeRange) queryParams.append('timeRange', params.timeRange);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/alerts/history?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Cập nhật trạng thái cảnh báo
   */
  updateStatus: async (alertId, isResolved) => {
    const response = await api.patch(`/alerts/${alertId}/status`, { isResolved });
    return response.data;
  },

  /**
   * Lấy thống kê cảnh báo
   */
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params.timeRange) queryParams.append('timeRange', params.timeRange);

    const response = await api.get(`/alerts/stats?${queryParams.toString()}`);
    return response.data;
  },
};


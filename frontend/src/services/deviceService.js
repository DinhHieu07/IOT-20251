import api from './api';

export const deviceService = {
  // Lấy danh sách thiết bị
  getAll: async () => {
    const response = await api.get('/devices');
    return response.data;
  },

  // Lấy thông tin một thiết bị
  getById: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  // Tạo thiết bị mới
  create: async (deviceData) => {
    const response = await api.post('/devices', deviceData);
    return response.data;
  },

  // Cập nhật thiết bị
  update: async (id, deviceData) => {
    const response = await api.put(`/devices/${id}`, deviceData);
    return response.data;
  },

  // Cập nhật trạng thái thiết bị
  updateStatus: async (id, status) => {
    const response = await api.patch(`/devices/${id}/status`, { status });
    return response.data;
  },

  // Xóa thiết bị
  delete: async (id) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },
};

export const thresholdService = {
  // Lấy threshold của device
  getByDevice: async (deviceId) => {
    const response = await api.get(`/thresholds/device/${deviceId}`);
    return response.data;
  },

  // Cập nhật threshold
  update: async (deviceId, thresholdData) => {
    const response = await api.put(`/thresholds/device/${deviceId}`, thresholdData);
    return response.data;
  },
};


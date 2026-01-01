import api from './api';

/**
 * Lấy danh sách tất cả users
 */
export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Lấy thông tin một user theo ID
 */
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Tạo user mới
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

/**
 * Cập nhật thông tin user
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

/**
 * Cập nhật mật khẩu user
 */
export const updateUserPassword = async (id, password) => {
  const response = await api.patch(`/users/${id}/password`, { password });
  return response.data;
};

/**
 * Xóa user
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
};


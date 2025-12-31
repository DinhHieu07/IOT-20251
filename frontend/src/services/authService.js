import api from './api';
import { refreshAccessToken } from './refreshTokenService';
import { tokenStorage } from './tokenStorage';

export const authService = {
  // Đăng nhập
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    console.log(response.data);
    return response.data;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Refresh token (refreshToken trong cookie, không cần truyền)
  refreshToken: async () => {
    const response = await refreshAccessToken();
    return response;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Bỏ qua lỗi nếu không có token
    }
  },

  // Lưu access token vào memory (không dùng localStorage)
  setAccessToken: (token) => {
    tokenStorage.set(token);
  },

  // Lấy access token từ memory
  getAccessToken: () => {
    return tokenStorage.get();
  },

  // Xóa access token
  removeAccessToken: () => {
    tokenStorage.remove();
  },

  // Xóa tất cả tokens (accessToken trong memory, refreshToken trong cookie sẽ được server xóa)
  removeTokens: () => {
    tokenStorage.remove();
  },

  // Legacy methods (để tương thích)
  setToken: (token) => {
    tokenStorage.set(token);
  },

  getToken: () => {
    return tokenStorage.get();
  },

  removeToken: () => {
    tokenStorage.remove();
  },
};


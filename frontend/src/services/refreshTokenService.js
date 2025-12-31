import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Tạo axios instance riêng cho refresh token để tránh vòng lặp
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Gửi cookies (refreshToken trong cookie)
});

/**
 * Gọi API refresh token
 * RefreshToken được gửi tự động qua cookie (httpOnly)
 */
export const refreshAccessToken = async () => {
  try {
    const response = await refreshApi.post('/auth/refresh');
    return response.data;
  } catch (error) {
    throw error;
  }
};


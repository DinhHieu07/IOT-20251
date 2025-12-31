import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      // Set token vào axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      // Lấy thông tin user
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Token không hợp lệ hoặc hết hạn, thử refresh
      try {
        const refreshResponse = await authService.refreshToken();
        if (refreshResponse.success) {
          const { accessToken } = refreshResponse.data;
          authService.setAccessToken(accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          // Retry getCurrentUser
          const retryResponse = await authService.getCurrentUser();
          if (retryResponse.success) {
            setUser(retryResponse.data);
            setIsAuthenticated(true);
          }
        }
      } catch (refreshError) {
        // Refresh thất bại, xóa token
        authService.removeTokens();
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        const { accessToken, user } = response.data;
        // refreshToken được lưu trong httpOnly cookie tự động
        authService.setAccessToken(accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Bỏ qua lỗi
    } finally {
      authService.removeTokens();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


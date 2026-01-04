import axios from 'axios';
import { refreshAccessToken } from './refreshTokenService';
import { tokenStorage } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Gửi cookies với mọi request
});

// Flag để tránh nhiều request refresh cùng lúc
let isRefreshing = false;
// Queue các request đang chờ refresh token
let failedQueue = [];

// Hàm xử lý queue sau khi refresh thành công
const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Thêm access token vào header từ memory (không dùng localStorage)
        const token = tokenStorage.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        console.log("error", error);

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry ) {
            // Nếu đang refresh thì thêm request vào queue
            console.log("test 1");
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh token (refreshToken được gửi tự động qua cookie)
                const response = await refreshAccessToken();

                if (response.success) {
                    const { accessToken } = response.data;

                    // Lưu access token mới vào memory
                    tokenStorage.set(accessToken);

                    // Cập nhật header cho request ban đầu
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // Xử lý queue
                    processQueue(null, accessToken);
                    isRefreshing = false;

                    // Retry request ban đầu
                    return api(originalRequest);
                } else {
                    throw new Error('Refresh token failed');
                }
            } catch (refreshError) {
                // Refresh token thất bại, xóa token và redirect
                tokenStorage.remove();
                processQueue(refreshError, null);
                isRefreshing = false;

                // Redirect đến login nếu không phải đang ở trang login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 403 && error.response.data.message === 'Token không hợp lệ') {
            // Xóa token và redirect đến login
            tokenStorage.remove();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;


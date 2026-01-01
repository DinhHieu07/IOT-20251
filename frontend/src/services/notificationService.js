import api from './api';

// Mock data for demo purposes
let mockNotifications = [
  {
    _id: '1',
    title: 'Cảnh báo nhiệt độ cao',
    message: 'Nhiệt độ phòng server vượt quá 30°C',
    type: 'danger',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
  },
  {
    _id: '2',
    title: 'Hệ thống hoạt động bình thường',
    message: 'Đã hoàn tất kiểm tra định kỳ hệ thống',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    _id: '3',
    title: 'Cảnh báo độ ẩm',
    message: 'Độ ẩm thấp dưới mức cho phép (30%)',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
  },
  {
    _id: '4',
    title: 'Thông báo bảo trì',
    message: 'Hệ thống sẽ bảo trì vào lúc 00:00 ngày mai',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  }
];

// Helper to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const notificationService = {
  getAll: async () => {
    // Simulate API call
    await delay(500);
    return {
      success: true,
      data: [...mockNotifications]
    };
  },

  markAsRead: async (id) => {
    await delay(300);
    mockNotifications = mockNotifications.map(n => 
      n._id === id ? { ...n, isRead: true } : n
    );
    return {
      success: true,
      message: 'Notification marked as read'
    };
  },

  markAllAsRead: async () => {
    await delay(300);
    mockNotifications = mockNotifications.map(n => ({ ...n, isRead: true }));
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  }
};

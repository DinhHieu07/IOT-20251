/**
 * Middleware kiểm tra role admin
 * Yêu cầu: Phải sử dụng sau authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
  // Kiểm tra xem user đã được authenticate chưa
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Chưa xác thực. Vui lòng đăng nhập.' 
    });
  }

  // Kiểm tra role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Không có quyền truy cập. Chỉ admin mới có thể thực hiện thao tác này.' 
    });
  }

  // Role là admin, cho phép tiếp tục
  next();
};

module.exports = {
  requireAdmin
};


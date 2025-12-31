const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Đăng nhập
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ username và password'
    });
  }

  // Tìm user
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Username hoặc password không đúng'
    });
  }

  // Kiểm tra password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Username hoặc password không đúng'
    });
  }

  // Tạo Access Token (thời gian ngắn)
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  // Tạo Refresh Token (thời gian dài)
  const refreshToken = jwt.sign(
    { 
      userId: user._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Lưu refreshToken vào database
  user.refreshToken = refreshToken;
  await user.save();

  // Set refreshToken vào httpOnly cookie (chống XSS)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // Không cho JavaScript truy cập (chống XSS)
    secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS trong production
    sameSite: 'strict', // Chống CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    path: '/api/auth', // Chỉ gửi cookie cho auth routes
  });

  // Trả về accessToken (không trả refreshToken trong body)
  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: {
      accessToken, // Chỉ trả về accessToken
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar
      }
    }
  });
});

/**
 * Refresh Token - Lấy access token mới
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Lấy refreshToken từ cookie thay vì body
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token không được cung cấp'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    );

    // Tìm user và kiểm tra refreshToken
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      // Xóa cookie nếu token không hợp lệ
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Xóa refreshToken nếu đã hết hạn
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshToken: 1 } });
      }
    }
    // Xóa cookie nếu có lỗi
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn'
    });
  }
});

/**
 * Lấy thông tin user hiện tại
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password -refreshToken');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User không tồn tại'
    });
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar
    }
  });
});

/**
 * Đăng xuất - Xóa refreshToken
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const refreshToken = req.cookies.refreshToken;
  
  if (userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  // Xóa refreshToken cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });

  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

module.exports = {
  login,
  refreshToken,
  getCurrentUser,
  logout
};


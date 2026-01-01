const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Lấy danh sách tất cả users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users
  });
});

/**
 * Lấy thông tin một user theo ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password -refreshToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * Tạo user mới
 */
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ username, email và password'
    });
  }

  // Kiểm tra username đã tồn tại
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      message: 'Username đã tồn tại'
    });
  }

  // Kiểm tra email đã tồn tại
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: 'Email đã tồn tại'
    });
  }

  // Validate role
  const validRoles = ['admin', 'viewer'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role không hợp lệ. Chỉ chấp nhận: admin, viewer'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user mới
  const user = new User({
    username,
    email,
    password: hashedPassword,
    fullName: fullName || '',
    role: role || 'viewer'
  });

  await user.save();

  // Trả về user (không có password và refreshToken)
  const userResponse = await User.findById(user._id).select('-password -refreshToken');

  res.status(201).json({
    success: true,
    message: 'Tạo tài khoản thành công',
    data: userResponse
  });
});

/**
 * Cập nhật thông tin user
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, fullName, role } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại'
    });
  }

  // Không cho phép cập nhật chính mình (tránh lockout)
  if (user._id.toString() === req.user.userId) {
    return res.status(400).json({
      success: false,
      message: 'Bạn không thể chỉnh sửa tài khoản của chính mình'
    });
  }

  // Kiểm tra username đã tồn tại (nếu thay đổi)
  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username đã tồn tại'
      });
    }
    user.username = username;
  }

  // Kiểm tra email đã tồn tại (nếu thay đổi)
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }
    user.email = email;
  }

  // Cập nhật fullName
  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  // Cập nhật role
  if (role) {
    const validRoles = ['admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ. Chỉ chấp nhận: admin, viewer'
      });
    }
    user.role = role;
  }

  await user.save();

  // Trả về user đã cập nhật (không có password và refreshToken)
  const userResponse = await User.findById(user._id).select('-password -refreshToken');

  res.json({
    success: true,
    message: 'Cập nhật thông tin thành công',
    data: userResponse
  });
});

/**
 * Cập nhật mật khẩu user
 */
const updateUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    });
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại'
    });
  }

  // Không cho phép cập nhật mật khẩu chính mình (tránh lockout)
  if (user._id.toString() === req.user.userId) {
    return res.status(400).json({
      success: false,
      message: 'Bạn không thể đổi mật khẩu của chính mình từ đây. Vui lòng sử dụng chức năng đổi mật khẩu.'
    });
  }

  // Hash password mới
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;

  await user.save();

  res.json({
    success: true,
    message: 'Cập nhật mật khẩu thành công'
  });
});

/**
 * Xóa user
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại'
    });
  }

  // Không cho phép xóa chính mình
  if (user._id.toString() === req.user.userId) {
    return res.status(400).json({
      success: false,
      message: 'Bạn không thể xóa tài khoản của chính mình'
    });
  }

  await User.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Xóa tài khoản thành công'
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
};


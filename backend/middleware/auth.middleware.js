const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token không được cung cấp' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'my-secret-key', (err, user) => {
    if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token đã hết hạn' });
        }
  
        return res.status(403).json({ message: 'Token không hợp lệ' });
      }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};

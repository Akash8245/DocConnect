const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
exports.verifyToken = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'docconnect_jwt_secret_123456789';
      const decoded = jwt.verify(token, jwtSecret);

      // Set user in request
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware for role-based access control
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user role is included in the authorized roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          message: `User role ${user.role} is not authorized to access this route`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };
}; 
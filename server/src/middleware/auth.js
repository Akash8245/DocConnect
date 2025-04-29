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

      // Attach full user info to the request
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set complete user object in request
      req.user = user;
      
      // Also add id property for legacy code
      req.user.id = user._id.toString();
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware for role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // If no user or role in req.user (should have been set by verifyToken)
      if (!req.user || !req.user.role) {
        console.error('User or role missing in request:', req.user);
        return res.status(401).json({ message: 'Unauthorized - missing user data' });
      }

      // Check if user role is included in the authorized roles
      if (!roles.includes(req.user.role)) {
        console.error(`Role mismatch: user has ${req.user.role}, required ${roles.join(' or ')}`);
        return res.status(403).json({
          message: `User role ${req.user.role} is not authorized to access this route`
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}; 
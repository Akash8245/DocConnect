const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'docconnect_jwt_secret_123456789';
      const decoded = jwt.verify(token, jwtSecret);
      
      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user has a specific role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize }; 
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'docconnect_jwt_secret_123456789';
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (patient or doctor)
// @route   POST /api/auth/signup/:role
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Check if role is valid
    if (role !== 'patient' && role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const { name, email, password, specialization } = req.body;
    
    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if doctor has specialization
    if (role === 'doctor' && !specialization) {
      return res.status(400).json({ message: 'Specialization is required for doctors' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      ...(role === 'doctor' && { specialization })
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data and token
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged in user
// @route   GET /api/auth/user
// @access  Private
exports.getUser = async (req, res) => {
  try {
    // User is attached to req by authMiddleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 
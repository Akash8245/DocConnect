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
    
    if (role !== 'patient' && role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const { name, email, password, specialization } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    if (role === 'doctor' && !specialization) {
      return res.status(400).json({ message: 'Specialization is required for doctors' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role,
      ...(role === 'doctor' && { specialization })
    });
    
    const token = generateToken(user._id);
    
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
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const user = await User.findOne({ email }).select('+password').orFail(new Error('User not found'));
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id);
    
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
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get logged in user
// @route   GET /api/auth/user
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      address: user.address || '',
      about: user.about || ''
    };
    
    if (user.role === 'patient') {
      responseUser.emergencyContact = user.emergencyContact || '';
      responseUser.medicalHistory = user.medicalHistory || '';
      responseUser.allergies = user.allergies || '';
      responseUser.currentMedications = user.currentMedications || '';
    } else if (user.role === 'doctor') {
      responseUser.specialization = user.specialization || '';
      responseUser.qualifications = user.qualifications || '';
      responseUser.experience = user.experience || '';
      responseUser.licenses = user.licenses || '';
      responseUser.languages = user.languages || '';
      responseUser.consultationFees = user.consultationFees || '';
      responseUser.hospitals = user.hospitals || '';
      responseUser.awards = user.awards || '';
    }
    
    res.json(responseUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.dateOfBirth !== undefined) user.dateOfBirth = req.body.dateOfBirth;
    if (req.body.gender !== undefined) user.gender = req.body.gender;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.about !== undefined) user.about = req.body.about;
    
    if (user.role === 'patient') {
      if (req.body.emergencyContact !== undefined) user.emergencyContact = req.body.emergencyContact;
      if (req.body.medicalHistory !== undefined) user.medicalHistory = req.body.medicalHistory;
      if (req.body.allergies !== undefined) user.allergies = req.body.allergies;
      if (req.body.currentMedications !== undefined) user.currentMedications = req.body.currentMedications;
    }
    
    if (user.role === 'doctor') {
      if (req.body.specialization) user.specialization = req.body.specialization;
      if (req.body.qualifications !== undefined) user.qualifications = req.body.qualifications;
      if (req.body.experience !== undefined) user.experience = req.body.experience;
      if (req.body.licenses !== undefined) user.licenses = req.body.licenses;
      if (req.body.languages !== undefined) user.languages = req.body.languages;
      if (req.body.consultationFees !== undefined) user.consultationFees = req.body.consultationFees;
      if (req.body.hospitals !== undefined) user.hospitals = req.body.hospitals;
      if (req.body.awards !== undefined) user.awards = req.body.awards;
    }
    
    await user.save();
    
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      address: user.address || '',
      about: user.about || ''
    };
    
    if (user.role === 'patient') {
      responseUser.emergencyContact = user.emergencyContact || '';
      responseUser.medicalHistory = user.medicalHistory || '';
      responseUser.allergies = user.allergies || '';
      responseUser.currentMedications = user.currentMedications || '';
    } else if (user.role === 'doctor') {
      responseUser.specialization = user.specialization || '';
      responseUser.qualifications = user.qualifications || '';
      responseUser.experience = user.experience || '';
      responseUser.licenses = user.licenses || '';
      responseUser.languages = user.languages || '';
      responseUser.consultationFees = user.consultationFees || '';
      responseUser.hospitals = user.hospitals || '';
      responseUser.awards = user.awards || '';
    }
    
    res.json(responseUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

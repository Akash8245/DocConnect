const express = require('express');
const { signup, login, getUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Register a new user (patient or doctor)
router.post('/signup/:role', signup);

// Login user
router.post('/login', login);

// Get logged in user (protected route)
router.get('/user', protect, getUser);

// Verify token
router.get('/verify', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      specialization: req.user.specialization,
      profilePicture: req.user.profilePicture
    }
  });
});

module.exports = router; 
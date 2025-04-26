const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    required: [true, 'Role is required']
  },
  specialization: {
    type: String,
    required: function() {
      return this.role === 'doctor';
    }
  },
  profilePicture: {
    type: String,
    default: function() {
      return this.role === 'doctor' 
        ? 'https://randomuser.me/api/portraits/men/42.jpg' 
        : 'https://randomuser.me/api/portraits/women/32.jpg';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  about: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to check if password is correct
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 
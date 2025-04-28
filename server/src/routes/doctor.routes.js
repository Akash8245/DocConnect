const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Availability = require('../models/Availability');
const { verifyToken, authorize } = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get query parameters
    const { specialization } = req.query;
    
    // Build filter
    const filter = { role: 'doctor' };
    if (specialization) {
      filter.specialization = specialization;
    }
    
    // Find doctors
    const doctors = await User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      role: 'doctor'
    }).select('-__v');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/doctors/:id/availability
// @desc    Get doctor's availability
// @access  Public
router.get('/:id/availability', async (req, res) => {
  try {
    // Get query parameters
    const { startDate, endDate } = req.query;
    
    // Build filter
    const filter = { doctor: req.params.id };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }
    
    // Find availability
    const availability = await Availability.find(filter)
      .sort({ date: 1 })
      .select('-__v');
    
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/doctors/availability
// @desc    Set doctor's availability
// @access  Private/Doctor
router.post('/availability', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const { date, slots } = req.body;
    
    // Validate input
    if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Date and slots are required' });
    }
    
    // Create or update availability
    const availability = await Availability.findOneAndUpdate(
      { doctor: req.user.id, date: new Date(date) },
      { doctor: req.user.id, date: new Date(date), slots },
      { new: true, upsert: true }
    );
    
    res.status(201).json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/doctors/availability/:id
// @desc    Delete doctor's availability
// @access  Private/Doctor
router.delete('/availability/:id', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const availability = await Availability.findOne({
      _id: req.params.id,
      doctor: req.user.id
    });
    
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    
    await availability.remove();
    
    res.json({ message: 'Availability removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
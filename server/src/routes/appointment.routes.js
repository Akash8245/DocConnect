const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const User = require('../models/User');
const { verifyToken, authorize } = require('../middleware/auth');

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Determine field to query based on user role
    const queryField = user.role === 'doctor' ? 'doctor' : 'patient';
    
    // Get query parameters
    const { status } = req.query;
    
    // Build filter
    const filter = { [queryField]: req.user.id };
    if (status) {
      filter.status = status;
    }
    
    // Find appointments
    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization profilePicture')
      .populate('patient', 'name profilePicture')
      .sort({ date: 1, startTime: 1 })
      .select('-__v');
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization profilePicture')
      .populate('patient', 'name profilePicture')
      .select('-__v');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user has access to this appointment
    if (
      appointment.doctor._id.toString() !== req.user.id &&
      appointment.patient._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to access this appointment' });
    }
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/appointments/book
// @desc    Book an appointment
// @access  Private/Patient
router.post('/book', verifyToken, authorize('patient'), async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, notes } = req.body;
    
    // Validate input
    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Doctor, date, start time, and end time are required' });
    }
    
    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if slot is available
    const availability = await Availability.findOne({
      doctor: doctorId,
      date: new Date(date),
      'slots.startTime': startTime,
      'slots.endTime': endTime,
      'slots.isBooked': false
    });
    
    if (!availability) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      doctor: doctorId,
      patient: req.user.id,
      date: new Date(date),
      startTime,
      endTime,
      notes,
      status: 'pending',
      paymentStatus: 'completed', // For demo purposes, set to completed
      paymentAmount: 50.00 // Fixed amount for demo
    });
    
    await appointment.save();
    
    // Update availability slot to booked
    await Availability.updateOne(
      {
        doctor: doctorId,
        date: new Date(date),
        'slots.startTime': startTime,
        'slots.endTime': endTime
      },
      {
        $set: { 'slots.$.isBooked': true }
      }
    );
    
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/accept
// @desc    Accept an appointment
// @access  Private/Doctor
router.put('/:id/accept', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id,
      status: 'pending'
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Pending appointment not found' });
    }
    
    appointment.status = 'confirmed';
    await appointment.save();
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/decline
// @desc    Decline an appointment
// @access  Private/Doctor
router.put('/:id/decline', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id,
      status: 'pending'
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Pending appointment not found' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    // Update availability slot to available
    await Availability.updateOne(
      {
        doctor: req.user.id,
        date: appointment.date,
        'slots.startTime': appointment.startTime,
        'slots.endTime': appointment.endTime
      },
      {
        $set: { 'slots.$.isBooked': false }
      }
    );
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private/Patient
router.put('/:id/cancel', verifyToken, authorize('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Active appointment not found' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    // Update availability slot to available
    await Availability.updateOne(
      {
        doctor: appointment.doctor,
        date: appointment.date,
        'slots.startTime': appointment.startTime,
        'slots.endTime': appointment.endTime
      },
      {
        $set: { 'slots.$.isBooked': false }
      }
    );
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed
// @access  Private/Doctor
router.put('/:id/complete', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id,
      status: 'confirmed'
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Confirmed appointment not found' });
    }
    
    appointment.status = 'completed';
    await appointment.save();
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/video-call/:appointmentId
// @desc    Get appointment details for video call
// @access  Private
router.get('/:appointmentId', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
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
      return res.status(403).json({ message: 'Not authorized to access this video call' });
    }
    
    // Check if appointment is confirmed
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Appointment is not confirmed' });
    }
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/video-call/token
// @desc    Generate token for video call (placeholder for real implementation)
// @access  Private
router.post('/token', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user has access to this appointment
    if (
      appointment.doctor.toString() !== req.user.id &&
      appointment.patient.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to access this video call' });
    }
    
    // In a real implementation, you would generate a token for a video platform
    // or handle WebRTC signaling here
    
    // For demo purposes, we'll just return a mock token
    const mockToken = {
      token: 'mock_video_token_' + Date.now(),
      roomName: 'appointment_' + appointmentId,
      userId: req.user.id,
      expiresIn: 3600 // 1 hour
    };
    
    res.json(mockToken);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
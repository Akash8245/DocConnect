const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, authorize } = require('../middleware/auth');

// Models
const User = require('../models/User');
const Prescription = require('../models/Prescription');

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log('Prescription API request:', {
    method: req.method,
    path: req.path,
    user: req.user || 'unauthenticated'
  });
  next();
});

// @route   POST /api/prescriptions/request
// @desc    Request a prescription from a doctor
// @access  Private/Patient
router.post('/request', verifyToken, authorize('patient'), async (req, res) => {
  try {
    console.log('Prescription request body:', req.body);
    console.log('User making request:', req.user);
    
    const { doctorId, symptoms } = req.body;
    
    // Validate input
    if (!doctorId || !symptoms) {
      return res.status(400).json({ message: 'Doctor and symptoms are required' });
    }
    
    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Create prescription request
    const prescription = new Prescription({
      doctor: doctorId,
      patient: req.user._id,
      symptoms,
      status: 'pending',
      paymentStatus: 'pending', // Will be updated when payment is made
    });
    
    await prescription.save();
    
    res.status(201).json(prescription);
  } catch (err) {
    console.error('Error in prescription request:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/prescriptions
// @desc    Get user's prescriptions (all for doctor, only own for patient)
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    let prescriptions;
    
    if (req.user.role === 'doctor') {
      // Doctors see all prescriptions assigned to them
      prescriptions = await Prescription.find({ doctor: req.user._id })
        .populate('patient', 'name email profilePicture')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'patient') {
      // Patients see only their own prescriptions
      prescriptions = await Prescription.find({ patient: req.user._id })
        .populate('doctor', 'name specialization profilePicture')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(prescriptions);
  } catch (err) {
    console.error('Error getting prescriptions:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get a specific prescription
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Fetching prescription with ID:', req.params.id);
    
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor', 'name specialization profilePicture')
      .populate('patient', 'name email profilePicture');
    
    if (!prescription) {
      console.log('Prescription not found');
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Debug logs to check user and prescription IDs
    console.log('User ID (req.user._id):', req.user._id);
    console.log('User ID as string (req.user._id.toString()):', req.user._id.toString());
    console.log('User ID (req.user.id):', req.user.id);
    console.log('User role:', req.user.role);
    console.log('Prescription doctor ID:', prescription.doctor._id);
    console.log('Prescription doctor ID (toString):', prescription.doctor._id.toString());
    console.log('Prescription patient ID:', prescription.patient._id);
    console.log('Prescription patient ID (toString):', prescription.patient._id.toString());
    
    // Verify user has permission to access this prescription
    if (
      req.user._id.toString() !== prescription.doctor._id.toString() && 
      req.user._id.toString() !== prescription.patient._id.toString() &&
      req.user.role !== 'admin'
    ) {
      console.log('User not authorized to access this prescription');
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    console.log('User authorized, returning prescription data');
    res.json(prescription);
  } catch (err) {
    console.error('Error in GET prescription by ID:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/prescriptions/:id/pay
// @desc    Update a prescription payment status to completed
// @access  Private/Patient
router.put('/:id/pay', verifyToken, authorize('patient'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Verify patient owns this prescription
    if (req.user._id.toString() !== prescription.patient.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update payment status
    prescription.paymentStatus = 'completed';
    await prescription.save();
    
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/prescriptions/:id/accept
// @desc    Doctor accepts a prescription request
// @access  Private/Doctor
router.put('/:id/accept', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Verify doctor owns this prescription
    if (req.user._id.toString() !== prescription.doctor.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update status
    prescription.status = 'accepted';
    await prescription.save();
    
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/prescriptions/:id/reject
// @desc    Doctor rejects a prescription request
// @access  Private/Doctor
router.put('/:id/reject', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Verify doctor owns this prescription
    if (req.user._id.toString() !== prescription.doctor.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update status
    prescription.status = 'rejected';
    await prescription.save();
    
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/prescriptions/:id
// @desc    Complete a prescription by adding diagnosis and medications
// @access  Private/Doctor
router.put('/:id', verifyToken, authorize('doctor'), async (req, res) => {
  try {
    const { diagnosis, medications, additionalNotes } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Verify doctor owns this prescription
    if (req.user._id.toString() !== prescription.doctor.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Check if prescription has been paid for
    if (prescription.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Prescription has not been paid for yet' });
    }
    
    // Update prescription details
    prescription.diagnosis = diagnosis;
    prescription.medications = medications;
    prescription.additionalNotes = additionalNotes;
    prescription.status = 'completed';
    
    await prescription.save();
    
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
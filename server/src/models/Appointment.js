const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking for the same doctor in the same time slot
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1, endTime: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['pending', 'confirmed'] } 
    }
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 
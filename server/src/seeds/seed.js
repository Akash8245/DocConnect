const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/docconnect')
  .then(() => console.log('MongoDB Connected for seeding'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Sample data
const users = [
  {
    name: 'Dr. Jane Smith',
    email: 'doctor@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Cardiology',
    profilePicture: 'https://randomuser.me/api/portraits/women/76.jpg',
    about: 'Experienced cardiologist with 15+ years of practice in heart disease management and prevention.'
  },
  {
    name: 'John Doe',
    email: 'patient@example.com',
    password: 'password',
    role: 'patient',
    profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Dr. Michael Johnson',
    email: 'michael@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Dermatology',
    profilePicture: 'https://randomuser.me/api/portraits/men/45.jpg',
    about: 'Board-certified dermatologist specializing in skin cancer detection and treatment.'
  },
  {
    name: 'Dr. Sarah Williams',
    email: 'sarah@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Neurology',
    profilePicture: 'https://randomuser.me/api/portraits/women/90.jpg',
    about: 'Neurologist focusing on headache disorders, stroke prevention, and neurodegenerative diseases.'
  },
];

// Seed function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Availability.deleteMany();
    await Appointment.deleteMany();
    
    console.log('Previous data cleared');
    
    // Create users
    const createdUsers = [];
    for (const user of users) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      
      createdUsers.push(newUser);
      console.log(`Created user: ${user.name}`);
    }
    
    // Create availability for doctors
    const doctors = createdUsers.filter(user => user.role === 'doctor');
    const patients = createdUsers.filter(user => user.role === 'patient');
    
    // Generate dates for the next 7 days
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    // Create availability for each doctor
    for (const doctor of doctors) {
      for (const date of dates) {
        const slots = [
          { startTime: '09:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '13:00', isBooked: false },
          { startTime: '14:00', endTime: '16:00', isBooked: false },
          { startTime: '16:00', endTime: '18:00', isBooked: false }
        ];
        
        await Availability.create({
          doctor: doctor._id,
          date,
          slots
        });
        
        console.log(`Created availability for ${doctor.name} on ${date.toDateString()}`);
      }
    }
    
    // Create a sample appointment
    const patient = patients[0];
    const doctor = doctors[0];
    const appointmentDate = new Date();
    appointmentDate.setDate(today.getDate() + 2);
    
    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient._id,
      date: appointmentDate,
      startTime: '11:00',
      endTime: '13:00',
      status: 'confirmed',
      notes: 'Regular checkup',
      paymentStatus: 'completed',
      paymentAmount: 50.00
    });
    
    // Mark the slot as booked
    await Availability.updateOne(
      {
        doctor: doctor._id,
        date: appointmentDate,
        'slots.startTime': '11:00',
        'slots.endTime': '13:00'
      },
      {
        $set: { 'slots.$.isBooked': true }
      }
    );
    
    console.log(`Created appointment for ${patient.name} with ${doctor.name}`);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run seeding
seedData(); 
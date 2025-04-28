const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const videoCallRoutes = require('./routes/videoCall.routes');
const aiRoutes = require('./routes/ai.routes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins while in development
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));

// Debug middleware for auth requests
app.use('/api/auth', (req, res, next) => {
  console.log('Auth request headers:', req.headers);
  next();
});

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docconnect';
console.log('Attempting to connect to MongoDB at:', mongoURI);

// Set a timeout for MongoDB connection to avoid hanging
const connectWithTimeout = () => {
  const connectionPromise = mongoose.connect(mongoURI);
  
  // Set a timeout of 5 seconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('MongoDB connection timeout - continuing without database'));
    }, 5000);
  });
  
  // Race the connection against the timeout
  return Promise.race([connectionPromise, timeoutPromise]);
};

// Attempt connection with timeout
connectWithTimeout()
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Using in-memory data storage as fallback. Note: Data will not persist between restarts.');
    console.log('The AI features will still work without the database.');
  });

// Basic route
app.get('/', (req, res) => {
  res.send('DocConnect API is running...');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/video-call', videoCallRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io for WebRTC signaling
require('./socket')(io);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access on local network at http://0.0.0.0:${PORT}`);
  console.log(`For other devices, use the machine's IP address`);
});

module.exports = { app, server };
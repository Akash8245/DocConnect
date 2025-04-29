const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Import routes
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const aiRoutes = require('./routes/ai.routes');

// Debug middleware for auth requests
app.use('/api/auth', (req, res, next) => {
  console.log('Auth request headers:', req.headers);
  next();
});

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docconnect';
console.log('Attempting to connect to MongoDB at:', mongoURI);

const connectWithTimeout = () => {
  const connectionPromise = mongoose.connect(mongoURI);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('MongoDB connection timeout - continuing without database'));
    }, 5000);
  });
  return Promise.race([connectionPromise, timeoutPromise]);
};

connectWithTimeout()
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Using in-memory data storage as fallback. Note: Data will not persist between restarts.');
  });

// Basic route
app.get('/', (req, res) => {
  res.send('DocConnect API is running...');
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

// --------- VC Route (Frontend page) ---------
app.get('/vc', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vc.html')); // Ensure you have the vc.html file in the public directory
});

// --------- Socket.IO for Video Call ---------
io.on('connection', socket => {
  console.log('New client connected:', socket.id);

  // When a user joins a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('user-joined', socket.id);

    // Handle relay of WebRTC signals (offer/answer/candidate)
    socket.on('signal', ({ to, data }) => {
      io.to(to).emit('signal', { from: socket.id, data });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });

  // Handle signaling messages (offer/answer/candidate)
  socket.on('offer', (to, description) => {
    socket.to(to).emit('offer', socket.id, description);
  });

  socket.on('answer', (to, description) => {
    socket.to(to).emit('answer', socket.id, description);
  });

  socket.on('candidate', (to, candidate) => {
    socket.to(to).emit('candidate', socket.id, candidate);
  });
});

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
});

module.exports = { app, server };

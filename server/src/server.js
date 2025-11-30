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
// Socket.io CORS configuration
const socketOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

if (process.env.VERCEL_URL) {
  socketOrigins.push(`https://${process.env.VERCEL_URL}`);
}

if (process.env.FRONTEND_URL) {
  socketOrigins.push(process.env.FRONTEND_URL);
}

// Add known Vercel frontend
socketOrigins.push('https://doc-connect-24.vercel.app');

const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? socketOrigins : "*",
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());

// CORS configuration - allow frontend origins from environment or default to localhost
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

// Add Vercel frontend URL if provided
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// Also allow common Vercel patterns and specific known frontend URLs
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Allow common Vercel domain patterns
allowedOrigins.push('https://doc-connect-24.vercel.app');
allowedOrigins.push('https://*.vercel.app');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns like *.vercel.app
        const pattern = allowed.replace('*', '');
        return origin.includes(pattern);
      }
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Check if it's a vercel.app domain (for production flexibility)
      if (origin.includes('vercel.app')) {
        console.log('Allowing Vercel origin:', origin);
        return callback(null, true);
      }
      
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware for auth requests
app.use('/api/auth', (req, res, next) => {
  console.log('Auth request headers:', req.headers);
  next();
});

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docconnect';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
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
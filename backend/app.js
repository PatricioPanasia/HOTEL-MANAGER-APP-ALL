const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes and controllers
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const { getNoteStats } = require('./src/controllers/noteController');
const { getCurrentStatus } = require('./src/controllers/attendanceController');
const reportRoutes = require('./src/routes/reportRoutes');

// Auth middleware
const { authenticateToken } = require('./src/middleware/authMiddleware');

const app = express();

// Detect if running on Vercel (no /api prefix needed) or local (needs /api prefix)
const isVercel = process.env.VERCEL === '1';
const apiPrefix = isVercel ? '' : '/api';

// CORS configuration (allow frontend + local dev)
const allowedOrigins = [
  'https://hotel-manager-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware (CORS MUST come before anything that can send a response)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use(`${apiPrefix}/auth`, authRoutes);

// Protected routes
app.use(`${apiPrefix}/users`, authenticateToken, userRoutes);
app.use(`${apiPrefix}/tasks`, authenticateToken, taskRoutes);
app.get(`${apiPrefix}/notes/stats`, authenticateToken, getNoteStats);
app.get(`${apiPrefix}/attendance/status`, authenticateToken, getCurrentStatus);
app.use(`${apiPrefix}/notes`, authenticateToken, noteRoutes);
app.use(`${apiPrefix}/attendance`, authenticateToken, attendanceRoutes);
app.use(`${apiPrefix}/reports`, authenticateToken, reportRoutes);

// Health
app.get(`${apiPrefix}/health`, (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hotel Manager API is running',
    timestamp: new Date().toISOString(),
    environment: isVercel ? 'vercel' : 'local',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;

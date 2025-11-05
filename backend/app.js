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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.get('/api/notes/stats', authenticateToken, getNoteStats);
app.get('/api/attendance/status', authenticateToken, getCurrentStatus);
app.use('/api/notes', authenticateToken, noteRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hotel Manager API is running',
    timestamp: new Date().toISOString(),
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

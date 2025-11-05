const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Registro (con autenticación opcional para permitir auto-registro del admin)
router.post('/register', 
  optionalAuth,
  [
    body('nombre').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  AuthController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  AuthController.login
);

// Google Sign-In
router.post('/google-signin', AuthController.googleSignIn);

// Refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Logout
router.post('/logout', authenticateToken, AuthController.logout);

// Cambiar contraseña
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  AuthController.changePassword
);

module.exports = router;
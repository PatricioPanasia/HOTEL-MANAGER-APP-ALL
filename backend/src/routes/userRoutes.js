const express = require('express');
const { body, param } = require('express-validator');
const UserController = require('../controllers/userController');
const { authorizeRoles, authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin y supervisor pueden gestionar usuarios
router.get('/', authenticateToken, authorizeRoles('admin', 'supervisor'), UserController.getAllUsers);
router.post('/', authenticateToken, authorizeRoles('admin', 'supervisor'), UserController.createUser);

// Rutas de estadísticas de usuario
router.get('/:id/stats', authenticateToken, authorizeRoles('admin', 'supervisor'), UserController.getUserStats);

// Rutas específicas de usuario (perfil)
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);

// Rutas de gestión por ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'supervisor'),
  [param('id').isInt().withMessage('Invalid user ID')],
  UserController.getUserById
);

router.put('/:id', 
  authenticateToken,
  authorizeRoles('admin', 'supervisor'),
  [param('id').isInt().withMessage('Invalid user ID')],
  UserController.updateUser
);

router.delete('/:id', 
  authenticateToken,
  authorizeRoles('admin', 'supervisor'),
  [param('id').isInt().withMessage('Invalid user ID')],
  UserController.deleteUser
);

module.exports = router;
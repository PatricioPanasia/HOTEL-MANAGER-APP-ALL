const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const UserController = {
  // Obtener todos los usuarios (solo admin)
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', activo = 'true' } = req.query;
      const offset = (page - 1) * limit;

      // Allow fetching active, inactive or all users via `activo` query param
      // activo = 'true' (default) => only active users
      // activo = 'false' => only inactive users
      // activo = 'all' => all users
      const whereConditions = [];
      const queryParams = [];

      if (activo === 'true') {
        whereConditions.push('activo = TRUE');
      } else if (activo === 'false') {
        whereConditions.push('activo = FALSE');
      }

      if (search) {
        whereConditions.push('(nombre LIKE ? OR email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const users = await query(
        `SELECT id, nombre, email, rol, activo, fecha_creacion 
         FROM usuarios 
         ${whereClause}
         ORDER BY fecha_creacion DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM usuarios ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  },

  // Obtener usuario por ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const users = await query(
        `SELECT id, nombre, email, rol, activo, fecha_creacion 
         FROM usuarios WHERE id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user'
      });
    }
  },

  // Crear nuevo usuario (solo admin)
  createUser: async (req, res) => {
    try {
      const { nombre, email, password, rol } = req.body;

      // Validaciones
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email and password are required'
        });
      }

      // Verificar si el email ya existe
      const existingUser = await query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const result = await query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, rol || 'recepcionista']
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: result.insertId,
          nombre,
          email,
          rol: rol || 'recepcionista'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user'
      });
    }
  },

  // Actualizar usuario
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, rol, activo } = req.body;

      // Verificar que el usuario existe
      const existingUser = await query(
        'SELECT id FROM usuarios WHERE id = ?',
        [id]
      );

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Actualizar usuario
      await query(
        'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre, email, rol, activo, id]
      );

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  },

  // Eliminar usuario (soft delete)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // No permitir auto-eliminación
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      await query(
        'UPDATE usuarios SET activo = FALSE WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  },

  // Obtener perfil del usuario actual
  getProfile: async (req, res) => {
    try {
      const user = await query(
        `SELECT id, nombre, email, rol, activo, fecha_creacion 
         FROM usuarios WHERE id = ?`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: user[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching profile'
      });
    }
  },

  // Actualizar perfil del usuario actual
  updateProfile: async (req, res) => {
    try {
      const { nombre, email } = req.body;

      await query(
        'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
        [nombre, email, req.user.id]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  },

  getUserStats: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Obtener estadísticas de tareas
      const taskStatsQuery = query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
          SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas
         FROM tareas 
         WHERE usuario_asignado = ?`,
        [id]
      );

      // 2. Obtener historial de asistencia (últimos 30 días)
      const attendanceHistoryQuery = query(
        `SELECT fecha, hora_entrada, hora_salida, tipo, ubicacion 
         FROM asistencias 
         WHERE usuario_id = ? 
         ORDER BY fecha DESC
         LIMIT 30`,
        [id]
      );

      const [[taskStats], attendanceHistory] = await Promise.all([
        taskStatsQuery,
        attendanceHistoryQuery,
      ]);

      res.json({
        success: true,
        data: {
          taskStats,
          attendanceHistory,
        },
      });
    } catch (error) {
      console.error(`Error fetching stats for user ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
      });
    }
  },
};

module.exports = UserController;
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const UserController = {
  // Obtener todos los usuarios (solo admin)
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', activo = 'true' } = req.query;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      // Filter by activo
      if (activo === 'true') {
        query = query.eq('activo', true);
      } else if (activo === 'false') {
        query = query.eq('activo', false);
      }

      // Search filter
      if (search) {
        query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: users, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('[userController.getAllUsers] Error:', error);
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

      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[userController.getUserById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user'
      });
    }
  },

  // Crear nuevo usuario (solo admin) - Note: with Supabase Auth, user creation is handled differently
  // This endpoint can update a profile after Supabase Auth creates the user
  createUser: async (req, res) => {
    try {
      const { nombre, email, rol } = req.body;

      // Validations
      if (!nombre || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required'
        });
      }

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Note: In Supabase, user creation is done via Auth.
      // This is a simplified version that assumes Auth already created the user.
      // You might want to use Supabase Admin API to create auth users if needed.

      res.status(400).json({
        success: false,
        message: 'User creation must be done via Supabase Auth + Google OAuth. Use update endpoint to modify profiles.'
      });
    } catch (error) {
      console.error('[userController.createUser] Error:', error);
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

      // Check if user exists
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Build update object
      const updates = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (email !== undefined) updates.email = email;
      if (rol !== undefined) updates.rol = rol;
      if (activo !== undefined) updates.activo = activo;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('[userController.updateUser] Error:', error);
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
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const { error } = await supabase
        .from('profiles')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('[userController.deleteUser] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  },

  // Obtener perfil del usuario actual
  getProfile: async (req, res) => {
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[userController.getProfile] Error:', error);
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

      const updates = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (email !== undefined) updates.email = email;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', req.user.id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('[userController.updateProfile] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  },

  getUserStats: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Task stats using Supabase
      const { data: tasks, error: tasksError } = await supabase
        .from('tareas')
        .select('estado')
        .eq('usuario_asignado', id);

      if (tasksError) throw tasksError;

      const taskStats = {
        total: tasks.length,
        pendientes: tasks.filter(t => t.estado === 'pendiente').length,
        en_progreso: tasks.filter(t => t.estado === 'en_progreso').length,
        completadas: tasks.filter(t => t.estado === 'completada').length,
      };

      // 2. Attendance history (last 30 days)
      const { data: attendanceHistory, error: attendanceError } = await supabase
        .from('asistencias')
        .select('fecha, hora_entrada, hora_salida, tipo, ubicacion')
        .eq('usuario_id', id)
        .order('fecha', { ascending: false })
        .limit(30);

      if (attendanceError) throw attendanceError;

      res.json({
        success: true,
        data: {
          taskStats,
          attendanceHistory,
        },
      });
    } catch (error) {
      console.error(`[userController.getUserStats] Error for user ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
      });
    }
  },
};

module.exports = UserController;
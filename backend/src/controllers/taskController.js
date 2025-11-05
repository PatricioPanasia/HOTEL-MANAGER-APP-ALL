const { query } = require('../config/database');
const supabase = require('../config/supabase');

const TaskController = {
  // Obtener todas las tareas
  getAllTasks: async (req, res) => {
    try {
      console.log('🔍 Getting tasks for user:', req.user.id, 'Role:', req.user.rol);
      
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        prioridad,
        usuario_asignado 
      } = req.query;
      
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Filtros
      if (estado) {
        whereConditions.push('estado = ?');
        queryParams.push(estado);
      }

      if (prioridad) {
        whereConditions.push('prioridad = ?');
        queryParams.push(prioridad);
      }

      if (usuario_asignado) {
        whereConditions.push('usuario_asignado = ?');
        queryParams.push(usuario_asignado);
      }

      // Si no es admin, solo ver tareas asignadas o creadas por él
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        whereConditions.push('(usuario_asignado = ? OR usuario_creador = ?)');
        queryParams.push(req.user.id, req.user.id);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      console.log('📋 Executing tasks query with conditions:', whereClause);

      const tasks = await query(
        `SELECT t.*, 
                ua.nombre as asignado_nombre,
                uc.nombre as creador_nombre
         FROM tareas t
         LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id
         LEFT JOIN usuarios uc ON t.usuario_creador = uc.id
         ${whereClause}
         ORDER BY t.fecha_creacion DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM tareas ${whereClause}`,
        queryParams
      );

      console.log('✅ Tasks fetched successfully:', tasks.length, 'tasks found');

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tasks: ' + error.message
      });
    }
  },

  // Obtener tarea por ID
  getTaskById: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🔍 Getting task by ID:', id, 'for user:', req.user.id);

      const tasks = await query(
        `SELECT t.*, 
                ua.nombre as asignado_nombre,
                uc.nombre as creador_nombre
         FROM tareas t
         LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id
         LEFT JOIN usuarios uc ON t.usuario_creador = uc.id
         WHERE t.id = ?`,
        [id]
      );

      if (tasks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const task = tasks[0];

      // Verificar permisos (solo admin, supervisor o el asignado pueden ver)
      if (req.user.rol !== 'admin' && 
          req.user.rol !== 'supervisor' && 
          task.usuario_asignado !== req.user.id && 
          task.usuario_creador !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view this task'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('❌ Error fetching task:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching task: ' + error.message
      });
    }
  },

  // Crear nueva tarea
  createTask: async (req, res) => {
    try {
      const { 
        titulo, 
        descripcion, 
        usuario_asignado, 
        prioridad, 
        fecha_limite 
      } = req.body;

      console.log('📝 Creating task for user:', req.user.id, 'Data:', req.body);

      if (!titulo) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      // Solo admin y supervisor pueden asignar tareas a otros
      let usuarioAsignadoFinal = usuario_asignado;
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        usuarioAsignadoFinal = req.user.id; // Auto-asignarse
      }

      const result = await query(
        `INSERT INTO tareas 
         (titulo, descripcion, usuario_asignado, usuario_creador, prioridad, fecha_limite) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          titulo, 
          descripcion, 
          usuarioAsignadoFinal, 
          req.user.id, 
          prioridad || 'media',
          fecha_limite || null
        ]
      );

      console.log('✅ Task created with ID:', result.insertId);

      // Obtener la tarea creada con información de usuarios
      const newTask = await query(
        `SELECT t.*, 
                ua.nombre as asignado_nombre,
                uc.nombre as creador_nombre
         FROM tareas t
         LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id
         LEFT JOIN usuarios uc ON t.usuario_creador = uc.id
         WHERE t.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask[0]
      });
    } catch (error) {
      console.error('❌ Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating task: ' + error.message
      });
    }
  },

  // Actualizar tarea
  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log('📝 Updating task:', id, 'by user:', req.user.id, 'Updates:', updates);

      // Verificar que la tarea existe
      const existingTask = await query(
        'SELECT * FROM tareas WHERE id = ?',
        [id]
      );

      if (existingTask.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const task = existingTask[0];

      // Verificar permisos (solo admin, supervisor o el asignado pueden editar)
      if (req.user.rol !== 'admin' && 
          req.user.rol !== 'supervisor' && 
          task.usuario_asignado !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this task'
        });
      }

      // Construir query dinámica
      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach(key => {
        if (['titulo', 'descripcion', 'estado', 'prioridad', 'fecha_limite', 'usuario_asignado'].includes(key)) {
          updateFields.push(`${key} = ?`); // Asegurarse de que el frontend envíe null para fecha_limite si se vacía
          updateValues.push(updates[key]);
        }
      });

      // Si se marca como completada, agregar fecha de completado
      if (updates.estado === 'completada' && task.estado !== 'completada') {
        updateFields.push('fecha_completado = NOW()');
      } else if (updates.estado !== 'completada' && updates.estado !== undefined) {
        updateFields.push('fecha_completado = NULL');
      }

      updateValues.push(id);

      await query(
        `UPDATE tareas SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      console.log('✅ Task updated successfully:', id);

      res.json({
        success: true,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error('❌ Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating task: ' + error.message
      });
    }
  },

  // Eliminar tarea
  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Deleting task:', id, 'by user:', req.user.id);

      // Verificar que la tarea existe
      const existingTask = await query(
        'SELECT * FROM tareas WHERE id = ?',
        [id]
      );

      if (existingTask.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const task = existingTask[0];

      // Verificar permisos (solo admin y supervisor pueden eliminar)
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this task'
        });
      }

      await query('DELETE FROM tareas WHERE id = ?', [id]);

      console.log('✅ Task deleted successfully:', id);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting task: ' + error.message
      });
    }
  },

  // Obtener estadísticas de tareas
  getTaskStats: async (req, res) => {
    try {
      console.log('📊 Getting task stats (Supabase) for user:', req.user.id);

      if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase not configured' });
      }

      const userId = req.user.id;
      const isLimited = req.user.rol === 'recepcionista';

      const base = supabase.from('tareas');

      // Helper to count with optional filters
      const countWhere = async (filters) => {
        let q = base.select('*', { count: 'exact', head: true });
        if (isLimited) {
          q = q.or(`usuario_asignado.eq.${userId},usuario_creador.eq.${userId}`);
        }
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => {
            q = q.eq(k, v);
          });
        }
        const { count, error } = await q;
        if (error) throw error;
        return count || 0;
      };

      const [total, pendientes, en_progreso, completadas, canceladas, prioritarias] = await Promise.all([
        countWhere(),
        countWhere({ estado: 'pendiente' }),
        countWhere({ estado: 'en_progreso' }),
        countWhere({ estado: 'completada' }),
        countWhere({ estado: 'cancelada' }),
        // prioridad alta o urgente
        (async () => {
          let q = base
            .select('*', { count: 'exact', head: true })
            .or('prioridad.eq.alta,prioridad.eq.urgente');
          if (isLimited) {
            q = q.or(`usuario_asignado.eq.${userId},usuario_creador.eq.${userId}`);
          }
          const { count, error } = await q;
          if (error) throw error;
          return count || 0;
        })(),
      ]);

      res.json({
        success: true,
        data: { total, pendientes, en_progreso, completadas, canceladas, prioritarias }
      });
    } catch (error) {
      console.error('❌ Error fetching task stats (Supabase):', error);
      res.status(500).json({ success: false, message: 'Error fetching task stats' });
    }
  }
};

module.exports = TaskController;
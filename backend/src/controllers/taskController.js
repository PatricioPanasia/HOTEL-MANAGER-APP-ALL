const supabase = require('../config/supabase');

const TaskController = {
  // Obtener todas las tareas
  getAllTasks: async (req, res) => {
    try {
      console.log('[taskController.getAllTasks] Getting tasks for user:', req.user.id, 'Role:', req.user.rol);
      
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        prioridad,
        usuario_asignado 
      } = req.query;
      
      const offset = (page - 1) * parseInt(limit);

      // Construir query base (sin joins por ahora para evitar errores de FK)
      let query = supabase
        .from('tareas')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (estado) {
        query = query.eq('estado', estado);
      }

      if (prioridad) {
        query = query.eq('prioridad', prioridad);
      }

      if (usuario_asignado) {
        query = query.eq('usuario_asignado', usuario_asignado);
      }

      // Si no es admin/supervisor, solo ver tareas asignadas o creadas por él
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        query = query.or(`usuario_asignado.eq.${req.user.id},usuario_creador.eq.${req.user.id}`);
      }

      // Ordenar y paginar
      const { data: tasks, error, count } = await query
        // Ordenar por fecha de creación real en nuestro esquema
        .order('fecha_creacion', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) {
        console.error('[taskController.getAllTasks] Supabase error:', error);
        throw error;
      }

      console.log('[taskController.getAllTasks] Tasks fetched successfully:', tasks?.length || 0, 'tasks found');

      res.json({
        success: true,
        data: tasks || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('[taskController.getAllTasks] Error:', error);
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

      console.log('[taskController.getTaskById] Getting task:', id, 'for user:', req.user.id);

      const { data: task, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !task) {
        console.error('[taskController.getTaskById] Task not found or error:', error);
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Verificar permisos
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
      console.error('[taskController.getTaskById] Error:', error);
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

      console.log('[taskController.createTask] Creating task for user:', req.user.id, 'Data:', req.body);

      if (!titulo || !titulo.trim()) {
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

      const taskData = {
        titulo: titulo.trim(),
        descripcion: descripcion || null,
        usuario_asignado: usuarioAsignadoFinal || req.user.id,
        usuario_creador: req.user.id,
        prioridad: prioridad || 'media',
        estado: 'pendiente',
        fecha_limite: fecha_limite || null
      };

      const { data: newTask, error } = await supabase
        .from('tareas')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('[taskController.createTask] Supabase error:', error);
        throw error;
      }

      console.log('[taskController.createTask] Task created with ID:', newTask.id);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask
      });
    } catch (error) {
      console.error('[taskController.createTask] Error:', error);
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

      console.log('[taskController.updateTask] Updating task:', id, 'by user:', req.user.id, 'Updates:', updates);

      // Verificar que la tarea existe
      const { data: task, error: fetchError } = await supabase
        .from('tareas')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && 
          req.user.rol !== 'supervisor' && 
          task.usuario_asignado !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this task'
        });
      }

      // Construir objeto de actualización
      const updateData = {};
      const allowedFields = ['titulo', 'descripcion', 'estado', 'prioridad', 'fecha_limite', 'usuario_asignado'];
      
      allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
          updateData[field] = updates[field];
        }
      });

      // Si se marca como completada, agregar fecha
      if (updates.estado === 'completada' && task.estado !== 'completada') {
        updateData.fecha_completado = new Date().toISOString();
      } else if (updates.estado && updates.estado !== 'completada') {
        updateData.fecha_completado = null;
      }

      const { error: updateError } = await supabase
        .from('tareas')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('[taskController.updateTask] Supabase error:', updateError);
        throw updateError;
      }

      console.log('[taskController.updateTask] Task updated successfully:', id);

      res.json({
        success: true,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error('[taskController.updateTask] Error:', error);
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

      console.log('[taskController.deleteTask] Deleting task:', id, 'by user:', req.user.id);

      // Verificar que la tarea existe
      const { data: task, error: fetchError } = await supabase
        .from('tareas')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this task'
        });
      }

      const { error: deleteError } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[taskController.deleteTask] Supabase error:', deleteError);
        throw deleteError;
      }

      console.log('[taskController.deleteTask] Task deleted successfully:', id);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('[taskController.deleteTask] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting task: ' + error.message
      });
    }
  },

  // Obtener estadísticas de tareas
  getTaskStats: async (req, res) => {
    try {
      console.log('[taskController.getTaskStats] Getting task stats for user:', req.user.id);

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
      console.error('[taskController.getTaskStats] Error:', error);
      res.status(500).json({ success: false, message: 'Error fetching task stats' });
    }
  }
};

module.exports = TaskController;
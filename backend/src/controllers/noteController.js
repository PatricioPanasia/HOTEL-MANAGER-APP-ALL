const { query } = require('../config/database');
const supabase = require('../config/supabase');

const NoteController = {
  // Obtener todas las notas
  getAllNotes: async (req, res) => {
    try {
      const { page = 1, limit = 10, tipo, importante } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];

      // Filtros
      if (tipo) {
        whereConditions.push('tipo = ?');
        queryParams.push(tipo);
      }

      if (importante !== undefined) {
        whereConditions.push('importante = ?');
        queryParams.push(importante === 'true');
      }

      // LÓGICA DE PERMISOS CORREGIDA
      if (req.user.rol !== 'admin') {
        if (req.user.rol === 'supervisor') {
          // Supervisores ven notas de equipo, generales y sus personales
          whereConditions.push('(tipo IN ("equipo", "general") OR usuario_id = ? OR usuario_asignado = ?)');
          queryParams.push(req.user.id, req.user.id);
        } else {
          // Recepcionistas ven:
          // 1. Sus notas personales (usuario_id = su id)
          // 2. Notas de equipo (tipo = "equipo") 
          // 3. Notas generales (tipo = "general")
          // 4. Notas asignadas específicamente a ellos (usuario_asignado = su id)
          whereConditions.push('(usuario_id = ? OR tipo IN ("equipo", "general") OR usuario_asignado = ?)');
          queryParams.push(req.user.id, req.user.id);
        }
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      console.log('🔍 Notas query for user:', req.user.id, 'Role:', req.user.rol);
      console.log('📋 Where clause:', whereClause);
      console.log('📊 Query params:', queryParams);

      const notes = await query(
        `SELECT n.*, 
                u.nombre as usuario_nombre,
                u.rol as usuario_rol,
                ua.nombre as asignado_nombre
         FROM notas n 
         JOIN usuarios u ON n.usuario_id = u.id
         LEFT JOIN usuarios ua ON n.usuario_asignado = ua.id
         ${whereClause}
         ORDER BY n.fecha_creacion DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM notas n ${whereClause}`,
        queryParams
      );

      console.log('✅ Notes found:', notes.length, 'for user:', req.user.id);

      res.json({
        success: true,
        data: notes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching notes'
      });
    }
  },

  // Crear nueva nota
  createNote: async (req, res) => {
    try {
      const { titulo, contenido, tipo, importante, usuario_asignado } = req.body;

      console.log('📝 Creating note for user:', req.user.id, 'Data:', req.body);

      if (!titulo || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      // Validar que el tipo sea permitido para el rol
      const allowedTypes = ['personal'];
      if (req.user.rol === 'admin' || req.user.rol === 'supervisor') {
        allowedTypes.push('equipo', 'general');
      }

      if (!allowedTypes.includes(tipo)) {
        return res.status(403).json({
          success: false,
          message: 'Not allowed to create this type of note'
        });
      }

      // Si se asigna a otro usuario, verificar permisos
      if (usuario_asignado && usuario_asignado !== req.user.id) {
        if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
          return res.status(403).json({
            success: false,
            message: 'Only admins and supervisors can assign notes to other users'
          });
        }
      }

      const result = await query(
        'INSERT INTO notas (titulo, contenido, usuario_id, tipo, importante, usuario_asignado) VALUES (?, ?, ?, ?, ?, ?)',
        [titulo, contenido, req.user.id, tipo, importante || false, usuario_asignado || null]
      );

      console.log('✅ Note created with ID:', result.insertId);

      // Obtener la nota creada con información de usuarios
      const newNote = await query(
        `SELECT n.*, 
                u.nombre as usuario_nombre,
                ua.nombre as asignado_nombre
         FROM notas n 
         JOIN usuarios u ON n.usuario_id = u.id
         LEFT JOIN usuarios ua ON n.usuario_asignado = ua.id
         WHERE n.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        data: newNote[0]
      });
    } catch (error) {
      console.error('❌ Error creating note:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating note'
      });
    }
  },

  // Actualizar nota
  updateNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, contenido, tipo, importante, usuario_asignado } = req.body;

      console.log('📝 Updating note:', id, 'by user:', req.user.id);

      // Verificar que la nota existe
      const existingNote = await query(
        'SELECT * FROM notas WHERE id = ?',
        [id]
      );

      if (existingNote.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      const note = existingNote[0];

      // Verificar permisos (solo admin o el creador pueden editar)
      if (req.user.rol !== 'admin' && note.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update this note'
        });
      }

      await query(
        'UPDATE notas SET titulo = ?, contenido = ?, tipo = ?, importante = ?, usuario_asignado = ? WHERE id = ?',
        [titulo, contenido, tipo, importante || false, usuario_asignado || null, id]
      );

      console.log('✅ Note updated successfully:', id);

      res.json({
        success: true,
        message: 'Note updated successfully'
      });
    } catch (error) {
      console.error('❌ Error updating note:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating note'
      });
    }
  },

  // Eliminar nota
  deleteNote: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Deleting note:', id, 'by user:', req.user.id);

      // Verificar que la nota existe
      const existingNote = await query(
        'SELECT * FROM notas WHERE id = ?',
        [id]
      );

      if (existingNote.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      const note = existingNote[0];

      // Verificar permisos (solo admin o el creador pueden eliminar)
      if (req.user.rol !== 'admin' && note.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this note'
        });
      }

      await query('DELETE FROM notas WHERE id = ?', [id]);

      console.log('✅ Note deleted successfully:', id);

      res.json({
        success: true,
        message: 'Note deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting note'
      });
    }
  },

  // Obtener estadísticas de las notas
  getNoteStats: async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase not configured' });
      }

      const userId = req.user.id;
      const isAdmin = req.user.rol === 'admin';

      let q = supabase.from('notas').select('id, importante, tipo, usuario_id', { count: 'exact' });
      if (!isAdmin) {
        q = q.or(`usuario_id.eq.${userId},tipo.eq.equipo,tipo.eq.general,usuario_asignado.eq.${userId}`);
      }
      const { data, error, count } = await q;
      if (error) throw error;

      const total = count || (data ? data.length : 0);
      const importantes = (data || []).filter((n) => n.importante === true).length;
      const personales = (data || []).filter((n) => n.tipo === 'personal' && n.usuario_id === userId).length;

      res.json({ success: true, data: { total, importantes, personales } });
    } catch (error) {
      console.error('❌ Error fetching note stats (Supabase):', error);
      res.status(500).json({ success: false, message: 'Error fetching note stats' });
    }
  },
};

module.exports = NoteController;
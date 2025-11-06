const supabase = require('../config/supabase');

const NoteController = {
  // Obtener todas las notas
  getAllNotes: async (req, res) => {
    try {
      const { page = 1, limit = 10, tipo, importante } = req.query;
      const offset = (page - 1) * parseInt(limit);

  let q = supabase.from('notas').select('*', { count: 'exact' });

      if (tipo) q = q.eq('tipo', tipo);
      if (typeof importante !== 'undefined') q = q.eq('importante', importante === 'true');

      // Permisos
      if (req.user.rol !== 'admin') {
        if (req.user.rol === 'supervisor') {
          q = q.or(`tipo.eq.equipo,tipo.eq.general,usuario_id.eq.${req.user.id},usuario_asignado.eq.${req.user.id}`);
        } else {
          q = q.or(`usuario_id.eq.${req.user.id},tipo.eq.equipo,tipo.eq.general,usuario_asignado.eq.${req.user.id}`);
        }
      }

      const { data: notes, error, count } = await q
        .order('fecha_creacion', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      // Enriquecer con nombres de creador y asignado
      let enriched = notes || [];
      if (enriched.length > 0) {
        const ids = new Set();
        enriched.forEach(n => {
          if (n.usuario_id) ids.add(n.usuario_id);
          if (n.usuario_asignado) ids.add(n.usuario_asignado);
        });
        const idArray = Array.from(ids);
        if (idArray.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id,nombre,email')
            .in('id', idArray);
          const map = new Map((profiles || []).map(u => [u.id, u]));
          enriched = enriched.map(n => ({
            ...n,
            usuario_nombre: map.get(n.usuario_id)?.nombre || map.get(n.usuario_id)?.email || 'Desconocido',
            asignado_nombre: n.usuario_asignado ? (map.get(n.usuario_asignado)?.nombre || map.get(n.usuario_asignado)?.email || 'Desconocido') : null,
          }));
        }
      }

      res.json({
        success: true,
        data: enriched,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('[noteController.getAllNotes] Error:', error);
      res.status(500).json({ success: false, message: 'Error fetching notes' });
    }
  },

  // Crear nueva nota
  createNote: async (req, res) => {
    try {
      const { titulo, contenido, tipo = 'personal', importante = false, usuario_asignado = null } = req.body;

      console.log('[noteController.createNote] Creating note for user:', req.user.id);

      if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
      }

      const allowedTypes = ['personal'];
      if (req.user.rol === 'admin' || req.user.rol === 'supervisor') allowedTypes.push('equipo', 'general');
      if (!allowedTypes.includes(tipo)) {
        return res.status(403).json({ success: false, message: 'Not allowed to create this type of note' });
      }

      if (usuario_asignado && usuario_asignado !== req.user.id) {
        if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
          return res.status(403).json({ success: false, message: 'Only admins and supervisors can assign notes to other users' });
        }
      }

      const insertData = {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        usuario_id: req.user.id,
        tipo,
        importante: !!importante,
        usuario_asignado: usuario_asignado || null,
      };

      const { data: newNote, error } = await supabase.from('notas').insert([insertData]).select('*').single();
      if (error) throw error;

      res.status(201).json({ success: true, message: 'Note created successfully', data: newNote });
    } catch (error) {
      console.error('[noteController.createNote] Error:', error);
      res.status(500).json({ success: false, message: 'Error creating note' });
    }
  },

  // Actualizar nota
  updateNote: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log('[noteController.updateNote] Updating note:', id, 'by user:', req.user.id);

      const { data: note, error: fetchError } = await supabase.from('notas').select('*').eq('id', id).single();
      if (fetchError || !note) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }

      if (req.user.rol !== 'admin' && note.usuario_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions to update this note' });
      }

      const allowed = ['titulo', 'contenido', 'tipo', 'importante', 'usuario_asignado'];
      const updateData = {};
      allowed.forEach((k) => {
        if (updates.hasOwnProperty(k)) updateData[k] = updates[k];
      });

      const { error: updError } = await supabase.from('notas').update(updateData).eq('id', id);
      if (updError) throw updError;

      res.json({ success: true, message: 'Note updated successfully' });
    } catch (error) {
      console.error('[noteController.updateNote] Error:', error);
      res.status(500).json({ success: false, message: 'Error updating note' });
    }
  },

  // Eliminar nota
  deleteNote: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[noteController.deleteNote] Deleting note:', id, 'by user:', req.user.id);

      const { data: note, error: fetchError } = await supabase.from('notas').select('*').eq('id', id).single();
      if (fetchError || !note) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }

      if (req.user.rol !== 'admin' && note.usuario_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions to delete this note' });
      }

      const { error: delError } = await supabase.from('notas').delete().eq('id', id);
      if (delError) throw delError;

      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      console.error('[noteController.deleteNote] Error:', error);
      res.status(500).json({ success: false, message: 'Error deleting note' });
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
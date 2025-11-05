const { query } = require('../config/database');

const ReportController = {
  // Obtener todos los reportes
  getAllReports: async (req, res) => {
    try {
      const { page = 1, limit = 10, tipo, estado, prioridad } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];

      // Filtros
      if (tipo) {
        whereConditions.push('tipo = ?');
        queryParams.push(tipo);
      }

      if (estado) {
        whereConditions.push('estado = ?');
        queryParams.push(estado);
      }

      if (prioridad) {
        whereConditions.push('prioridad = ?');
        queryParams.push(prioridad);
      }

      // Si no es admin/supervisor, solo ver sus propios reportes
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        whereConditions.push('usuario_id = ?');
        queryParams.push(req.user.id);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const reports = await query(
        `SELECT r.*, u.nombre as usuario_nombre 
         FROM reportes r 
         JOIN usuarios u ON r.usuario_id = u.id
         ${whereClause}
         ORDER BY r.fecha_creacion DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM reportes r ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reports'
      });
    }
  },

  // Crear nuevo reporte
  createReport: async (req, res) => {
    try {
      const { titulo, descripcion, tipo, prioridad } = req.body;

      if (!titulo || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      const result = await query(
        'INSERT INTO reportes (titulo, descripcion, usuario_id, tipo, prioridad) VALUES (?, ?, ?, ?, ?)',
        [titulo, descripcion, req.user.id, tipo || 'general', prioridad || 'media']
      );

      // Obtener el reporte creado con información del usuario
      const newReport = await query(
        `SELECT r.*, u.nombre as usuario_nombre 
         FROM reportes r 
         JOIN usuarios u ON r.usuario_id = u.id 
         WHERE r.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: newReport[0]
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating report'
      });
    }
  },

  // Actualizar reporte (solo admin/supervisor)
  updateReport: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, prioridad, descripcion } = req.body;

      // Verificar que el reporte existe
      const existingReport = await query(
        'SELECT * FROM reportes WHERE id = ?',
        [id]
      );

      if (existingReport.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = existingReport[0];

      // Verificar permisos (solo admin/supervisor pueden actualizar estado/prioridad)
      if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        // Recepcionistas solo pueden actualizar sus propios reportes (solo descripción)
        if (report.usuario_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to update this report'
          });
        }
        
        // Recepcionistas solo pueden actualizar la descripción
        if (estado !== undefined || prioridad !== undefined) {
          return res.status(403).json({
            success: false,
            message: 'Only supervisors and admins can update status and priority'
          });
        }
      }

      // Construir query dinámica
      const updateFields = [];
      const updateValues = [];

      if (estado !== undefined) {
        updateFields.push('estado = ?');
        updateValues.push(estado);
      }

      if (prioridad !== undefined) {
        updateFields.push('prioridad = ?');
        updateValues.push(prioridad);
      }

      if (descripcion !== undefined) {
        updateFields.push('descripcion = ?');
        updateValues.push(descripcion);
      }

      updateValues.push(id);

      await query(
        `UPDATE reportes SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Report updated successfully'
      });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating report'
      });
    }
  }
};

module.exports = ReportController;
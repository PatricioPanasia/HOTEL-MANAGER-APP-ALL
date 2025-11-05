const { query } = require('../config/database');
const moment = require('moment-timezone');

const AttendanceController = {
  // Registrar entrada
  checkIn: async (req, res) => {
    try {
      const { ubicacion, observaciones } = req.body;
      const usuario_id = req.user.id;
  const fecha = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
  const hora_entrada = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

      // Verify there's no open entry (hora_salida IS NULL)
      const openEntry = await query(
        'SELECT id FROM asistencias WHERE usuario_id = ? AND fecha = ? AND hora_salida IS NULL',
        [usuario_id, fecha]
      );

      if (openEntry.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya hay una entrada sin salida. Registra primero la salida antes de una nueva entrada.'
        });
      }

      // Contar cantidad de pares entrada/salida del día (máximo 4 pares)
      const registros = await query(
        'SELECT COUNT(*) as total FROM asistencias WHERE usuario_id = ? AND fecha = ?',
        [usuario_id, fecha]
      );
      
      const totalRegistros = registros[0].total;
      
      if (totalRegistros >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Has alcanzado el máximo de 4 pares de entrada/salida para hoy.'
        });
      }

      // Registrar entrada
      const result = await query(
        'INSERT INTO asistencias (usuario_id, fecha, hora_entrada, tipo, ubicacion, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [usuario_id, fecha, hora_entrada, 'entrada', ubicacion, observaciones]
      );

      res.status(201).json({
        success: true,
        message: 'Entrada registrada exitosamente',
        data: {
          id: result.insertId,
          fecha,
          hora_entrada,
          ubicacion
        }
      });
    } catch (error) {
      console.error('Error en check-in:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar entrada'
      });
    }
  },

  // Registrar salida
  checkOut: async (req, res) => {
    try {
      const { ubicacion, observaciones } = req.body;
      const usuario_id = req.user.id;
  const fecha = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
  const hora_salida = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

      // Buscar registro de entrada de hoy
      // Find the most recent open entry (without salida)
      const existingEntry = await query(
        'SELECT id, hora_entrada FROM asistencias WHERE usuario_id = ? AND fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NULL ORDER BY id DESC LIMIT 1',
        [usuario_id, fecha]
      );

      if (existingEntry.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay una entrada abierta para hoy. Registra una entrada primero.'
        });
      }

      // Registrar salida
      await query(
        'UPDATE asistencias SET hora_salida = ?, tipo = ?, ubicacion = ?, observaciones = ? WHERE id = ?',
        [hora_salida, 'salida', ubicacion, observaciones, existingEntry[0].id]
      );

      res.json({
        success: true,
        message: 'Salida registrada exitosamente',
        data: {
          fecha,
          hora_entrada: existingEntry[0].hora_entrada,
          hora_salida
        }
      });
    } catch (error) {
      console.error('Error en check-out:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar salida'
      });
    }
  },

  // Obtener historial de asistencias
  getAttendance: async (req, res) => {
    try {
  const { page = 1, limit = 10, start_date, end_date, usuario_id } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = ['1=1'];
      let queryParams = [];

      // Filtro por usuario
      if (usuario_id && (req.user.rol === 'admin' || req.user.rol === 'supervisor')) {
        whereConditions.push('a.usuario_id = ?');
        queryParams.push(usuario_id);
      } else if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        // Recepcionistas solo ven sus propias asistencias
        whereConditions.push('a.usuario_id = ?');
        queryParams.push(req.user.id);
      }

      // Filtro por fecha
      if (start_date) {
        whereConditions.push('a.fecha >= ?');
        queryParams.push(start_date);
      }

      if (end_date) {
        whereConditions.push('a.fecha <= ?');
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.join(' AND ');

      const attendance = await query(
        `SELECT a.*, u.nombre as usuario_nombre, u.rol as usuario_rol
         FROM asistencias a
         JOIN usuarios u ON a.usuario_id = u.id
         WHERE ${whereClause}
         ORDER BY a.fecha DESC, a.hora_entrada DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total 
         FROM asistencias a 
         WHERE ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        data: attendance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de asistencias'
      });
    }
  },

  // Obtener estado de asistencia actual del usuario
  getCurrentStatus: async (req, res) => {
    try {
      const usuario_id = req.user.id;
  const fecha = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');

      // Primero, verificar si ya alcanzó el máximo de 4 pares
      const totalRegistros = await query(
        'SELECT COUNT(*) as total FROM asistencias WHERE usuario_id = ? AND fecha = ?',
        [usuario_id, fecha]
      );

      // Si ya tiene 4 registros completos (4 pares), jornada finalizada
      if (totalRegistros[0].total >= 4) {
        const lastCompleteEntry = await query(
          'SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ? AND hora_salida IS NOT NULL ORDER BY id DESC LIMIT 1',
          [usuario_id, fecha]
        );

        return res.json({
          success: true,
          data: {
            status: 'jornada_finalizada',
            lastAction: lastCompleteEntry.length > 0 ? {
              tipo: 'salida',
              hora: lastCompleteEntry[0].hora_salida
            } : null,
            fecha
          }
        });
      }

      // Buscar si hay alguna entrada abierta (sin salida)
      const openEntry = await query(
        'SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NULL ORDER BY id DESC LIMIT 1',
        [usuario_id, fecha]
      );

      let status = 'no_registrado';
      let lastAction = null;

      if (openEntry.length > 0) {
        // Hay una entrada abierta
        status = 'entrada_registrada';
        lastAction = {
          tipo: 'entrada',
          hora: openEntry[0].hora_entrada
        };
      } else {
        // No hay entrada abierta, verificar si hay algún registro cerrado
        const lastCompleteEntry = await query(
          'SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NOT NULL ORDER BY id DESC LIMIT 1',
          [usuario_id, fecha]
        );

        if (lastCompleteEntry.length > 0) {
          // Ya hay al menos un par entrada/salida cerrado, pero puede fichar de nuevo
          status = 'no_registrado';
          lastAction = {
            tipo: 'salida',
            hora: lastCompleteEntry[0].hora_salida
          };
        }
      }

      res.json({
        success: true,
        data: {
          status,
          lastAction,
          fecha
        }
      });
    } catch (error) {
      console.error('Error getting current status:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado actual'
      });
    }
  },

  // Obtener estadísticas de asistencia
  getAttendanceStats: async (req, res) => {
    try {
  const fecha = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');

      // Total de empleados (considerando activos si hubiera un campo `activo`)
      const totalUsers = await query('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1');

      // Total de presentes hoy (una entrada por usuario)
      const presentToday = await query(
        `SELECT COUNT(DISTINCT usuario_id) as total 
         FROM asistencias 
         WHERE fecha = ? AND hora_entrada IS NOT NULL`,
        [fecha]
      );

      res.json({
        success: true,
        data: {
          total_empleados: totalUsers[0].total,
          presentes_hoy: presentToday[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de asistencia'
      });
    }
  }
};

module.exports = AttendanceController;
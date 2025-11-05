const supabase = require('../config/supabase');
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
      const { data: openEntry, error: openErr } = await supabase
        .from('asistencias')
        .select('id')
        .eq('usuario_id', usuario_id)
        .eq('fecha', fecha)
        .is('hora_salida', null);
      if (openErr) throw openErr;

      if ((openEntry || []).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya hay una entrada sin salida. Registra primero la salida antes de una nueva entrada.'
        });
      }

      // Contar cantidad de registros del día (máximo 4)
      const { count: totalRegistros, error: cntErr } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario_id)
        .eq('fecha', fecha);
      if (cntErr) throw cntErr;
      
      if ((totalRegistros || 0) >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Has alcanzado el máximo de 4 pares de entrada/salida para hoy.'
        });
      }

      // Registrar entrada
      const insertData = { usuario_id, fecha, hora_entrada, tipo: 'entrada', ubicacion, observaciones };
      const { data: inserted, error: insErr } = await supabase
        .from('asistencias')
        .insert([insertData])
        .select('id, fecha, hora_entrada')
        .single();
      if (insErr) throw insErr;

      res.status(201).json({
        success: true,
        message: 'Entrada registrada exitosamente',
        data: {
          id: inserted.id,
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

      // Buscar la entrada abierta más reciente
      const { data: existing, error: exErr } = await supabase
        .from('asistencias')
        .select('id, hora_entrada')
        .eq('usuario_id', usuario_id)
        .eq('fecha', fecha)
        .not('hora_entrada', 'is', null)
        .is('hora_salida', null)
        .order('id', { ascending: false })
        .limit(1);
      if (exErr) throw exErr;

      if (!existing || existing.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay una entrada abierta para hoy. Registra una entrada primero.'
        });
      }

      // Registrar salida
      const { error: updErr } = await supabase
        .from('asistencias')
        .update({ hora_salida, tipo: 'salida', ubicacion, observaciones })
        .eq('id', existing[0].id);
      if (updErr) throw updErr;

      res.json({
        success: true,
        message: 'Salida registrada exitosamente',
        data: {
          fecha,
          hora_entrada: existing[0].hora_entrada,
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
      const offset = (page - 1) * parseInt(limit);

      let q = supabase.from('asistencias').select('*', { count: 'exact' });

      // Filtro por usuario
      if (usuario_id && (req.user.rol === 'admin' || req.user.rol === 'supervisor')) {
        q = q.eq('usuario_id', usuario_id);
      } else if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
        q = q.eq('usuario_id', req.user.id);
      }

      // Filtro por fechas
      if (start_date) q = q.gte('fecha', start_date);
      if (end_date) q = q.lte('fecha', end_date);

      const { data: attendance, error, count } = await q
        .order('fecha', { ascending: false })
        .order('hora_entrada', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);
      if (error) throw error;

      res.json({
        success: true,
        data: attendance || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit))
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

      // Verificar registros del día
      const { count: totalRegistros, error: cntErr } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario_id)
        .eq('fecha', fecha);
      if (cntErr) throw cntErr;

      // Si ya tiene 4 registros completos (4 pares), jornada finalizada
      if ((totalRegistros || 0) >= 4) {
        const { data: lastCompleteEntry, error: lastErr } = await supabase
          .from('asistencias')
          .select('*')
          .eq('usuario_id', usuario_id)
          .eq('fecha', fecha)
          .not('hora_salida', 'is', null)
          .order('id', { ascending: false })
          .limit(1);
        if (lastErr) throw lastErr;

        return res.json({
          success: true,
          data: {
            status: 'jornada_finalizada',
            lastAction: (lastCompleteEntry && lastCompleteEntry.length > 0) ? {
              tipo: 'salida',
              hora: lastCompleteEntry[0].hora_salida
            } : null,
            fecha
          }
        });
      }

      // Buscar si hay alguna entrada abierta (sin salida)
      const { data: openEntry, error: openErr2 } = await supabase
        .from('asistencias')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('fecha', fecha)
        .not('hora_entrada', 'is', null)
        .is('hora_salida', null)
        .order('id', { ascending: false })
        .limit(1);
      if (openErr2) throw openErr2;

      let status = 'no_registrado';
      let lastAction = null;

      if (openEntry && openEntry.length > 0) {
        // Hay una entrada abierta
        status = 'entrada_registrada';
        lastAction = {
          tipo: 'entrada',
          hora: openEntry[0].hora_entrada
        };
      } else {
        // No hay entrada abierta, verificar si hay algún registro cerrado
        const { data: lastCompleteEntry2, error: lastErr2 } = await supabase
          .from('asistencias')
          .select('*')
          .eq('usuario_id', usuario_id)
          .eq('fecha', fecha)
          .not('hora_entrada', 'is', null)
          .not('hora_salida', 'is', null)
          .order('id', { ascending: false })
          .limit(1);
        if (lastErr2) throw lastErr2;

        if (lastCompleteEntry2 && lastCompleteEntry2.length > 0) {
          // Ya hay al menos un par entrada/salida cerrado, pero puede fichar de nuevo
          status = 'no_registrado';
          lastAction = {
            tipo: 'salida',
            hora: lastCompleteEntry2[0].hora_salida
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

      if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase not configured' });
      }

      // total empleados activos en profiles
      const { count: totalEmpleados, error: e1 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);
      if (e1) throw e1;

      // presentes hoy: registros con hora_entrada en fecha
      const { data: asistenciasHoy, error: e2 } = await supabase
        .from('asistencias')
        .select('usuario_id, fecha, hora_entrada')
        .eq('fecha', fecha)
        .not('hora_entrada', 'is', null);
      if (e2) throw e2;
      const presentes = new Set((asistenciasHoy || []).map((a) => a.usuario_id)).size;

      res.json({ success: true, data: { total_empleados: totalEmpleados || 0, presentes_hoy: presentes } });
    } catch (error) {
      console.error('Error fetching attendance stats (Supabase):', error);
      res.status(500).json({ success: false, message: 'Error al obtener estadísticas de asistencia' });
    }
  }
};

module.exports = AttendanceController;
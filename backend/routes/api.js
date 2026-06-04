/**
 * HydroControl Pro - Rutas de API REST
 * =======================================
 * API completa para gestión multi-zona del sistema hidropónico.
 * Incluye endpoints para zonas, sensores, eventos, alertas,
 * calibraciones y diagnóstico del sistema.
 */

'use strict';

const { Router } = require('express');
const router = Router();

// ============================================
// Middleware de acceso a servicios
// ============================================

/**
 * Middleware para obtener las dependencias inyectadas desde app.locals
 */
function obtenerServicios(req) {
  return {
    db: req.app.locals.db,
    mqtt: req.app.locals.mqtt,
    alerts: req.app.locals.alerts,
    broadcastWS: req.app.locals.broadcastWS,
  };
}

// ============================================
// ZONAS
// ============================================

/**
 * GET /api/zones
 * Listar todas las zonas con su estado más reciente
 */
router.get('/zones', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zonas = db.getZones();

    // Enriquecer cada zona con su última lectura de sensores
    const zonasConEstado = zonas.map(zona => {
      const ultimaLectura = db.getLatestSensorData(zona.id);
      return {
        ...zona,
        latestReading: ultimaLectura || null,
      };
    });

    res.json({
      total: zonasConEstado.length,
      zonas: zonasConEstado,
    });
  } catch (err) {
    console.error('[API] Error al obtener zonas:', err.message);
    res.status(500).json({ error: 'Error al obtener las zonas', detalle: err.message });
  }
});

/**
 * GET /api/zones/:id
 * Detalle completo de una zona específica
 */
router.get('/zones/:id', (req, res) => {
  try {
    const { db, alerts } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);

    const zona = db.getZoneById(zoneId);
    if (!zona) {
      return res.status(404).json({ error: `Zona ${zoneId} no encontrada` });
    }

    // Obtener datos adicionales de la zona
    const ultimaLectura = db.getLatestSensorData(zoneId);
    const alertasActivas = db.getAlerts({ zoneId, acknowledged: false, limit: 10 });
    const umbrales = alerts.getThresholds(zoneId);

    res.json({
      zona,
      ultimaLectura: ultimaLectura || null,
      alertasActivas,
      umbrales,
    });
  } catch (err) {
    console.error(`[API] Error al obtener zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener detalle de zona', detalle: err.message });
  }
});

/**
 * PUT /api/zones/:id
 * Actualizar información de una zona
 */
router.put('/zones/:id', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);
    const { name, description, area_m2, active } = req.body;

    // Verificar que la zona existe
    const zona = db.getZoneById(zoneId);
    if (!zona) {
      return res.status(404).json({ error: `Zona ${zoneId} no encontrada` });
    }

    // Actualizar la zona
    db.updateZone(zoneId, { name, description, area_m2, active });
    const zonaActualizada = db.getZoneById(zoneId);

    res.json({
      mensaje: 'Zona actualizada correctamente',
      zona: zonaActualizada,
    });
  } catch (err) {
    console.error(`[API] Error al actualizar zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al actualizar zona', detalle: err.message });
  }
});

/**
 * GET /api/zones/:id/status
 * Estado actual de una zona (última lectura de sensores)
 */
router.get('/zones/:id/status', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);

    const zona = db.getZoneById(zoneId);
    if (!zona) {
      return res.status(404).json({ error: `Zona ${zoneId} no encontrada` });
    }

    const ultimaLectura = db.getLatestSensorData(zoneId);

    // Calcular si los datos son recientes (menos de 5 minutos)
    let online = false;
    if (ultimaLectura) {
      const tiempoDesdeUltimaLectura = Date.now() - new Date(ultimaLectura.timestamp).getTime();
      online = tiempoDesdeUltimaLectura < 5 * 60 * 1000;
    }

    res.json({
      zone_id: zoneId,
      zone_name: zona.name,
      online,
      sensores: ultimaLectura || null,
    });
  } catch (err) {
    console.error(`[API] Error al obtener estado de zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener estado de zona', detalle: err.message });
  }
});

/**
 * GET /api/zones/:id/history
 * Historial de datos de sensores con filtros de tiempo y resolución
 * Query params: from, to, resolution (raw|hourly|daily|auto)
 */
router.get('/zones/:id/history', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);

    // Parámetros de consulta con valores por defecto
    const to = req.query.to || new Date().toISOString();
    const from = req.query.from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const resolution = req.query.resolution || 'auto';

    const zona = db.getZoneById(zoneId);
    if (!zona) {
      return res.status(404).json({ error: `Zona ${zoneId} no encontrada` });
    }

    const datos = db.getSensorHistory(zoneId, from, to, resolution);

    res.json({
      zone_id: zoneId,
      from,
      to,
      resolution,
      total: datos.length,
      datos,
    });
  } catch (err) {
    console.error(`[API] Error al obtener historial de zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener historial', detalle: err.message });
  }
});

/**
 * GET /api/zones/:id/events
 * Eventos de una zona con filtros opcionales
 * Query params: type (pump|light), from, to, limit
 */
router.get('/zones/:id/events', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);

    const type = req.query.type || null;
    const from = req.query.from || null;
    const to = req.query.to || null;
    const limit = parseInt(req.query.limit, 10) || 100;

    const eventos = db.getEvents(zoneId, type, from, to, limit);

    res.json({
      zone_id: zoneId,
      total: eventos.length,
      eventos,
    });
  } catch (err) {
    console.error(`[API] Error al obtener eventos de zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener eventos', detalle: err.message });
  }
});

/**
 * POST /api/zones/:id/command
 * Enviar comando a un nodo ESP32 vía MQTT
 * Body: { action, params }
 */
router.post('/zones/:id/command', (req, res) => {
  try {
    const { mqtt: mqttService } = obtenerServicios(req);
    const zoneId = parseInt(req.params.id, 10);
    const comando = req.body;

    // Validar que el comando tiene los campos necesarios
    if (!comando || !comando.action) {
      return res.status(400).json({ error: 'El comando debe incluir al menos el campo "action"' });
    }

    // Verificar conexión MQTT
    if (!mqttService.isConnected()) {
      return res.status(503).json({
        error: 'Servicio MQTT no disponible',
        mensaje: 'El broker MQTT no está conectado. Verifique el servicio.',
      });
    }

    // Enviar comando vía MQTT
    const enviado = mqttService.sendCommand(zoneId, comando);

    if (enviado) {
      res.json({
        mensaje: 'Comando enviado correctamente',
        zone_id: zoneId,
        comando,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({ error: 'No se pudo enviar el comando' });
    }
  } catch (err) {
    console.error(`[API] Error al enviar comando a zona ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al enviar comando', detalle: err.message });
  }
});

// ============================================
// DASHBOARD GLOBAL
// ============================================

/**
 * GET /api/dashboard
 * Resumen global del dashboard con estado de todas las zonas
 */
router.get('/dashboard', (req, res) => {
  try {
    const { db, mqtt: mqttService } = obtenerServicios(req);

    const resumen = db.getDashboardSummary();
    const alertasActivas = db.getAlerts({ acknowledged: false, limit: 20 });

    res.json({
      timestamp: new Date().toISOString(),
      mqtt_conectado: mqttService.isConnected(),
      total_zonas: resumen.length,
      zonas: resumen,
      alertas_activas: alertasActivas,
      total_alertas_activas: alertasActivas.length,
    });
  } catch (err) {
    console.error('[API] Error al obtener resumen del dashboard:', err.message);
    res.status(500).json({ error: 'Error al obtener resumen', detalle: err.message });
  }
});

// ============================================
// ALERTAS
// ============================================

/**
 * GET /api/alerts
 * Obtener alertas con filtros opcionales
 * Query params: acknowledged (0|1), zone_id, limit
 */
router.get('/alerts', (req, res) => {
  try {
    const { db } = obtenerServicios(req);

    const filtros = {};
    if (req.query.acknowledged !== undefined) {
      filtros.acknowledged = req.query.acknowledged === '1' || req.query.acknowledged === 'true';
    }
    if (req.query.zone_id) {
      filtros.zoneId = parseInt(req.query.zone_id, 10);
    }
    if (req.query.limit) {
      filtros.limit = parseInt(req.query.limit, 10);
    }

    const alertas = db.getAlerts(filtros);

    res.json({
      total: alertas.length,
      alertas,
    });
  } catch (err) {
    console.error('[API] Error al obtener alertas:', err.message);
    res.status(500).json({ error: 'Error al obtener alertas', detalle: err.message });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Reconocer (acknowledge) una alerta
 */
router.put('/alerts/:id/acknowledge', (req, res) => {
  try {
    const { db, broadcastWS } = obtenerServicios(req);
    const alertId = parseInt(req.params.id, 10);
    const acknowledgedBy = req.body.acknowledged_by || 'user';

    const resultado = db.acknowledgeAlert(alertId, acknowledgedBy);

    if (resultado.changes === 0) {
      return res.status(404).json({
        error: 'Alerta no encontrada o ya reconocida',
      });
    }

    // Notificar a clientes WebSocket
    if (broadcastWS) {
      broadcastWS('alerta_reconocida', { id: alertId, acknowledged_by: acknowledgedBy });
    }

    res.json({
      mensaje: 'Alerta reconocida correctamente',
      id: alertId,
    });
  } catch (err) {
    console.error(`[API] Error al reconocer alerta ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al reconocer alerta', detalle: err.message });
  }
});

// ============================================
// CALIBRACIONES
// ============================================

/**
 * GET /api/calibrations/:zoneId
 * Obtener historial de calibraciones de una zona
 */
router.get('/calibrations/:zoneId', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.zoneId, 10);
    const limit = parseInt(req.query.limit, 10) || 50;

    const calibraciones = db.getCalibrationHistory(zoneId, limit);

    res.json({
      zone_id: zoneId,
      total: calibraciones.length,
      calibraciones,
    });
  } catch (err) {
    console.error(`[API] Error al obtener calibraciones de zona ${req.params.zoneId}:`, err.message);
    res.status(500).json({ error: 'Error al obtener calibraciones', detalle: err.message });
  }
});

/**
 * POST /api/calibrations/:zoneId
 * Registrar una nueva calibración
 */
router.post('/calibrations/:zoneId', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.zoneId, 10);
    const { sensor_type, point1_raw, point1_ref, point2_raw, point2_ref, notes } = req.body;

    // Validar campos requeridos
    if (!sensor_type) {
      return res.status(400).json({ error: 'El campo sensor_type es requerido' });
    }

    db.insertCalibration(zoneId, {
      sensor_type,
      point1_raw,
      point1_ref,
      point2_raw,
      point2_ref,
      notes,
    });

    res.status(201).json({
      mensaje: 'Calibración registrada correctamente',
      zone_id: zoneId,
      sensor_type,
    });
  } catch (err) {
    console.error(`[API] Error al registrar calibración en zona ${req.params.zoneId}:`, err.message);
    res.status(500).json({ error: 'Error al registrar calibración', detalle: err.message });
  }
});

// ============================================
// HISTORIAL DE CONFIGURACIÓN
// ============================================

/**
 * GET /api/config-history/:zoneId
 * Obtener historial de cambios de configuración de una zona
 */
router.get('/config-history/:zoneId', (req, res) => {
  try {
    const { db } = obtenerServicios(req);
    const zoneId = parseInt(req.params.zoneId, 10);
    const limit = parseInt(req.query.limit, 10) || 50;

    const historial = db.getConfigHistory(zoneId, limit);

    res.json({
      zone_id: zoneId,
      total: historial.length,
      historial,
    });
  } catch (err) {
    console.error(`[API] Error al obtener historial de config de zona ${req.params.zoneId}:`, err.message);
    res.status(500).json({ error: 'Error al obtener historial de configuración', detalle: err.message });
  }
});

// ============================================
// SALUD DEL SISTEMA
// ============================================

/**
 * GET /api/system/health
 * Verificación de salud del sistema completo
 */
router.get('/system/health', (req, res) => {
  try {
    const { db, mqtt: mqttService } = obtenerServicios(req);

    // Verificar base de datos
    let dbOk = false;
    try {
      const resultado = db.getDb().prepare('SELECT 1 as test').get();
      dbOk = resultado && resultado.test === 1;
    } catch (_err) {
      dbOk = false;
    }

    // Verificar MQTT
    const mqttOk = mqttService.isConnected();
    const mqttStats = mqttService.getStats();

    // Estado general del sistema
    const estadoGeneral = dbOk && mqttOk ? 'saludable' : 'degradado';
    const httpStatus = estadoGeneral === 'saludable' ? 200 : 503;

    res.status(httpStatus).json({
      estado: estadoGeneral,
      timestamp: new Date().toISOString(),
      servicios: {
        base_de_datos: {
          estado: dbOk ? 'operativa' : 'error',
          ruta: process.env.DB_PATH || './data/hydrocontrol.db',
        },
        mqtt: {
          estado: mqttOk ? 'conectado' : 'desconectado',
          broker: mqttStats.broker,
          client_id: mqttStats.clientId,
        },
        websocket: {
          estado: 'operativo',
          ruta: process.env.WS_PATH || '/ws',
        },
      },
      uptime_segundos: Math.floor(process.uptime()),
      memoria: {
        usada_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      },
      version_node: process.version,
    });
  } catch (err) {
    console.error('[API] Error en health check:', err.message);
    res.status(500).json({
      estado: 'error',
      mensaje: err.message,
    });
  }
});

module.exports = router;

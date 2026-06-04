/**
 * HydroControl Pro - Servicio de Base de Datos
 * ==============================================
 * Gestión de base de datos SQLite con better-sqlite3.
 * Almacena datos de sensores, eventos, calibraciones,
 * historial de configuración y alertas.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ruta de la base de datos desde variables de entorno
const DB_PATH = process.env.DB_PATH || './data/hydrocontrol.db';
const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS, 10) || 90;

/** @type {Database.Database} Instancia de la base de datos */
let db = null;

// ============================================
// Inicialización y esquema
// ============================================

/**
 * Inicializar la base de datos: crear directorio, tablas, índices y datos por defecto.
 * @returns {Database.Database} Instancia de la base de datos
 */
function initialize() {
  // Crear directorio de datos si no existe
  const dirDatos = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dirDatos)) {
    fs.mkdirSync(dirDatos, { recursive: true });
    console.log(`[DB] Directorio de datos creado: ${dirDatos}`);
  }

  // Abrir conexión a SQLite con modo WAL para mejor rendimiento concurrente
  db = new Database(path.resolve(DB_PATH));
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  // Crear todas las tablas dentro de una transacción
  const crearTablas = db.transaction(() => {
    // Tabla de zonas hidropónicas
    db.exec(`
      CREATE TABLE IF NOT EXISTS zones (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        area_m2 REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Tabla de datos de sensores (telemetría)
    db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        ph REAL,
        ec REAL,
        temperature REAL,
        water_level REAL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de datos de sensores agregados por hora
    db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_data_hourly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        ph_avg REAL,
        ph_min REAL,
        ph_max REAL,
        ec_avg REAL,
        ec_min REAL,
        ec_max REAL,
        temperature_avg REAL,
        temperature_min REAL,
        temperature_max REAL,
        water_level_avg REAL,
        sample_count INTEGER,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de datos de sensores agregados por día
    db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_data_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        ph_avg REAL,
        ph_min REAL,
        ph_max REAL,
        ec_avg REAL,
        ec_min REAL,
        ec_max REAL,
        temperature_avg REAL,
        temperature_min REAL,
        temperature_max REAL,
        water_level_avg REAL,
        sample_count INTEGER,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de eventos de bombas
    db.exec(`
      CREATE TABLE IF NOT EXISTS pump_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        pump_name TEXT NOT NULL,
        action TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de eventos de iluminación
    db.exec(`
      CREATE TABLE IF NOT EXISTS light_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        channel INTEGER NOT NULL,
        state INTEGER DEFAULT 0,
        action TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de calibraciones de sensores
    db.exec(`
      CREATE TABLE IF NOT EXISTS calibrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        sensor_type TEXT NOT NULL,
        point1_raw REAL,
        point1_ref REAL,
        point2_raw REAL,
        point2_ref REAL,
        notes TEXT,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de historial de cambios de configuración
    db.exec(`
      CREATE TABLE IF NOT EXISTS config_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        config_key TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by TEXT DEFAULT 'system',
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Tabla de alertas del sistema
    db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at TEXT,
        acknowledged_by TEXT,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // =====================
    // Crear índices para optimizar consultas frecuentes
    // =====================

    // Índices de sensor_data
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_data_zone_ts ON sensor_data(zone_id, timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_data_ts ON sensor_data(timestamp)`);

    // Índices de tablas agregadas
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_hourly_zone_ts ON sensor_data_hourly(zone_id, timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_daily_zone_ts ON sensor_data_daily(zone_id, timestamp)`);

    // Índices de pump_events
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pump_events_zone_ts ON pump_events(zone_id, timestamp)`);

    // Índices de light_events
    db.exec(`CREATE INDEX IF NOT EXISTS idx_light_events_zone_ts ON light_events(zone_id, timestamp)`);

    // Índices de calibraciones
    db.exec(`CREATE INDEX IF NOT EXISTS idx_calibrations_zone ON calibrations(zone_id)`);

    // Índices de config_history
    db.exec(`CREATE INDEX IF NOT EXISTS idx_config_history_zone ON config_history(zone_id, timestamp)`);

    // Índices de alertas
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_zone_ts ON alerts(zone_id, timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type)`);
  });

  crearTablas();

  // Insertar zonas por defecto si la tabla está vacía
  insertarZonasPorDefecto();

  console.log(`[DB] Base de datos inicializada en: ${path.resolve(DB_PATH)}`);
  return db;
}

/**
 * Insertar las 5 zonas por defecto si no existen
 */
function insertarZonasPorDefecto() {
  const conteo = db.prepare('SELECT COUNT(*) as total FROM zones').get();
  if (conteo.total > 0) return;

  const zonasPorDefecto = [
    { id: 1, name: 'Zona A - Lechugas', description: 'NFT para lechugas y verduras de hoja', area_m2: 20 },
    { id: 2, name: 'Zona B - Tomates', description: 'Sistema Dutch Bucket para tomates', area_m2: 25 },
    { id: 3, name: 'Zona C - Fresas', description: 'Torres verticales para fresas', area_m2: 15 },
    { id: 4, name: 'Zona D - Hierbas', description: 'NFT para hierbas aromáticas', area_m2: 20 },
    { id: 5, name: 'Zona E - Germinación', description: 'Área de germinación y plántulas', area_m2: 20 },
  ];

  const insertarZona = db.prepare(
    'INSERT OR IGNORE INTO zones (id, name, description, area_m2) VALUES (?, ?, ?, ?)'
  );

  const transaccion = db.transaction(() => {
    for (const zona of zonasPorDefecto) {
      insertarZona.run(zona.id, zona.name, zona.description, zona.area_m2);
    }
  });

  transaccion();
  console.log('[DB] Zonas por defecto insertadas (5 zonas, 100m² total).');
}

// ============================================
// Métodos de zonas
// ============================================

/**
 * Obtener todas las zonas activas
 * @returns {Array} Lista de zonas
 */
function getZones() {
  return db.prepare('SELECT * FROM zones ORDER BY id').all();
}

/**
 * Obtener una zona por su ID
 * @param {number} zoneId - ID de la zona
 * @returns {Object|undefined} Datos de la zona
 */
function getZoneById(zoneId) {
  return db.prepare('SELECT * FROM zones WHERE id = ?').get(zoneId);
}

/**
 * Actualizar información de una zona
 * @param {number} zoneId - ID de la zona
 * @param {Object} datos - Campos a actualizar (name, description, area_m2, active)
 * @returns {Object} Resultado de la actualización
 */
function updateZone(zoneId, datos) {
  const campos = [];
  const valores = [];

  if (datos.name !== undefined) { campos.push('name = ?'); valores.push(datos.name); }
  if (datos.description !== undefined) { campos.push('description = ?'); valores.push(datos.description); }
  if (datos.area_m2 !== undefined) { campos.push('area_m2 = ?'); valores.push(datos.area_m2); }
  if (datos.active !== undefined) { campos.push('active = ?'); valores.push(datos.active ? 1 : 0); }

  campos.push("updated_at = datetime('now')");
  valores.push(zoneId);

  const sql = `UPDATE zones SET ${campos.join(', ')} WHERE id = ?`;
  return db.prepare(sql).run(...valores);
}

// ============================================
// Métodos de datos de sensores
// ============================================

/**
 * Insertar lectura de sensores
 * @param {number} zoneId - ID de la zona
 * @param {Object} datos - Lecturas: { ph, ec, temperature, water_level }
 * @param {string} [timestamp] - Timestamp ISO (opcional, usa fecha actual si no se proporciona)
 * @returns {Object} Resultado de la inserción
 */
function insertSensorData(zoneId, datos, timestamp = null) {
  const ts = timestamp || new Date().toISOString();
  return db.prepare(
    'INSERT INTO sensor_data (zone_id, timestamp, ph, ec, temperature, water_level) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(zoneId, ts, datos.ph || null, datos.ec || null, datos.temperature || null, datos.water_level || null);
}

/**
 * Obtener la lectura más reciente de una zona
 * @param {number} zoneId - ID de la zona
 * @returns {Object|undefined} Última lectura de sensores
 */
function getLatestSensorData(zoneId) {
  return db.prepare(
    'SELECT * FROM sensor_data WHERE zone_id = ? ORDER BY timestamp DESC LIMIT 1'
  ).get(zoneId);
}

/**
 * Obtener historial de sensores con resolución adaptativa
 * @param {number} zoneId - ID de la zona
 * @param {string} from - Fecha de inicio ISO
 * @param {string} to - Fecha de fin ISO
 * @param {string} [resolution] - Resolución: 'raw', 'hourly', 'daily', 'auto'
 * @returns {Array} Datos históricos de sensores
 */
function getSensorHistory(zoneId, from, to, resolution = 'auto') {
  // Determinar resolución automática basada en rango de tiempo
  if (resolution === 'auto') {
    const diffMs = new Date(to) - new Date(from);
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras <= 24) {
      resolution = 'raw';
    } else if (diffHoras <= 168) { // 7 días
      resolution = 'hourly';
    } else {
      resolution = 'daily';
    }
  }

  switch (resolution) {
    case 'hourly':
      return db.prepare(`
        SELECT * FROM sensor_data_hourly
        WHERE zone_id = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
      `).all(zoneId, from, to);

    case 'daily':
      return db.prepare(`
        SELECT * FROM sensor_data_daily
        WHERE zone_id = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
      `).all(zoneId, from, to);

    case 'raw':
    default:
      return db.prepare(`
        SELECT * FROM sensor_data
        WHERE zone_id = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        LIMIT 5000
      `).all(zoneId, from, to);
  }
}

/**
 * Obtener datos de sensores para Grafana (formato time-series)
 * @param {number} zoneId - ID de la zona
 * @param {string} metric - Métrica: 'ph', 'ec', 'temperature', 'water_level'
 * @param {string} from - Fecha de inicio ISO
 * @param {string} to - Fecha de fin ISO
 * @param {number} [maxDataPoints] - Máximo de puntos de datos
 * @returns {Array} Puntos de datos [valor, timestamp_ms]
 */
function getSensorDataForGrafana(zoneId, metric, from, to, maxDataPoints = 1000) {
  // Validar que la métrica sea válida para prevenir inyección SQL
  const metricasValidas = ['ph', 'ec', 'temperature', 'water_level'];
  if (!metricasValidas.includes(metric)) {
    throw new Error(`Métrica inválida: ${metric}`);
  }

  // Determinar tabla según el rango temporal
  const diffMs = new Date(to) - new Date(from);
  const diffHoras = diffMs / (1000 * 60 * 60);

  let tabla, columna;
  if (diffHoras <= 24) {
    tabla = 'sensor_data';
    columna = metric;
  } else if (diffHoras <= 168) {
    tabla = 'sensor_data_hourly';
    columna = metric === 'water_level' ? 'water_level_avg' : `${metric}_avg`;
  } else {
    tabla = 'sensor_data_daily';
    columna = metric === 'water_level' ? 'water_level_avg' : `${metric}_avg`;
  }

  // Consultar datos con el límite de puntos
  const filas = db.prepare(`
    SELECT ${columna} as value, timestamp
    FROM ${tabla}
    WHERE zone_id = ? AND timestamp BETWEEN ? AND ? AND ${columna} IS NOT NULL
    ORDER BY timestamp ASC
    LIMIT ?
  `).all(zoneId, from, to, maxDataPoints);

  // Convertir al formato Grafana: [valor, timestamp_unix_ms]
  return filas.map(fila => [fila.value, new Date(fila.timestamp).getTime()]);
}

// ============================================
// Métodos de eventos
// ============================================

/**
 * Insertar evento de bomba
 * @param {number} zoneId - ID de la zona
 * @param {string} pumpName - Nombre de la bomba
 * @param {string} action - Acción: 'ON', 'OFF', 'ERROR'
 * @param {number} [duration] - Duración en segundos
 * @returns {Object} Resultado de la inserción
 */
function insertPumpEvent(zoneId, pumpName, action, duration = 0) {
  return db.prepare(
    'INSERT INTO pump_events (zone_id, timestamp, pump_name, action, duration) VALUES (?, datetime("now"), ?, ?, ?)'
  ).run(zoneId, pumpName, action, duration);
}

/**
 * Insertar evento de iluminación
 * @param {number} zoneId - ID de la zona
 * @param {number} channel - Canal de iluminación
 * @param {number} state - Estado (0-255 brillo)
 * @param {string} action - Acción: 'ON', 'OFF', 'DIM'
 * @returns {Object} Resultado de la inserción
 */
function insertLightEvent(zoneId, channel, state, action) {
  return db.prepare(
    'INSERT INTO light_events (zone_id, timestamp, channel, state, action) VALUES (?, datetime("now"), ?, ?, ?)'
  ).run(zoneId, channel, state, action);
}

/**
 * Insertar evento genérico (despacha al tipo correcto)
 * @param {number} zoneId - ID de la zona
 * @param {Object} evento - Datos del evento
 */
function insertEvent(zoneId, evento) {
  if (evento.type === 'pump') {
    return insertPumpEvent(zoneId, evento.pump_name, evento.action, evento.duration);
  } else if (evento.type === 'light') {
    return insertLightEvent(zoneId, evento.channel, evento.state, evento.action);
  }
  // Tipo desconocido - registrar en log
  console.warn(`[DB] Tipo de evento desconocido: ${evento.type}`);
}

/**
 * Obtener eventos filtrados
 * @param {number} zoneId - ID de la zona
 * @param {string} [type] - Tipo: 'pump', 'light' o null para todos
 * @param {string} [from] - Fecha de inicio ISO
 * @param {string} [to] - Fecha de fin ISO
 * @param {number} [limit] - Límite de resultados
 * @returns {Array} Lista de eventos
 */
function getEvents(zoneId, type = null, from = null, to = null, limit = 100) {
  const resultados = [];

  // Obtener eventos de bombas si corresponde
  if (!type || type === 'pump') {
    let sql = 'SELECT *, "pump" as type FROM pump_events WHERE zone_id = ?';
    const params = [zoneId];

    if (from) { sql += ' AND timestamp >= ?'; params.push(from); }
    if (to) { sql += ' AND timestamp <= ?'; params.push(to); }
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    resultados.push(...db.prepare(sql).all(...params));
  }

  // Obtener eventos de luces si corresponde
  if (!type || type === 'light') {
    let sql = 'SELECT *, "light" as type FROM light_events WHERE zone_id = ?';
    const params = [zoneId];

    if (from) { sql += ' AND timestamp >= ?'; params.push(from); }
    if (to) { sql += ' AND timestamp <= ?'; params.push(to); }
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    resultados.push(...db.prepare(sql).all(...params));
  }

  // Ordenar por timestamp descendente y limitar
  resultados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return resultados.slice(0, limit);
}

// ============================================
// Métodos de calibraciones
// ============================================

/**
 * Insertar registro de calibración
 * @param {number} zoneId - ID de la zona
 * @param {Object} cal - Datos de calibración
 * @returns {Object} Resultado de la inserción
 */
function insertCalibration(zoneId, cal) {
  return db.prepare(`
    INSERT INTO calibrations (zone_id, timestamp, sensor_type, point1_raw, point1_ref, point2_raw, point2_ref, notes)
    VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?)
  `).run(zoneId, cal.sensor_type, cal.point1_raw, cal.point1_ref, cal.point2_raw, cal.point2_ref, cal.notes || null);
}

/**
 * Obtener historial de calibraciones de una zona
 * @param {number} zoneId - ID de la zona
 * @param {number} [limit] - Límite de resultados
 * @returns {Array} Historial de calibraciones
 */
function getCalibrationHistory(zoneId, limit = 50) {
  return db.prepare(
    'SELECT * FROM calibrations WHERE zone_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).all(zoneId, limit);
}

// ============================================
// Métodos de historial de configuración
// ============================================

/**
 * Insertar cambio de configuración
 * @param {number} zoneId - ID de la zona
 * @param {string} configKey - Clave de configuración
 * @param {string} oldValue - Valor anterior
 * @param {string} newValue - Nuevo valor
 * @param {string} [changedBy] - Quién realizó el cambio
 * @returns {Object} Resultado de la inserción
 */
function insertConfigChange(zoneId, configKey, oldValue, newValue, changedBy = 'system') {
  return db.prepare(`
    INSERT INTO config_history (zone_id, timestamp, config_key, old_value, new_value, changed_by)
    VALUES (?, datetime('now'), ?, ?, ?, ?)
  `).run(zoneId, configKey, String(oldValue), String(newValue), changedBy);
}

/**
 * Obtener historial de configuración de una zona
 * @param {number} zoneId - ID de la zona
 * @param {number} [limit] - Límite de resultados
 * @returns {Array} Historial de configuración
 */
function getConfigHistory(zoneId, limit = 50) {
  return db.prepare(
    'SELECT * FROM config_history WHERE zone_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).all(zoneId, limit);
}

// ============================================
// Métodos de alertas
// ============================================

/**
 * Insertar nueva alerta
 * @param {number} zoneId - ID de la zona
 * @param {string} alertType - Tipo de alerta
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Resultado de la inserción con el ID
 */
function insertAlert(zoneId, alertType, message) {
  const resultado = db.prepare(`
    INSERT INTO alerts (zone_id, timestamp, alert_type, message)
    VALUES (?, datetime('now'), ?, ?)
  `).run(zoneId, alertType, message);

  return {
    id: resultado.lastInsertRowid,
    zone_id: zoneId,
    alert_type: alertType,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: 0,
  };
}

/**
 * Obtener alertas con filtros opcionales
 * @param {Object} [filtros] - Filtros: { acknowledged, zoneId, limit }
 * @returns {Array} Lista de alertas
 */
function getAlerts(filtros = {}) {
  let sql = 'SELECT a.*, z.name as zone_name FROM alerts a LEFT JOIN zones z ON a.zone_id = z.id WHERE 1=1';
  const params = [];

  if (filtros.acknowledged !== undefined) {
    sql += ' AND a.acknowledged = ?';
    params.push(filtros.acknowledged ? 1 : 0);
  }

  if (filtros.zoneId) {
    sql += ' AND a.zone_id = ?';
    params.push(filtros.zoneId);
  }

  sql += ' ORDER BY a.timestamp DESC LIMIT ?';
  params.push(filtros.limit || 100);

  return db.prepare(sql).all(...params);
}

/**
 * Reconocer (acknowledge) una alerta
 * @param {number} alertId - ID de la alerta
 * @param {string} [acknowledgedBy] - Quién reconoció la alerta
 * @returns {Object} Resultado de la actualización
 */
function acknowledgeAlert(alertId, acknowledgedBy = 'user') {
  return db.prepare(`
    UPDATE alerts SET acknowledged = 1, acknowledged_at = datetime('now'), acknowledged_by = ?
    WHERE id = ? AND acknowledged = 0
  `).run(acknowledgedBy, alertId);
}

/**
 * Verificar si existe una alerta reciente del mismo tipo para una zona
 * @param {number} zoneId - ID de la zona
 * @param {string} alertType - Tipo de alerta
 * @param {number} [cooldownMinutos] - Período de enfriamiento en minutos
 * @returns {boolean} True si existe una alerta reciente
 */
function hasRecentAlert(zoneId, alertType, cooldownMinutos = 15) {
  const resultado = db.prepare(`
    SELECT COUNT(*) as total FROM alerts
    WHERE zone_id = ? AND alert_type = ? AND timestamp > datetime('now', ? || ' minutes')
  `).get(zoneId, alertType, `-${cooldownMinutos}`);

  return resultado.total > 0;
}

// ============================================
// Agregación de datos
// ============================================

/**
 * Agregar datos de sensores por hora (para datos mayores a 24 horas)
 */
function aggregateData() {
  console.log('[DB] Ejecutando agregación de datos...');

  const agregarPorHora = db.transaction(() => {
    // Agregar datos de las últimas 48 horas que no están ya agregados
    db.exec(`
      INSERT OR REPLACE INTO sensor_data_hourly (zone_id, timestamp, ph_avg, ph_min, ph_max, ec_avg, ec_min, ec_max, temperature_avg, temperature_min, temperature_max, water_level_avg, sample_count)
      SELECT
        zone_id,
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hora,
        AVG(ph), MIN(ph), MAX(ph),
        AVG(ec), MIN(ec), MAX(ec),
        AVG(temperature), MIN(temperature), MAX(temperature),
        AVG(water_level),
        COUNT(*)
      FROM sensor_data
      WHERE timestamp < datetime('now', '-1 hour')
        AND timestamp > datetime('now', '-48 hours')
      GROUP BY zone_id, strftime('%Y-%m-%dT%H:00:00', timestamp)
    `);
  });

  const agregarPorDia = db.transaction(() => {
    // Agregar datos diarios para datos mayores a 7 días
    db.exec(`
      INSERT OR REPLACE INTO sensor_data_daily (zone_id, timestamp, ph_avg, ph_min, ph_max, ec_avg, ec_min, ec_max, temperature_avg, temperature_min, temperature_max, water_level_avg, sample_count)
      SELECT
        zone_id,
        strftime('%Y-%m-%dT00:00:00', timestamp) as dia,
        AVG(ph_avg), MIN(ph_min), MAX(ph_max),
        AVG(ec_avg), MIN(ec_min), MAX(ec_max),
        AVG(temperature_avg), MIN(temperature_min), MAX(temperature_max),
        AVG(water_level_avg),
        SUM(sample_count)
      FROM sensor_data_hourly
      WHERE timestamp < datetime('now', '-7 days')
        AND timestamp > datetime('now', '-90 days')
      GROUP BY zone_id, strftime('%Y-%m-%dT00:00:00', timestamp)
    `);
  });

  try {
    agregarPorHora();
    agregarPorDia();
    console.log('[DB] Agregación completada.');
  } catch (err) {
    console.error('[DB] Error en agregación:', err.message);
  }
}

// ============================================
// Limpieza automática
// ============================================

/**
 * Eliminar datos crudos mayores al período de retención
 */
function cleanupOldData() {
  const dias = DATA_RETENTION_DAYS;
  console.log(`[DB] Limpiando datos crudos mayores a ${dias} días...`);

  const limpiar = db.transaction(() => {
    // Eliminar datos crudos de sensores antiguos
    const resultadoSensores = db.prepare(
      `DELETE FROM sensor_data WHERE timestamp < datetime('now', ? || ' days')`
    ).run(`-${dias}`);
    console.log(`[DB] Registros de sensor_data eliminados: ${resultadoSensores.changes}`);

    // Eliminar eventos de bombas antiguos
    const resultadoBombas = db.prepare(
      `DELETE FROM pump_events WHERE timestamp < datetime('now', ? || ' days')`
    ).run(`-${dias}`);
    console.log(`[DB] Registros de pump_events eliminados: ${resultadoBombas.changes}`);

    // Eliminar eventos de luces antiguos
    const resultadoLuces = db.prepare(
      `DELETE FROM light_events WHERE timestamp < datetime('now', ? || ' days')`
    ).run(`-${dias}`);
    console.log(`[DB] Registros de light_events eliminados: ${resultadoLuces.changes}`);

    // Eliminar alertas reconocidas antiguas (mayores a 30 días)
    const resultadoAlertas = db.prepare(
      `DELETE FROM alerts WHERE acknowledged = 1 AND timestamp < datetime('now', '-30 days')`
    ).run();
    console.log(`[DB] Alertas reconocidas antiguas eliminadas: ${resultadoAlertas.changes}`);

    // Eliminar datos horarios mayores a 365 días
    const resultadoHorarios = db.prepare(
      `DELETE FROM sensor_data_hourly WHERE timestamp < datetime('now', '-365 days')`
    ).run();
    console.log(`[DB] Registros horarios eliminados: ${resultadoHorarios.changes}`);
  });

  limpiar();
  console.log('[DB] Limpieza completada.');
}

// ============================================
// Métodos de utilidad
// ============================================

/**
 * Obtener la última lectura de cada zona para el dashboard global
 * @returns {Array} Estado actual de todas las zonas
 */
function getDashboardSummary() {
  return db.prepare(`
    SELECT
      z.id as zone_id,
      z.name as zone_name,
      z.description,
      z.area_m2,
      z.active,
      sd.ph,
      sd.ec,
      sd.temperature,
      sd.water_level,
      sd.timestamp as last_reading,
      (SELECT COUNT(*) FROM alerts WHERE zone_id = z.id AND acknowledged = 0) as active_alerts
    FROM zones z
    LEFT JOIN sensor_data sd ON sd.id = (
      SELECT id FROM sensor_data WHERE zone_id = z.id ORDER BY timestamp DESC LIMIT 1
    )
    ORDER BY z.id
  `).all();
}

/**
 * Obtener eventos como anotaciones para Grafana
 * @param {string} from - Fecha de inicio ISO
 * @param {string} to - Fecha de fin ISO
 * @param {number} [zoneId] - ID de zona (opcional)
 * @returns {Array} Eventos formateados como anotaciones
 */
function getAnnotations(from, to, zoneId = null) {
  const anotaciones = [];

  // Eventos de bombas como anotaciones
  let sqlBombas = `
    SELECT pe.*, z.name as zone_name
    FROM pump_events pe
    LEFT JOIN zones z ON pe.zone_id = z.id
    WHERE pe.timestamp BETWEEN ? AND ?
  `;
  const paramsBombas = [from, to];

  if (zoneId) {
    sqlBombas += ' AND pe.zone_id = ?';
    paramsBombas.push(zoneId);
  }
  sqlBombas += ' ORDER BY pe.timestamp DESC LIMIT 200';

  const eventosBombas = db.prepare(sqlBombas).all(...paramsBombas);
  for (const e of eventosBombas) {
    anotaciones.push({
      time: new Date(e.timestamp).getTime(),
      title: `Bomba: ${e.pump_name}`,
      text: `${e.action} - Zona ${e.zone_name} (Duración: ${e.duration}s)`,
      tags: ['bomba', e.action.toLowerCase(), `zona-${e.zone_id}`],
    });
  }

  // Alertas como anotaciones
  let sqlAlertas = `
    SELECT a.*, z.name as zone_name
    FROM alerts a
    LEFT JOIN zones z ON a.zone_id = z.id
    WHERE a.timestamp BETWEEN ? AND ?
  `;
  const paramsAlertas = [from, to];

  if (zoneId) {
    sqlAlertas += ' AND a.zone_id = ?';
    paramsAlertas.push(zoneId);
  }
  sqlAlertas += ' ORDER BY a.timestamp DESC LIMIT 200';

  const alertas = db.prepare(sqlAlertas).all(...paramsAlertas);
  for (const a of alertas) {
    anotaciones.push({
      time: new Date(a.timestamp).getTime(),
      title: `Alerta: ${a.alert_type}`,
      text: `${a.message} - Zona ${a.zone_name}`,
      tags: ['alerta', a.alert_type.toLowerCase(), `zona-${a.zone_id}`],
    });
  }

  return anotaciones.sort((a, b) => b.time - a.time);
}

/**
 * Cerrar la conexión a la base de datos
 */
function close() {
  if (db) {
    db.close();
    console.log('[DB] Base de datos cerrada correctamente.');
  }
}

/**
 * Obtener la instancia cruda de la base de datos (para uso avanzado)
 * @returns {Database.Database} Instancia de la base de datos
 */
function getDb() {
  return db;
}

// ============================================
// Exportar todas las funciones
// ============================================
module.exports = {
  initialize,
  close,
  getDb,

  // Zonas
  getZones,
  getZoneById,
  updateZone,

  // Datos de sensores
  insertSensorData,
  getLatestSensorData,
  getSensorHistory,
  getSensorDataForGrafana,

  // Eventos
  insertEvent,
  insertPumpEvent,
  insertLightEvent,
  getEvents,

  // Calibraciones
  insertCalibration,
  getCalibrationHistory,

  // Configuración
  insertConfigChange,
  getConfigHistory,

  // Alertas
  insertAlert,
  getAlerts,
  acknowledgeAlert,
  hasRecentAlert,

  // Mantenimiento
  aggregateData,
  cleanupOldData,

  // Dashboard y Grafana
  getDashboardSummary,
  getAnnotations,
};

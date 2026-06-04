/**
 * HydroControl Pro - Servicio de Alertas
 * ========================================
 * Sistema de alertas basado en umbrales configurables.
 * Verifica valores de sensores y genera alertas cuando
 * se exceden los límites establecidos.
 */

'use strict';

/** @type {Object} Referencia al servicio de base de datos */
let database = null;

/** @type {Function} Función para broadcast por WebSocket */
let broadcastWS = null;

/**
 * Umbrales por defecto para alertas de sensores.
 * Cada umbral define un rango aceptable [min, max].
 * Se pueden personalizar por zona en el futuro.
 */
const umbralesPorDefecto = {
  ph: { min: 5.5, max: 7.0 },
  ec: { min: 0.5, max: 3.0 },
  temperature: { min: 18, max: 32 },
};

/**
 * Período de enfriamiento en minutos.
 * No se repite la misma alerta para la misma zona dentro de este período.
 */
const COOLDOWN_MINUTOS = 15;

/**
 * Mapeo de métricas a tipos de alerta
 */
const TIPOS_ALERTA = {
  ph: { high: 'pH_HIGH', low: 'pH_LOW' },
  ec: { high: 'EC_HIGH', low: 'EC_LOW' },
  temperature: { high: 'TEMP_HIGH', low: 'TEMP_LOW' },
};

/**
 * Mensajes descriptivos para cada tipo de alerta
 */
const MENSAJES_ALERTA = {
  pH_HIGH: (valor, max, zona) => `pH elevado (${valor}) en zona ${zona}. Máximo: ${max}`,
  pH_LOW: (valor, min, zona) => `pH bajo (${valor}) en zona ${zona}. Mínimo: ${min}`,
  EC_HIGH: (valor, max, zona) => `EC elevada (${valor} mS/cm) en zona ${zona}. Máximo: ${max}`,
  EC_LOW: (valor, min, zona) => `EC baja (${valor} mS/cm) en zona ${zona}. Mínimo: ${min}`,
  TEMP_HIGH: (valor, max, zona) => `Temperatura alta (${valor}°C) en zona ${zona}. Máximo: ${max}°C`,
  TEMP_LOW: (valor, min, zona) => `Temperatura baja (${valor}°C) en zona ${zona}. Mínimo: ${min}°C`,
  PUMP_TIMEOUT: (_v, _l, zona) => `Tiempo de espera excedido en bomba de zona ${zona}`,
  SENSOR_OFFLINE: (_v, _l, zona) => `Sensores sin respuesta en zona ${zona}`,
};

/**
 * Umbrales personalizados por zona.
 * Permite diferentes rangos para cada zona según el cultivo.
 * @type {Object<number, Object>}
 */
const umbralesPorZona = {};

// ============================================
// Inicialización
// ============================================

/**
 * Inicializar el servicio de alertas
 * @param {Object} db - Instancia del servicio de base de datos
 * @param {Function} wsBroadcast - Función de broadcast WebSocket
 */
function initialize(db, wsBroadcast) {
  database = db;
  broadcastWS = wsBroadcast;
  console.log('[ALERTAS] Servicio de alertas inicializado.');
  console.log(`[ALERTAS] Umbrales por defecto - pH: ${umbralesPorDefecto.ph.min}-${umbralesPorDefecto.ph.max}, ` +
    `EC: ${umbralesPorDefecto.ec.min}-${umbralesPorDefecto.ec.max}, ` +
    `Temp: ${umbralesPorDefecto.temperature.min}-${umbralesPorDefecto.temperature.max}°C`);
  console.log(`[ALERTAS] Período de enfriamiento: ${COOLDOWN_MINUTOS} minutos`);
}

// ============================================
// Verificación de umbrales
// ============================================

/**
 * Verificar valores de sensores contra umbrales configurados
 * @param {number} zoneId - ID de la zona
 * @param {Object} datos - Lectura de sensores: { ph, ec, temperature, water_level }
 */
function checkThresholds(zoneId, datos) {
  // Obtener umbrales de la zona o usar los por defecto
  const umbrales = umbralesPorZona[zoneId] || umbralesPorDefecto;

  // Verificar cada métrica configurada
  for (const [metrica, limites] of Object.entries(umbrales)) {
    const valor = datos[metrica];

    // Saltar si el valor es nulo o indefinido
    if (valor === null || valor === undefined) continue;

    const tipos = TIPOS_ALERTA[metrica];
    if (!tipos) continue;

    // Verificar si el valor supera el máximo
    if (valor > limites.max) {
      crearAlertaConCooldown(zoneId, tipos.high, valor, limites.max);
    }

    // Verificar si el valor está por debajo del mínimo
    if (valor < limites.min) {
      crearAlertaConCooldown(zoneId, tipos.low, valor, limites.min);
    }
  }
}

/**
 * Crear alerta respetando el período de enfriamiento
 * @param {number} zoneId - ID de la zona
 * @param {string} alertType - Tipo de alerta
 * @param {number} valor - Valor que disparó la alerta
 * @param {number} limite - Límite que fue excedido
 */
function crearAlertaConCooldown(zoneId, alertType, valor, limite) {
  // Verificar si ya existe una alerta reciente del mismo tipo
  if (database.hasRecentAlert(zoneId, alertType, COOLDOWN_MINUTOS)) {
    return; // Está en período de enfriamiento, no crear otra
  }

  // Generar mensaje descriptivo
  const generarMensaje = MENSAJES_ALERTA[alertType];
  const mensaje = generarMensaje
    ? generarMensaje(valor, limite, zoneId)
    : `Alerta ${alertType} en zona ${zoneId}: valor ${valor}, límite ${limite}`;

  // Crear la alerta
  createAlert(zoneId, alertType, mensaje);
}

// ============================================
// Creación de alertas
// ============================================

/**
 * Crear una nueva alerta en el sistema
 * @param {number} zoneId - ID de la zona
 * @param {string} alertType - Tipo de alerta
 * @param {string} message - Mensaje descriptivo
 * @returns {Object|null} Alerta creada o null si está en cooldown
 */
function createAlert(zoneId, alertType, message) {
  // Verificar cooldown para alertas creadas externamente también
  if (database.hasRecentAlert(zoneId, alertType, COOLDOWN_MINUTOS)) {
    return null;
  }

  try {
    // Insertar alerta en la base de datos
    const alerta = database.insertAlert(zoneId, alertType, message);
    console.log(`[ALERTAS] Nueva alerta - Zona ${zoneId}: ${alertType} - ${message}`);

    // Difundir alerta por WebSocket a todos los clientes
    if (broadcastWS) {
      broadcastWS('alerta', alerta, zoneId);
    }

    return alerta;
  } catch (err) {
    console.error(`[ALERTAS] Error al crear alerta para zona ${zoneId}:`, err.message);
    return null;
  }
}

// ============================================
// Gestión de umbrales
// ============================================

/**
 * Establecer umbrales personalizados para una zona específica
 * @param {number} zoneId - ID de la zona
 * @param {Object} umbrales - Nuevos umbrales: { ph: {min, max}, ec: {min, max}, temperature: {min, max} }
 */
function setThresholds(zoneId, umbrales) {
  // Validar y fusionar con umbrales por defecto
  const nuevosUmbrales = { ...umbralesPorDefecto };

  for (const [metrica, limites] of Object.entries(umbrales)) {
    if (nuevosUmbrales[metrica]) {
      if (typeof limites.min === 'number') nuevosUmbrales[metrica].min = limites.min;
      if (typeof limites.max === 'number') nuevosUmbrales[metrica].max = limites.max;

      // Validar que min < max
      if (nuevosUmbrales[metrica].min >= nuevosUmbrales[metrica].max) {
        console.error(`[ALERTAS] Umbral inválido para ${metrica}: min (${nuevosUmbrales[metrica].min}) >= max (${nuevosUmbrales[metrica].max})`);
        return false;
      }
    }
  }

  umbralesPorZona[zoneId] = nuevosUmbrales;
  console.log(`[ALERTAS] Umbrales actualizados para zona ${zoneId}:`, JSON.stringify(nuevosUmbrales));

  // Registrar el cambio en el historial de configuración
  if (database) {
    database.insertConfigChange(
      zoneId,
      'alert_thresholds',
      JSON.stringify(umbralesPorDefecto),
      JSON.stringify(nuevosUmbrales),
      'user'
    );
  }

  return true;
}

/**
 * Obtener los umbrales activos para una zona
 * @param {number} zoneId - ID de la zona
 * @returns {Object} Umbrales configurados
 */
function getThresholds(zoneId) {
  return umbralesPorZona[zoneId] || { ...umbralesPorDefecto };
}

/**
 * Obtener los umbrales por defecto del sistema
 * @returns {Object} Umbrales por defecto
 */
function getDefaultThresholds() {
  return { ...umbralesPorDefecto };
}

// ============================================
// Exportar funciones del servicio
// ============================================
module.exports = {
  initialize,
  checkThresholds,
  createAlert,
  setThresholds,
  getThresholds,
  getDefaultThresholds,
};

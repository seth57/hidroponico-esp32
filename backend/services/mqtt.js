/**
 * HydroControl Pro - Servicio MQTT
 * ==================================
 * Cliente MQTT para comunicación con nodos ESP32.
 * Se suscribe a datos de sensores y eventos, y publica
 * comandos y configuraciones a las zonas.
 */

'use strict';

const mqtt = require('mqtt');

// Configuración del broker MQTT
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `hydrocontrol-server-${Date.now()}`;
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// Tópicos MQTT del sistema
const TOPICS = {
  SENSORS: 'hydro/zone/+/sensors',    // Telemetría de nodos ESP32
  EVENTS: 'hydro/zone/+/events',      // Eventos de nodos ESP32
  COMMANDS: 'hydro/zone/{id}/commands', // Comandos HACIA los ESP32
  CONFIG: 'hydro/zone/{id}/config',    // Actualizaciones de configuración
};

/** @type {mqtt.MqttClient} Cliente MQTT */
let client = null;

/** @type {boolean} Estado de conexión */
let connected = false;

/** @type {Object} Referencia al servicio de base de datos */
let database = null;

/** @type {Object} Referencia al servicio de alertas */
let alertService = null;

/** @type {Function} Función para broadcast por WebSocket */
let broadcastWS = null;

/** @type {Object} Última lectura por zona para detección de desconexión */
const ultimaLecturaPorZona = {};

/** @type {number} Intervalo de verificación de sensores offline */
let intervaloCheckOffline = null;

// ============================================
// Inicialización
// ============================================

/**
 * Inicializar el servicio MQTT
 * @param {Object} db - Instancia del servicio de base de datos
 * @param {Object} alerts - Instancia del servicio de alertas
 * @param {Function} wsBroadcast - Función de broadcast WebSocket
 */
function initialize(db, alerts, wsBroadcast) {
  database = db;
  alertService = alerts;
  broadcastWS = wsBroadcast;

  // Opciones de conexión MQTT
  const opciones = {
    clientId: MQTT_CLIENT_ID,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,    // Reintentar cada 5 segundos
    keepalive: 60,
  };

  // Agregar credenciales si están configuradas
  if (MQTT_USERNAME) opciones.username = MQTT_USERNAME;
  if (MQTT_PASSWORD) opciones.password = MQTT_PASSWORD;

  // Crear conexión al broker
  console.log(`[MQTT] Conectando a ${MQTT_BROKER}...`);
  client = mqtt.connect(MQTT_BROKER, opciones);

  // ============================================
  // Manejadores de eventos de conexión
  // ============================================

  client.on('connect', () => {
    connected = true;
    console.log('[MQTT] Conectado al broker exitosamente.');

    // Suscribirse a tópicos de telemetría y eventos
    const topicosASuscribir = [
      TOPICS.SENSORS,
      TOPICS.EVENTS,
    ];

    client.subscribe(topicosASuscribir, { qos: 1 }, (err, granted) => {
      if (err) {
        console.error('[MQTT] Error al suscribirse:', err.message);
        return;
      }
      console.log('[MQTT] Suscripciones activas:');
      granted.forEach(sub => console.log(`  - ${sub.topic} (QoS ${sub.qos})`));
    });

    // Notificar a clientes WebSocket que MQTT está conectado
    if (broadcastWS) {
      broadcastWS('mqtt_estado', { conectado: true });
    }
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Intentando reconexión al broker...');
  });

  client.on('close', () => {
    connected = false;
    console.log('[MQTT] Conexión cerrada.');
    if (broadcastWS) {
      broadcastWS('mqtt_estado', { conectado: false });
    }
  });

  client.on('offline', () => {
    connected = false;
    console.log('[MQTT] Cliente fuera de línea.');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error en la conexión:', err.message);
  });

  // ============================================
  // Manejador de mensajes entrantes
  // ============================================
  client.on('message', (topic, payload) => {
    try {
      procesarMensaje(topic, payload);
    } catch (err) {
      console.error(`[MQTT] Error al procesar mensaje de ${topic}:`, err.message);
    }
  });

  // ============================================
  // Verificar sensores offline periódicamente
  // ============================================
  intervaloCheckOffline = setInterval(() => {
    verificarSensoresOffline();
  }, 60000); // Cada minuto
}

// ============================================
// Procesamiento de mensajes
// ============================================

/**
 * Procesar mensaje MQTT entrante
 * @param {string} topic - Tópico del mensaje
 * @param {Buffer} payload - Contenido del mensaje
 */
function procesarMensaje(topic, payload) {
  // Parsear el payload JSON
  let datos;
  try {
    datos = JSON.parse(payload.toString());
  } catch (err) {
    console.error(`[MQTT] Payload no es JSON válido en ${topic}:`, payload.toString().substring(0, 100));
    return;
  }

  // Extraer el ID de zona del tópico: hydro/zone/{id}/sensors
  const partes = topic.split('/');
  const zoneId = parseInt(partes[2], 10);

  if (isNaN(zoneId)) {
    console.error(`[MQTT] ID de zona inválido en tópico: ${topic}`);
    return;
  }

  // Determinar el tipo de mensaje según el tópico
  const tipoMensaje = partes[3]; // 'sensors' o 'events'

  switch (tipoMensaje) {
    case 'sensors':
      procesarDatosSensores(zoneId, datos);
      break;

    case 'events':
      procesarEvento(zoneId, datos);
      break;

    default:
      console.warn(`[MQTT] Tipo de mensaje desconocido: ${tipoMensaje}`);
  }
}

/**
 * Procesar datos de telemetría de sensores
 * @param {number} zoneId - ID de la zona
 * @param {Object} datos - Datos de sensores: { ph, ec, temperature, water_level }
 */
function procesarDatosSensores(zoneId, datos) {
  // Registrar última lectura para detección de offline
  ultimaLecturaPorZona[zoneId] = Date.now();

  // Validar datos antes de almacenar
  const datosValidados = {
    ph: validarNumero(datos.ph, 0, 14),
    ec: validarNumero(datos.ec, 0, 20),
    temperature: validarNumero(datos.temperature, -10, 60),
    water_level: validarNumero(datos.water_level, 0, 100),
  };

  // Almacenar en la base de datos
  try {
    database.insertSensorData(zoneId, datosValidados);
  } catch (err) {
    console.error(`[MQTT] Error al almacenar datos de sensores para zona ${zoneId}:`, err.message);
  }

  // Verificar umbrales y generar alertas si es necesario
  if (alertService) {
    alertService.checkThresholds(zoneId, datosValidados);
  }

  // Difundir datos en tiempo real por WebSocket
  if (broadcastWS) {
    broadcastWS('sensor_data', datosValidados, zoneId);
  }
}

/**
 * Procesar evento recibido de un nodo ESP32
 * @param {number} zoneId - ID de la zona
 * @param {Object} evento - Datos del evento
 */
function procesarEvento(zoneId, evento) {
  console.log(`[MQTT] Evento recibido - Zona ${zoneId}: ${evento.type} - ${evento.action}`);

  // Almacenar evento en la base de datos
  try {
    database.insertEvent(zoneId, evento);
  } catch (err) {
    console.error(`[MQTT] Error al almacenar evento para zona ${zoneId}:`, err.message);
  }

  // Verificar condiciones de alerta en eventos
  if (alertService && evento.type === 'pump' && evento.action === 'ERROR') {
    alertService.createAlert(zoneId, 'PUMP_TIMEOUT', `Error en bomba ${evento.pump_name} de zona ${zoneId}`);
  }

  // Difundir evento por WebSocket
  if (broadcastWS) {
    broadcastWS('evento', evento, zoneId);
  }
}

/**
 * Validar que un valor numérico esté dentro del rango esperado
 * @param {*} valor - Valor a validar
 * @param {number} min - Valor mínimo aceptable
 * @param {number} max - Valor máximo aceptable
 * @returns {number|null} Valor validado o null si es inválido
 */
function validarNumero(valor, min, max) {
  const num = parseFloat(valor);
  if (isNaN(num) || num < min || num > max) return null;
  return Math.round(num * 100) / 100; // Redondear a 2 decimales
}

// ============================================
// Publicación de mensajes
// ============================================

/**
 * Enviar comando a un nodo ESP32 de una zona específica
 * @param {number} zoneId - ID de la zona destino
 * @param {Object} comando - Objeto de comando a enviar
 * @returns {boolean} True si el mensaje fue encolado exitosamente
 */
function sendCommand(zoneId, comando) {
  if (!client || !connected) {
    console.error('[MQTT] No se puede enviar comando: cliente no conectado.');
    return false;
  }

  const topic = TOPICS.COMMANDS.replace('{id}', zoneId);
  const payload = JSON.stringify({
    ...comando,
    timestamp: new Date().toISOString(),
    source: 'server',
  });

  client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) {
      console.error(`[MQTT] Error al publicar comando en ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] Comando enviado a zona ${zoneId}: ${JSON.stringify(comando)}`);
    }
  });

  return true;
}

/**
 * Enviar actualización de configuración a una zona
 * @param {number} zoneId - ID de la zona destino
 * @param {Object} config - Objeto de configuración
 * @returns {boolean} True si el mensaje fue encolado exitosamente
 */
function sendConfig(zoneId, config) {
  if (!client || !connected) {
    console.error('[MQTT] No se puede enviar configuración: cliente no conectado.');
    return false;
  }

  const topic = TOPICS.CONFIG.replace('{id}', zoneId);
  const payload = JSON.stringify({
    ...config,
    timestamp: new Date().toISOString(),
    source: 'server',
  });

  // Configuración se envía con retain=true para que los nodos
  // que se reconecten reciban la última configuración
  client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
    if (err) {
      console.error(`[MQTT] Error al publicar config en ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] Configuración enviada a zona ${zoneId}`);
    }
  });

  return true;
}

// ============================================
// Verificación de sensores offline
// ============================================

/**
 * Verificar si algún sensor de zona está offline (sin datos por más de 5 minutos)
 */
function verificarSensoresOffline() {
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos sin datos = offline
  const ahora = Date.now();

  for (const [zonaStr, ultimaLectura] of Object.entries(ultimaLecturaPorZona)) {
    const zoneId = parseInt(zonaStr, 10);
    const tiempoSinDatos = ahora - ultimaLectura;

    if (tiempoSinDatos > TIMEOUT_MS) {
      const minutosOffline = Math.round(tiempoSinDatos / 60000);
      if (alertService) {
        alertService.createAlert(
          zoneId,
          'SENSOR_OFFLINE',
          `Sensores de zona ${zoneId} sin datos por ${minutosOffline} minutos`
        );
      }
    }
  }
}

// ============================================
// Estado y utilidades
// ============================================

/**
 * Verificar si el cliente MQTT está conectado
 * @returns {boolean} Estado de conexión
 */
function isConnected() {
  return connected;
}

/**
 * Obtener estadísticas del servicio MQTT
 * @returns {Object} Estadísticas de conexión
 */
function getStats() {
  return {
    conectado: connected,
    broker: MQTT_BROKER,
    clientId: MQTT_CLIENT_ID,
    ultimasLecturas: { ...ultimaLecturaPorZona },
    topicsSuscritos: [TOPICS.SENSORS, TOPICS.EVENTS],
  };
}

/**
 * Desconectar el cliente MQTT de forma limpia
 */
function disconnect() {
  if (intervaloCheckOffline) {
    clearInterval(intervaloCheckOffline);
    intervaloCheckOffline = null;
  }

  if (client) {
    client.end(true, () => {
      console.log('[MQTT] Cliente desconectado correctamente.');
    });
    connected = false;
  }
}

// ============================================
// Exportar funciones del servicio
// ============================================
module.exports = {
  initialize,
  sendCommand,
  sendConfig,
  isConnected,
  getStats,
  disconnect,
};

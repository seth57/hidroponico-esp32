/**
 * HydroControl Pro - Servidor Central
 * ====================================
 * Servidor Node.js para gestión multi-zona de sistema hidropónico.
 * Integra MQTT, SQLite, WebSocket y API REST con soporte para Grafana.
 */

'use strict';

// Cargar variables de entorno antes de todo
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');

// Servicios internos
const database = require('./services/database');
const mqttService = require('./services/mqtt');
const alertService = require('./services/alerts');

// Rutas
const apiRoutes = require('./routes/api');
const grafanaRoutes = require('./routes/grafana');

// Configuración del puerto
const PORT = parseInt(process.env.PORT, 10) || 3000;
const WS_PATH = process.env.WS_PATH || '/ws';

// ============================================
// Inicialización de Express
// ============================================
const app = express();

// Middleware de parseo de JSON con límite de tamaño
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Habilitar CORS para todas las solicitudes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Grafana-Org-Id'],
}));

// Registro de solicitudes HTTP con Morgan
app.use(morgan('combined'));

// ============================================
// Montar rutas
// ============================================

// API REST principal
app.use('/api', apiRoutes);

// Endpoint de Grafana SimpleJSON datasource
app.use('/api/grafana', grafanaRoutes);

// Ruta raíz de verificación
app.get('/', (_req, res) => {
  res.json({
    servicio: 'HydroControl Pro',
    version: '1.0.0',
    estado: 'operativo',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Manejo de errores globales
// ============================================

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: 'El recurso solicitado no existe en esta API.',
  });
});

// Manejador de errores centralizado
app.use((err, _req, res, _next) => {
  console.error('[ERROR] Error no manejado en Express:', err);
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'production'
      ? 'Ocurrió un error inesperado.'
      : err.message,
  });
});

// ============================================
// Crear servidor HTTP y WebSocket
// ============================================
const server = http.createServer(app);

// Configurar servidor WebSocket para dashboard en tiempo real
const wss = new WebSocketServer({
  server,
  path: WS_PATH,
});

// Mapa de clientes WebSocket conectados
const wsClients = new Set();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] Nuevo cliente conectado desde ${clientIp}`);
  wsClients.add(ws);

  // Enviar estado inicial al cliente
  ws.send(JSON.stringify({
    tipo: 'conexion',
    mensaje: 'Conectado a HydroControl Pro',
    timestamp: new Date().toISOString(),
    mqttConectado: mqttService.isConnected(),
  }));

  ws.on('message', (data) => {
    try {
      const mensaje = JSON.parse(data.toString());
      manejarMensajeWS(ws, mensaje);
    } catch (err) {
      console.error('[WS] Error al parsear mensaje del cliente:', err.message);
      ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Formato de mensaje inválido' }));
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Cliente desconectado: ${clientIp}`);
    wsClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error en conexión con ${clientIp}:`, err.message);
    wsClients.delete(ws);
  });
});

/**
 * Manejar mensajes entrantes de clientes WebSocket
 * @param {WebSocket} ws - Conexión WebSocket del cliente
 * @param {Object} mensaje - Mensaje parseado del cliente
 */
function manejarMensajeWS(ws, mensaje) {
  switch (mensaje.tipo) {
    case 'suscribir_zona':
      // Marcar el socket con las zonas a las que se suscribe
      ws._zonasSubscritas = ws._zonasSubscritas || new Set();
      ws._zonasSubscritas.add(mensaje.zonaId);
      ws.send(JSON.stringify({
        tipo: 'suscripcion_confirmada',
        zonaId: mensaje.zonaId,
      }));
      break;

    case 'desuscribir_zona':
      if (ws._zonasSubscritas) {
        ws._zonasSubscritas.delete(mensaje.zonaId);
      }
      break;

    case 'comando':
      // Enviar comando a una zona vía MQTT
      if (mensaje.zonaId && mensaje.comando) {
        mqttService.sendCommand(mensaje.zonaId, mensaje.comando);
        ws.send(JSON.stringify({
          tipo: 'comando_enviado',
          zonaId: mensaje.zonaId,
          comando: mensaje.comando,
        }));
      }
      break;

    case 'ping':
      ws.send(JSON.stringify({ tipo: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      ws.send(JSON.stringify({ tipo: 'error', mensaje: `Tipo de mensaje desconocido: ${mensaje.tipo}` }));
  }
}

/**
 * Difundir un mensaje a todos los clientes WebSocket conectados
 * @param {string} tipo - Tipo del mensaje
 * @param {Object} datos - Datos a enviar
 * @param {number|null} zonaId - ID de zona (null para broadcast global)
 */
function broadcastWS(tipo, datos, zonaId = null) {
  const mensaje = JSON.stringify({
    tipo,
    zonaId,
    datos,
    timestamp: new Date().toISOString(),
  });

  for (const ws of wsClients) {
    if (ws.readyState !== ws.OPEN) continue;

    // Si es un mensaje de zona específica, verificar suscripción
    if (zonaId !== null && ws._zonasSubscritas && ws._zonasSubscritas.size > 0) {
      if (!ws._zonasSubscritas.has(zonaId)) continue;
    }

    try {
      ws.send(mensaje);
    } catch (err) {
      console.error('[WS] Error al enviar mensaje a cliente:', err.message);
    }
  }
}

// Exportar función de broadcast para uso en otros módulos
module.exports = { broadcastWS };

// ============================================
// Inicialización de servicios
// ============================================
async function iniciarServidor() {
  try {
    console.log('==============================================');
    console.log('  HydroControl Pro - Iniciando servidor...');
    console.log('==============================================');

    // 1. Inicializar base de datos SQLite
    console.log('[DB] Inicializando base de datos...');
    database.initialize();
    console.log('[DB] Base de datos lista.');

    // 2. Configurar servicio de alertas
    console.log('[ALERTAS] Configurando servicio de alertas...');
    alertService.initialize(database, broadcastWS);
    console.log('[ALERTAS] Servicio de alertas listo.');

    // 3. Conectar al broker MQTT
    console.log('[MQTT] Conectando al broker MQTT...');
    mqttService.initialize(database, alertService, broadcastWS);
    console.log('[MQTT] Servicio MQTT iniciado.');

    // 4. Inyectar dependencias en las rutas
    app.locals.db = database;
    app.locals.mqtt = mqttService;
    app.locals.alerts = alertService;
    app.locals.broadcastWS = broadcastWS;

    // 5. Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log('==============================================');
      console.log(`  Servidor HTTP escuchando en puerto ${PORT}`);
      console.log(`  WebSocket disponible en ws://localhost:${PORT}${WS_PATH}`);
      console.log(`  API REST: http://localhost:${PORT}/api`);
      console.log(`  Grafana datasource: http://localhost:${PORT}/api/grafana`);
      console.log('==============================================');
    });

    // 6. Programar limpieza automática de datos antiguos
    const intervaloLimpieza = (parseInt(process.env.CLEANUP_INTERVAL_HOURS, 10) || 24) * 60 * 60 * 1000;
    setInterval(() => {
      console.log('[LIMPIEZA] Ejecutando limpieza automática de datos antiguos...');
      try {
        database.cleanupOldData();
        console.log('[LIMPIEZA] Limpieza completada.');
      } catch (err) {
        console.error('[LIMPIEZA] Error durante la limpieza:', err.message);
      }
    }, intervaloLimpieza);

    // 7. Programar agregación de datos
    setInterval(() => {
      try {
        database.aggregateData();
      } catch (err) {
        console.error('[AGREGACION] Error durante la agregación:', err.message);
      }
    }, 60 * 60 * 1000); // Cada hora

  } catch (err) {
    console.error('[FATAL] Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

// ============================================
// Apagado elegante
// ============================================
function apagarServidor(signal) {
  console.log(`\n[SHUTDOWN] Señal ${signal} recibida. Iniciando apagado elegante...`);

  // Cerrar conexiones WebSocket
  console.log('[SHUTDOWN] Cerrando conexiones WebSocket...');
  for (const ws of wsClients) {
    try {
      ws.send(JSON.stringify({ tipo: 'servidor_apagando', mensaje: 'El servidor se está apagando.' }));
      ws.close(1001, 'Servidor apagándose');
    } catch (_err) { /* ignorar errores al cerrar */ }
  }
  wsClients.clear();

  // Desconectar MQTT
  console.log('[SHUTDOWN] Desconectando MQTT...');
  mqttService.disconnect();

  // Cerrar base de datos
  console.log('[SHUTDOWN] Cerrando base de datos...');
  database.close();

  // Cerrar servidor HTTP
  console.log('[SHUTDOWN] Cerrando servidor HTTP...');
  server.close(() => {
    console.log('[SHUTDOWN] Servidor detenido correctamente.');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos si no se logra elegantemente
  setTimeout(() => {
    console.error('[SHUTDOWN] Forzando cierre del proceso...');
    process.exit(1);
  }, 10000);
}

// Escuchar señales de terminación
process.on('SIGINT', () => apagarServidor('SIGINT'));
process.on('SIGTERM', () => apagarServidor('SIGTERM'));

// Capturar errores no manejados
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Excepción no capturada:', err);
  apagarServidor('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Promesa rechazada no manejada:', reason);
});

// Iniciar el servidor
iniciarServidor();

/**
 * HydroControl Pro - Rutas de Grafana SimpleJSON Datasource
 * ==========================================================
 * Implementa el protocolo SimpleJSON de Grafana para permitir
 * que Grafana consulte directamente los datos del sistema
 * hidropónico sin necesidad de una base de datos intermedia.
 *
 * Endpoints requeridos por SimpleJSON:
 * - GET  /           → Health check (devuelve 200)
 * - POST /search     → Métricas disponibles
 * - POST /query      → Datos de series temporales
 * - POST /annotations→ Eventos como anotaciones
 */

'use strict';

const { Router } = require('express');
const router = Router();

// Métricas base disponibles por zona
const METRICAS_BASE = ['ph', 'ec', 'temperature', 'water_level'];

// Número total de zonas del sistema
const TOTAL_ZONAS = 5;

// ============================================
// Health check para Grafana
// ============================================

/**
 * GET /
 * Grafana utiliza este endpoint para verificar la conectividad con el datasource.
 * Debe devolver 200 OK.
 */
router.get('/', (_req, res) => {
  res.status(200).json({ estado: 'ok', datasource: 'HydroControl Pro' });
});

// ============================================
// Búsqueda de métricas disponibles
// ============================================

/**
 * POST /search
 * Devuelve la lista de métricas disponibles para Grafana.
 * Formato: "metrica:zona_id" (ej: "ph:1", "ec:2")
 * También incluye métricas globales como "ph:all"
 */
router.post('/search', (req, res) => {
  try {
    const metricas = [];
    const target = (req.body.target || '').toLowerCase();

    // Generar métricas por zona
    for (let zonaId = 1; zonaId <= TOTAL_ZONAS; zonaId++) {
      for (const metrica of METRICAS_BASE) {
        const nombreCompleto = `${metrica}:zone_${zonaId}`;

        // Filtrar por término de búsqueda si se proporciona
        if (!target || nombreCompleto.includes(target)) {
          metricas.push(nombreCompleto);
        }
      }
    }

    // Agregar métricas globales (todas las zonas combinadas)
    for (const metrica of METRICAS_BASE) {
      const nombreGlobal = `${metrica}:all`;
      if (!target || nombreGlobal.includes(target)) {
        metricas.push(nombreGlobal);
      }
    }

    res.json(metricas);
  } catch (err) {
    console.error('[GRAFANA] Error en /search:', err.message);
    res.status(500).json({ error: 'Error al buscar métricas' });
  }
});

// ============================================
// Consulta de datos de series temporales
// ============================================

/**
 * POST /query
 * Devuelve datos de series temporales en el formato que Grafana espera.
 * Body esperado: {
 *   targets: [{ target: "ph:zone_1", type: "timeserie" }],
 *   range: { from: "ISO", to: "ISO" },
 *   maxDataPoints: 1000
 * }
 */
router.post('/query', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { targets, range, maxDataPoints } = req.body;

    // Validar que hay targets y rango de tiempo
    if (!targets || !range || !range.from || !range.to) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos: targets, range' });
    }

    const from = range.from;
    const to = range.to;
    const puntoMaximos = maxDataPoints || 1000;

    const resultados = [];

    for (const targetObj of targets) {
      const targetStr = targetObj.target || targetObj;

      // Parsear el nombre del target: "metrica:zone_id"
      const partes = targetStr.split(':');
      if (partes.length !== 2) {
        console.warn(`[GRAFANA] Target con formato inválido: ${targetStr}`);
        continue;
      }

      const metrica = partes[0];
      const zonaStr = partes[1];

      // Validar que la métrica es válida
      if (!METRICAS_BASE.includes(metrica)) {
        console.warn(`[GRAFANA] Métrica desconocida: ${metrica}`);
        continue;
      }

      if (zonaStr === 'all') {
        // Consultar todas las zonas y combinar datos
        const datapoints = obtenerDatosTodasZonas(db, metrica, from, to, puntoMaximos);
        resultados.push({
          target: targetStr,
          datapoints,
        });
      } else {
        // Extraer ID de zona del formato "zone_X"
        const zoneId = parseInt(zonaStr.replace('zone_', ''), 10);
        if (isNaN(zoneId)) {
          console.warn(`[GRAFANA] ID de zona inválido: ${zonaStr}`);
          continue;
        }

        try {
          const datapoints = db.getSensorDataForGrafana(zoneId, metrica, from, to, puntoMaximos);
          resultados.push({
            target: targetStr,
            datapoints,
          });
        } catch (err) {
          console.error(`[GRAFANA] Error al consultar ${targetStr}:`, err.message);
        }
      }
    }

    res.json(resultados);
  } catch (err) {
    console.error('[GRAFANA] Error en /query:', err.message);
    res.status(500).json({ error: 'Error al consultar datos' });
  }
});

/**
 * Obtener datos combinados de todas las zonas para una métrica
 * @param {Object} db - Servicio de base de datos
 * @param {string} metrica - Nombre de la métrica
 * @param {string} from - Fecha de inicio ISO
 * @param {string} to - Fecha de fin ISO
 * @param {number} maxPuntos - Máximo de puntos de datos
 * @returns {Array} Puntos de datos [valor, timestamp_ms]
 */
function obtenerDatosTodasZonas(db, metrica, from, to, maxPuntos) {
  const todosLosDatos = [];
  const puntosPorZona = Math.floor(maxPuntos / TOTAL_ZONAS);

  for (let zonaId = 1; zonaId <= TOTAL_ZONAS; zonaId++) {
    try {
      const datos = db.getSensorDataForGrafana(zonaId, metrica, from, to, puntosPorZona);
      todosLosDatos.push(...datos);
    } catch (_err) {
      // Continuar con la siguiente zona si hay error
    }
  }

  // Ordenar por timestamp y promediar valores duplicados en el mismo momento
  todosLosDatos.sort((a, b) => a[1] - b[1]);
  return todosLosDatos.slice(0, maxPuntos);
}

// ============================================
// Anotaciones (eventos y alertas)
// ============================================

/**
 * POST /annotations
 * Devuelve eventos del sistema como anotaciones de Grafana.
 * Body esperado: {
 *   range: { from: "ISO", to: "ISO" },
 *   annotation: { name, query, ... }
 * }
 */
router.post('/annotations', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { range, annotation } = req.body;

    if (!range || !range.from || !range.to) {
      return res.status(400).json({ error: 'Rango de tiempo requerido' });
    }

    const from = range.from;
    const to = range.to;

    // Extraer zona del query de la anotación si está especificado
    let zoneId = null;
    if (annotation && annotation.query) {
      const match = annotation.query.match(/zone[_:]?(\d+)/i);
      if (match) {
        zoneId = parseInt(match[1], 10);
      }
    }

    // Obtener anotaciones de la base de datos
    const anotaciones = db.getAnnotations(from, to, zoneId);

    // Formatear para Grafana
    const resultado = anotaciones.map(a => ({
      annotation: annotation || { name: 'HydroControl Events' },
      time: a.time,
      title: a.title,
      text: a.text,
      tags: a.tags,
    }));

    res.json(resultado);
  } catch (err) {
    console.error('[GRAFANA] Error en /annotations:', err.message);
    res.status(500).json({ error: 'Error al obtener anotaciones' });
  }
});

// ============================================
// Tag keys y valores (opcional, para filtrado)
// ============================================

/**
 * POST /tag-keys
 * Devuelve las claves de tags disponibles para filtrado en Grafana
 */
router.post('/tag-keys', (_req, res) => {
  res.json([
    { type: 'string', text: 'zona' },
    { type: 'string', text: 'tipo' },
  ]);
});

/**
 * POST /tag-values
 * Devuelve los valores posibles para una clave de tag
 */
router.post('/tag-values', (req, res) => {
  const clave = req.body.key;

  if (clave === 'zona') {
    const valores = [];
    for (let i = 1; i <= TOTAL_ZONAS; i++) {
      valores.push({ text: `zona-${i}` });
    }
    res.json(valores);
  } else if (clave === 'tipo') {
    res.json([
      { text: 'bomba' },
      { text: 'alerta' },
      { text: 'luz' },
    ]);
  } else {
    res.json([]);
  }
});

module.exports = router;

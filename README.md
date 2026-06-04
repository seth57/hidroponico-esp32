# 🌿 HydroControl Pro - Sistema Hidropónico Inteligente a Gran Escala

![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-ESP32-lightgrey)

Sistema de control hidropónico profesional basado en ESP32 con monitoreo de pH/EC, control de bombas (110V/15A via SSR), iluminación y panel de control web. Diseñado para un invernadero de 100m² con 5 zonas expandibles.

## Características

- 🌡️ **Monitoreo Preciso**: Sensores industriales con ADC de 16-bits (ADS1115) e Isolators galvánicos.
- ⚡ **Potencia Segura**: Manejo de cargas de 110V/15A mediante relés de estado sólido (SSR-40DA) sin partes mecánicas móviles.
- 🌐 **UI Glassmorphism**: Panel web ultrarrápido y moderno alojado dentro del propio ESP32 (LittleFS) o en servidor Node.js.
- 📈 **Grafana Integration**: Dashboards profesionales para análisis del histórico de las 5 zonas usando Node.js + SQLite.
- 📱 **Mobile-first**: La interfaz se adapta a smartphones como una app nativa.
- 💧 **Control Autonómo**: Programador de fotoperiodo y ciclos de riego integrados, sigue operando sin conexión a internet.

## Arquitectura

```text
┌─────────────────┐       MQTT      ┌─────────────────┐       HTTP      ┌─────────────────┐
│  ESP32 Zonas 1-5│ <-------------> │  Node.js Server │ <-------------> │ Grafana / Web UI│
│  - pH, EC, Temp │                 │  - Mosquitto    │                 │ - Data Viz      │
│  - Control SSR  │                 │  - SQLite Hist  │                 │ - Control Panel │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

## Inicio Rápido (Instalación)

Consulta la carpeta `docs/` para guías paso a paso:
1. Construye el hardware siguiendo el [Esquema de Conexionado](docs/WIRING_SCHEMATIC.md).
2. Usa PlatformIO para cargar el firmware y LittleFS al ESP32.
3. Inicia el servidor de Backend con `npm install` y `npm start`.
4. Importa los dashboards de Grafana provistos en `grafana/dashboards`.
5. Calibra los sensores usando la web UI y el [Manual de Calibración](docs/CALIBRATION_GUIDE.md).

## Licencia
MIT License - Creado para control avanzado de cultivos invernaderos.

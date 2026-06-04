# 📦 Lista de Materiales (BOM) - HydroControl Pro

![BOM](https://img.shields.io/badge/BOM-completo-blue)
![Zones](https://img.shields.io/badge/zonas-5-purple)
![Currency](https://img.shields.io/badge/moneda-USD-green)

---

> [!NOTE]
> Los precios son estimaciones de referencia (2026) y pueden variar según el proveedor
> y la región. Se recomienda comprar un 10-15% adicional de componentes críticos como
> repuesto. Los precios NO incluyen envío ni impuestos de importación.

---

## 📋 Tabla de Contenidos

- [Controlador Principal](#1-controlador-principal)
- [Sensores de Proceso](#2-sensores-de-proceso)
- [ADC y Aislamiento](#3-adc-y-aislamiento-de-señal)
- [Control de Potencia](#4-control-de-potencia)
- [Iluminación](#5-iluminación)
- [Sensores Auxiliares](#6-sensores-auxiliares)
- [Protección y Seguridad](#7-protección-y-seguridad)
- [Alimentación](#8-alimentación)
- [Gabinete y Cableado](#9-gabinete-y-cableado)
- [Infraestructura de Red y Backend](#10-infraestructura-de-red-y-backend)
- [Herramientas y Consumibles](#11-herramientas-y-consumibles)
- [Resumen de Costos](#-resumen-de-costos)
- [Proveedores Recomendados](#-proveedores-recomendados)

---

## 1. Controlador Principal

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 1.1 | Microcontrolador | ESP32-WROOM-32 (DevKit V1) | 1 | 5 | $6.00 | $30.00 |
| 1.2 | Cable USB Micro-B | USB-A a Micro-B (1m) | 1 | 5 | $2.00 | $10.00 |

**Subtotal Controladores: $40.00**

---

## 2. Sensores de Proceso

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 2.1 | Sensor de pH | DFRobot Gravity pH V2 (SEN0161-V2) | 1 | 5 | $30.00 | $150.00 |
| 2.2 | Sonda de pH | Sonda BNC incluida con SEN0161-V2 | 1 | 5 | — | — |
| 2.3 | Sensor de EC | DFRobot Gravity EC V2 (DFR0300) | 1 | 5 | $35.00 | $175.00 |
| 2.4 | Sonda de EC | Sonda K=1 incluida con DFR0300 | 1 | 5 | — | — |
| 2.5 | Sensor Temperatura | DS18B20 (encapsulado sumergible, acero inox.) | 1 | 5 | $4.00 | $20.00 |

**Subtotal Sensores de Proceso: $345.00**

---

## 3. ADC y Aislamiento de Señal

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 3.1 | ADC 16-bit | ADS1115 módulo I2C | 1 | 5 | $4.00 | $20.00 |
| 3.2 | Aislador Analógico pH | DFRobot Gravity Analog Signal Isolator | 1 | 5 | $12.00 | $60.00 |
| 3.3 | Aislador Analógico EC | DFRobot Gravity Analog Signal Isolator | 1 | 5 | $12.00 | $60.00 |

**Subtotal ADC y Aislamiento: $140.00**

> [!IMPORTANT]
> Los aisladores analógicos son **esenciales** para evitar lazos de tierra entre
> las sondas de pH y EC. Sin ellos, las lecturas serán inestables e imprecisas.

---

## 4. Control de Potencia

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 4.1 | Relé Estado Sólido | SSR-40DA (DC→AC, cruce por cero) | 7 | 35 | $5.00 | $175.00 |
| 4.2 | Disipador para SSR | Disipador aluminio para SSR (riel DIN o placa) | 7 | 35 | $2.50 | $87.50 |
| 4.3 | Contactor AC | Contactor 110V bobina, 20A contactos (ej. LC1D09) | 2 | 10 | $15.00 | $150.00 |
| 4.4 | Pasta térmica | Pasta térmica para SSR-disipador | 1 | 1 | $3.00 | $3.00 |

**Subtotal Control de Potencia: $415.50**

> [!NOTE]
> Se asignan 7 SSR por zona: 6 bombas + 1 iluminación. Los contactores son
> necesarios para las bombas que excedan 5A (típicamente bomba principal y
> bomba de recirculación). El SSR activa la bobina del contactor, y los
> contactos del contactor conmutan la carga pesada.

---

## 5. Iluminación

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 5.1 | Bombilla | Bombilla incandescente/LED 60W, E27, 110V | 1 | 5 | $2.00 | $10.00 |
| 5.2 | Portalámparas | Portalámparas E27 con cable (uso exterior IP44+) | 1 | 5 | $3.00 | $15.00 |

**Subtotal Iluminación: $25.00**

---

## 6. Sensores Auxiliares

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 6.1 | Sensor de Flujo | YF-S201 (1-30 L/min, 1/2" rosca) | 1 | 5 | $4.00 | $20.00 |
| 6.2 | Sensor Nivel Ultrasónico | JSN-SR04T (resistente al agua, IP67) | 1 | 5 | $6.00 | $30.00 |

**Subtotal Sensores Auxiliares: $50.00**

---

## 7. Protección y Seguridad

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 7.1 | RC Snubber - Resistor | Resistor 100Ω 2W (para snubber SSR) | 7 | 35 | $0.10 | $3.50 |
| 7.2 | RC Snubber - Capacitor | Capacitor 0.1µF 400V X2 MKP (película) | 7 | 35 | $0.50 | $17.50 |
| 7.3 | Resistor Pull-Down | Resistor 10kΩ 1/4W (pull-down GPIO) | 7 | 35 | $0.05 | $1.75 |
| 7.4 | Resistor Pull-Up DS18B20 | Resistor 4.7kΩ 1/4W (pull-up OneWire) | 1 | 5 | $0.05 | $0.25 |
| 7.5 | Fusible por canal | Portafusible 5×20mm + fusible (valor según bomba) | 7 | 35 | $1.50 | $52.50 |
| 7.6 | Fusibles repuesto | Pack de fusibles 5×20mm (5A, 10A, 15A surtidos) | 1 | 5 | $3.00 | $15.00 |
| 7.7 | Breaker principal | Breaker termomagnético bipolar 30A, riel DIN | 1 | 5 | $10.00 | $50.00 |
| 7.8 | Botón de emergencia | Pulsador tipo seta rojo NC, montaje en panel | 1 | 5 | $6.00 | $30.00 |
| 7.9 | Varistor/Supresor (opcional) | MOV 130V (protección contra transientes de línea) | 1 | 5 | $1.50 | $7.50 |

**Subtotal Protección: $178.00**

---

## 8. Alimentación

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 8.1 | Fuente AC→5V DC | Hi-Link HLK-PM01 (5V/3W) o similar compacta | 1 | 5 | $4.00 | $20.00 |
| 8.2 | Regulador 3.3V | AMS1117-3.3V módulo (5V→3.3V para ESP32 directo) | 1 | 5 | $1.00 | $5.00 |
| 8.3 | Capacitor filtro 5V | Electrolítico 470µF 10V | 1 | 5 | $0.30 | $1.50 |
| 8.4 | Capacitor filtro 3.3V | Electrolítico 100µF 10V + cerámico 100nF | 1 | 5 | $0.30 | $1.50 |

**Subtotal Alimentación: $28.00**

> [!WARNING]
> La fuente Hi-Link opera directamente con 110V AC. Debe instalarse dentro
> del gabinete con aislamiento adecuado. Verificar que el voltaje de salida
> sea estable antes de conectar el ESP32.

---

## 9. Gabinete y Cableado

| # | Componente | Modelo | Cant/Zona | Cant/5 Zonas | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:---------:|:------------:|:------------------:|:--------------:|
| 9.1 | Gabinete eléctrico | Gabinete metálico IP65 (30×40×20cm mín.) | 1 | 5 | $35.00 | $175.00 |
| 9.2 | Riel DIN | Riel DIN 35mm (30cm) | 2 | 10 | $2.00 | $20.00 |
| 9.3 | Canaleta ranurada | Canaleta ranurada 25×40mm (30cm) | 2 | 10 | $3.00 | $30.00 |
| 9.4 | Prensaestopas | Prensaestopas PG9/PG11 IP68 (surtido) | 10 | 50 | $0.50 | $25.00 |
| 9.5 | Borneras | Borneras de conexión riel DIN, 2.5mm² | 20 | 100 | $0.60 | $60.00 |
| 9.6 | Cable AWG 14 (Línea AC) | Cable THHN AWG 14 negro (metro) | 10 | 50 | $0.40 | $20.00 |
| 9.7 | Cable AWG 14 (Neutro) | Cable THHN AWG 14 blanco (metro) | 10 | 50 | $0.40 | $20.00 |
| 9.8 | Cable AWG 12 (Tierra) | Cable THHN AWG 12 verde (metro) | 10 | 50 | $0.50 | $25.00 |
| 9.9 | Cable señal (bajo voltaje) | Cable multifilar AWG 22, 4 conductores (metro) | 15 | 75 | $0.30 | $22.50 |
| 9.10 | Terminales | Terminales de ojo, horquilla y punta (surtido) | 1 | 5 | $5.00 | $25.00 |
| 9.11 | Amarres (cintas) | Cinchos/bridas plásticas 15cm (bolsa 100) | 1 | 2 | $3.00 | $6.00 |
| 9.12 | Etiquetas | Marcadores de cable/bornera | 1 | 5 | $4.00 | $20.00 |
| 9.13 | Barra de tierra | Barra de cobre para gabinete, 8 conexiones | 1 | 5 | $5.00 | $25.00 |
| 9.14 | PCB/Protoboard | Protoboard perforada 7×9cm (para circuito de control) | 1 | 5 | $2.00 | $10.00 |

**Subtotal Gabinete y Cableado: $483.50**

---

## 10. Infraestructura de Red y Backend

> [!NOTE]
> Estos componentes son **compartidos** entre todas las zonas (se compran una sola vez).

| # | Componente | Modelo | Cantidad | Precio Unit. (USD) | Subtotal (USD) |
|---|-----------|--------|:--------:|:------------------:|:--------------:|
| 10.1 | Router WiFi | Router WiFi 2.4GHz (cobertura invernadero) | 1 | $30.00 | $30.00 |
| 10.2 | Servidor Backend | Mini PC / Raspberry Pi 4 (4GB) o PC reciclada | 1 | $60.00 | $60.00 |
| 10.3 | Tarjeta MicroSD | MicroSD 32GB clase 10 (para RPi) | 1 | $8.00 | $8.00 |
| 10.4 | Fuente RPi/Mini PC | Fuente 5V 3A USB-C (para RPi 4) | 1 | $10.00 | $10.00 |
| 10.5 | Cable Ethernet | Cable Ethernet Cat6 (2m) | 1 | $3.00 | $3.00 |
| 10.6 | Repetidor WiFi (opcional) | Repetidor WiFi 2.4GHz (si la cobertura no alcanza) | 1 | $15.00 | $15.00 |

**Subtotal Infraestructura: $126.00**

---

## 11. Herramientas y Consumibles

> [!NOTE]
> Herramientas necesarias para la instalación. Si ya las posee, no es necesario comprarlas.

| # | Herramienta | Descripción | Cantidad | Precio Est. (USD) |
|---|------------|-------------|:--------:|:------------------:|
| 11.1 | Multímetro digital | Con medición de voltaje AC/DC, continuidad, resistencia | 1 | $25.00 |
| 11.2 | Destornilladores aislados | Juego plano + Phillips (1000V dieléctrico) | 1 | $15.00 |
| 11.3 | Pinza pelacables | Para AWG 10-22 | 1 | $10.00 |
| 11.4 | Crimpadora | Para terminales de cable | 1 | $12.00 |
| 11.5 | Taladro con brocas | Para montaje de gabinete y prensaestopas | 1 | $30.00 |
| 11.6 | Soldador + estaño | Soldador 40W + estaño con flux (para PCB) | 1 | $15.00 |
| 11.7 | Soluciones buffer pH | pH 4.0, pH 7.0 (250ml c/u) | 2 | $8.00 |
| 11.8 | Soluciones buffer EC | 1.413 mS/cm, 12.88 mS/cm (250ml c/u) | 2 | $10.00 |
| 11.9 | Termómetro IR (opcional) | Para verificar temperatura de SSR en operación | 1 | $20.00 |
| 11.10 | Cinta aislante | Cinta aislante eléctrica (3M Super 33+ o similar) | 2 | $3.00 |
| 11.11 | Termocontráctil | Tubo termocontráctil surtido (para empalmes) | 1 | $5.00 |

**Subtotal Herramientas: ~$161.00** (no incluidas en el total del sistema)

---

## 💰 Resumen de Costos

### Costo del Sistema (5 Zonas)

| Sección | Subtotal (USD) |
|---------|:--------------:|
| 1. Controlador Principal | $40.00 |
| 2. Sensores de Proceso | $345.00 |
| 3. ADC y Aislamiento | $140.00 |
| 4. Control de Potencia | $415.50 |
| 5. Iluminación | $25.00 |
| 6. Sensores Auxiliares | $50.00 |
| 7. Protección y Seguridad | $178.00 |
| 8. Alimentación | $28.00 |
| 9. Gabinete y Cableado | $483.50 |
| 10. Infraestructura de Red | $126.00 |
| **TOTAL SISTEMA** | **$1,831.00** |

### Costo por Zona (promedio)

| Concepto | Monto (USD) |
|----------|:-----------:|
| Componentes por zona (sin infraestructura compartida) | ~$341.00 |
| Infraestructura compartida (÷5 zonas) | ~$25.20 |
| **Costo por zona** | **~$366.20** |

> [!TIP]
> **Costo estimado por m²:** ~$18.30 USD (basado en 100m² totales)
>
> Para reducir costos, considere:
> - Comprar en volumen (descuentos del 10-20%)
> - Buscar proveedores locales para gabinetes y cableado
> - Reutilizar equipos existentes para el servidor backend

### Costo Adicional por Zona de Expansión

Para agregar una zona adicional (más allá de las 5 iniciales):

| Concepto | Monto (USD) |
|----------|:-----------:|
| Controlador + Sensores + ADC + Aislamiento | ~$221.00 |
| Control de Potencia | ~$83.10 |
| Protección | ~$35.60 |
| Alimentación | ~$5.60 |
| Gabinete y Cableado | ~$96.70 |
| **Total por zona adicional** | **~$442.00** |

---

## 🛒 Proveedores Recomendados

| Proveedor | Productos | Enlace | Notas |
|-----------|-----------|--------|-------|
| **DFRobot** | Sensores pH, EC, Aisladores | [dfrobot.com](https://www.dfrobot.com) | Fabricante original, envío internacional |
| **Amazon** | ESP32, ADS1115, SSR, cables, gabinetes | [amazon.com](https://www.amazon.com) | Envío rápido, variedad de vendedores |
| **AliExpress** | ESP32, SSR, DS18B20, Hi-Link, componentes | [aliexpress.com](https://www.aliexpress.com) | Mejores precios, envío lento (15-45 días) |
| **Mouser/Digikey** | Componentes electrónicos (resistores, capacitores, fusibles) | [mouser.com](https://www.mouser.com) | Calidad garantizada, datasheet disponible |
| **Ferreterías locales** | Gabinetes, cables THHN, breakers, borneras | Variable | Mejor precio en cableado y gabinetes |

> [!IMPORTANT]
> **Al comprar SSR-40DA**, asegúrese de adquirirlos de **proveedores confiables**.
> Existen muchas falsificaciones que no soportan la corriente nominal. Prefiera
> marcas reconocidas como FOTEK (original), Crydom, o Omron.

---

## 📐 Calibres de Cable Recomendados

| Uso | Calibre AWG | Corriente Máx. | Color Recomendado |
|-----|:-----------:|:--------------:|:-----------------:|
| Línea AC (110V) | AWG 14 | 15A | Negro |
| Neutro AC | AWG 14 | 15A | Blanco |
| Tierra | AWG 12 | 20A | Verde o Verde/Amarillo |
| Señal digital (sensores, GPIO) | AWG 22 | 0.5A | Varios colores |
| I2C (SDA, SCL) | AWG 22 | — | Azul/Amarillo |
| OneWire (DS18B20) | AWG 22 | — | Rojo/Negro/Amarillo |

---

[← Volver al README](../README.md) | [Esquema de Cableado →](WIRING_SCHEMATIC.md)

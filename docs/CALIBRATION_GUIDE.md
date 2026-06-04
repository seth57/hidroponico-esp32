# 🔬 Guía de Calibración - HydroControl Pro

![Calibración](https://img.shields.io/badge/calibración-pH%20%2B%20EC-blue)
![Frecuencia](https://img.shields.io/badge/pH-mensual-orange)
![Frecuencia](https://img.shields.io/badge/EC-bimestral-green)

---

> [!IMPORTANT]
> La calibración precisa de los sensores de pH y EC es **fundamental** para el
> correcto funcionamiento del sistema hidropónico. Lecturas incorrectas pueden
> causar daño irreversible a los cultivos. Siga esta guía al pie de la letra.

---

## 📋 Tabla de Contenidos

- [Materiales Necesarios](#-materiales-necesarios)
- [Frecuencia de Calibración](#-frecuencia-de-calibración)
- [Calibración de pH (Dos Puntos)](#-calibración-de-ph-dos-puntos)
- [Calibración de EC (Dos Puntos)](#-calibración-de-ec-dos-puntos)
- [Calibración desde la Interfaz Web](#-calibración-desde-la-interfaz-web)
- [Mantenimiento de Sondas](#-mantenimiento-de-sondas)
- [Solución de Problemas](#-solución-de-problemas)
- [Registro de Calibración](#-registro-de-calibración)

---

## 🧪 Materiales Necesarios

### Para Calibración de pH

| Material | Especificación | Cantidad | Notas |
|----------|---------------|:--------:|-------|
| Solución buffer pH 4.00 | ±0.01 pH, certificada | 250 ml | Color rojo (convención) |
| Solución buffer pH 7.00 | ±0.01 pH, certificada | 250 ml | Color verde (convención) |
| Agua destilada | Destilada o desionizada | 500 ml | Para enjuague entre soluciones |
| Vasos de precipitado | 100 ml (o vasos plásticos limpios) | 3 | Uno por solución + uno para enjuague |
| Papel absorbente | Sin pelusa (tipo Kimwipe) | Varios | Para secar la sonda |
| Solución de almacenamiento KCl | KCl 3M (para almacenamiento de sonda pH) | 100 ml | Opcional pero recomendado |

### Para Calibración de EC

| Material | Especificación | Cantidad | Notas |
|----------|---------------|:--------:|-------|
| Solución estándar 1.413 mS/cm | A 25°C, certificada | 250 ml | Punto bajo de calibración |
| Solución estándar 12.88 mS/cm | A 25°C, certificada | 250 ml | Punto alto de calibración |
| Agua destilada | Destilada o desionizada | 500 ml | Para enjuague |
| Vasos de precipitado | 100 ml | 3 | Uno por solución + enjuague |
| Termómetro de referencia | ±0.5°C de precisión | 1 | Para verificar temperatura |

> [!TIP]
> **Compre soluciones buffer de calidad.** Las soluciones genéricas o vencidas
> producirán calibraciones incorrectas. Verifique siempre la fecha de vencimiento
> y almacénelas según las instrucciones del fabricante (usualmente a temperatura
> ambiente, lejos de la luz directa).

---

## 📅 Frecuencia de Calibración

| Sensor | Frecuencia Mínima | Frecuencia Recomendada | Condiciones que Aceleran la Necesidad |
|--------|:------------------:|:----------------------:|--------------------------------------|
| **pH** | Cada 2 meses | **Mensual** | Uso continuo, soluciones agresivas, temperatura alta |
| **EC** | Cada 3 meses | **Bimestral** | Depósitos minerales, soluciones concentradas |

### ¿Cuándo Calibrar Fuera de Calendario?

- Después de **reemplazar** una sonda
- Si las lecturas **difieren más de 0.3 pH** o **10% EC** respecto a una medición manual
- Después de un **corte de energía prolongado** (>24h)
- Si la sonda estuvo **seca** por más de 30 minutos (pH)
- Al **inicio de un nuevo ciclo** de cultivo
- Si se observan **lecturas inestables** o con mucha oscilación

---

## 📊 Calibración de pH (Dos Puntos)

### Principio de Calibración

La calibración de dos puntos establece una línea recta entre dos valores conocidos
(pH 4.0 y pH 7.0), permitiendo al sistema calcular con precisión cualquier valor
de pH intermedio o cercano:

```
Voltaje (mV)
    ▲
    │
    │         • pH 4.0 (voltaje alto)
    │        /
    │       /
    │      /  ← Línea de calibración
    │     /
    │    /
    │   • pH 7.0 (voltaje medio)
    │  /
    │ /
    └──────────────────────► pH
       4    5    6    7    8
```

### Procedimiento Paso a Paso

#### Preparación

1. **Verificar la temperatura ambiente**: Idealmente entre 20°C y 25°C
2. **Dejar las soluciones buffer a temperatura ambiente** por al menos 30 minutos
3. **Preparar 3 vasos limpios**:
   - Vaso A: Agua destilada (enjuague)
   - Vaso B: Solución buffer pH 7.00
   - Vaso C: Solución buffer pH 4.00

> [!WARNING]
> **No viertas la solución buffer de vuelta al envase original** después de usarla.
> Una vez vertida en el vaso, se considera contaminada. Deseche la solución usada.

#### Paso 1: Calibración del Punto Neutro (pH 7.00)

```
┌────────────────────────────────────────────────────┐
│           PASO 1: PUNTO NEUTRO (pH 7.00)           │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Retirar la sonda de pH de la solución actual   │
│                                                    │
│  2. Enjuagar la sonda suavemente en agua destilada │
│     (Vaso A) moviendo en forma circular por 10s    │
│                                                    │
│  3. Secar SUAVEMENTE con papel sin pelusa          │
│     ⚠️ NO frotar — solo absorber las gotas         │
│                                                    │
│  4. Sumergir la sonda en la solución pH 7.00       │
│     (Vaso B) a una profundidad mínima de 2cm       │
│                                                    │
│  5. Agitar suavemente por 5 segundos               │
│                                                    │
│  6. Esperar 1-2 minutos hasta que la lectura       │
│     del voltaje se estabilice (variación <1mV)     │
│                                                    │
│  7. En la interfaz web, presionar                  │
│     [Calibrar pH 7.00] y esperar confirmación      │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Paso 2: Calibración del Punto Ácido (pH 4.00)

```
┌────────────────────────────────────────────────────┐
│           PASO 2: PUNTO ÁCIDO (pH 4.00)            │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Retirar la sonda de la solución pH 7.00        │
│                                                    │
│  2. Enjuagar en agua destilada (Vaso A) por 10s    │
│                                                    │
│  3. Secar suavemente con papel sin pelusa          │
│                                                    │
│  4. Sumergir en solución pH 4.00 (Vaso C)          │
│     profundidad mínima de 2cm                      │
│                                                    │
│  5. Agitar suavemente por 5 segundos               │
│                                                    │
│  6. Esperar 1-2 minutos hasta estabilización       │
│                                                    │
│  7. En la interfaz web, presionar                  │
│     [Calibrar pH 4.00] y esperar confirmación      │
│                                                    │
│  8. ✅ La calibración de pH está completa          │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Paso 3: Verificación

1. Enjuagar la sonda y sumergirla en una **solución buffer de verificación** (pH 6.86 o cualquier valor conocido diferente de 4.0 y 7.0)
2. La lectura del sistema debe coincidir con el valor de la solución ±0.1 pH
3. Si la desviación es mayor, **repetir la calibración** con soluciones frescas

#### Paso 4: Finalización

1. Enjuagar la sonda en agua destilada
2. Volver a colocar la sonda en la solución hidropónica
3. Registrar la fecha y resultado de la calibración

---

## 📊 Calibración de EC (Dos Puntos)

### Principio de Calibración

La conductividad eléctrica (EC) mide la concentración de iones disueltos en la
solución. La calibración de dos puntos establece la relación entre el voltaje
medido y la conductividad real:

```
Voltaje (V)
    ▲
    │
    │                    • 12.88 mS/cm (voltaje alto)
    │                   /
    │                  /
    │                 /  ← Línea de calibración
    │                /
    │               /
    │   • 1.413 mS/cm (voltaje bajo)
    │  /
    │ /
    └──────────────────────────────► EC (mS/cm)
       1    3    5    7    9   11   13
```

### Procedimiento Paso a Paso

> [!IMPORTANT]
> La calibración de EC es **sensible a la temperatura**. Todas las soluciones
> estándar especifican su conductividad a **25°C**. Si la temperatura difiere,
> el sensor DS18B20 compensará automáticamente, pero es preferible calibrar
> a temperatura lo más cercana posible a 25°C.

#### Preparación

1. **Verificar temperatura**: Idealmente 25°C ±3°C
2. **Soluciones a temperatura ambiente** por 30 minutos mínimo
3. **Preparar 3 vasos limpios**:
   - Vaso A: Agua destilada (enjuague)
   - Vaso B: Solución estándar 1.413 mS/cm
   - Vaso C: Solución estándar 12.88 mS/cm

#### Paso 1: Calibración del Punto Bajo (1.413 mS/cm)

```
┌────────────────────────────────────────────────────┐
│        PASO 1: PUNTO BAJO (1.413 mS/cm)            │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Retirar la sonda de EC de la solución actual   │
│                                                    │
│  2. Enjuagar con agua destilada (Vaso A) por 15s   │
│     ⚠️ El enjuague es CRÍTICO para EC — restos     │
│     de solución previa alteran la lectura          │
│                                                    │
│  3. Sacudir suavemente para eliminar exceso de     │
│     agua (NO secar con papel)                      │
│                                                    │
│  4. Sumergir en solución 1.413 mS/cm (Vaso B)     │
│     asegurando que los electrodos estén            │
│     completamente cubiertos                        │
│                                                    │
│  5. Agitar suavemente y esperar 1-2 minutos        │
│                                                    │
│  6. En la interfaz web, presionar                  │
│     [Calibrar EC 1.413] y esperar confirmación     │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Paso 2: Calibración del Punto Alto (12.88 mS/cm)

```
┌────────────────────────────────────────────────────┐
│        PASO 2: PUNTO ALTO (12.88 mS/cm)            │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Retirar la sonda de la solución 1.413          │
│                                                    │
│  2. Enjuagar en agua destilada (Vaso A) por 15s    │
│     ⚠️ ENJUAGAR BIEN — la contaminación cruzada   │
│     entre soluciones es el error #1 en EC          │
│                                                    │
│  3. Sacudir suavemente                             │
│                                                    │
│  4. Sumergir en solución 12.88 mS/cm (Vaso C)     │
│                                                    │
│  5. Agitar suavemente y esperar 1-2 minutos        │
│                                                    │
│  6. En la interfaz web, presionar                  │
│     [Calibrar EC 12.88] y esperar confirmación     │
│                                                    │
│  7. ✅ La calibración de EC está completa          │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Paso 3: Verificación

1. Enjuagar la sonda y sumergirla en la solución 1.413 mS/cm nuevamente
2. La lectura debe ser 1.413 ±0.1 mS/cm
3. Opcional: verificar con una tercera solución de valor conocido

---

## 🖥️ Calibración desde la Interfaz Web

### Acceso a la Página de Calibración

1. Conectarse a la red WiFi del ESP32 o la red local
2. Abrir un navegador web e ir a: `http://<IP-ESP32>/calibration.html`
3. Se mostrará la interfaz de calibración con las lecturas en tiempo real

### Interfaz de Calibración

```
╔══════════════════════════════════════════════════════════════╗
║           🔬 HydroControl Pro — Calibración                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────── pH ──────────────────────────────────────┐ ║
║  │                                                         │ ║
║  │  Lectura Actual:  ████ 6.82 pH ████   (1.842V raw)     │ ║
║  │  Temperatura:     24.5°C                                │ ║
║  │  Estado:          ✅ Calibrado (hace 15 días)           │ ║
║  │                                                         │ ║
║  │  [📌 Calibrar pH 7.00]    [📌 Calibrar pH 4.00]        │ ║
║  │                                                         │ ║
║  │  Último cal.: 2026-05-20   Pendiente: -5.85 mV/pH      │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  ┌─────────────── EC ──────────────────────────────────────┐ ║
║  │                                                         │ ║
║  │  Lectura Actual:  ████ 2.14 mS/cm ████   (1.205V raw)  │ ║
║  │  Temperatura:     24.5°C (compensación automática)      │ ║
║  │  Estado:          ⚠️ Calibración vencida (hace 75 días) │ ║
║  │                                                         │ ║
║  │  [📌 Calibrar EC 1.413]   [📌 Calibrar EC 12.88]       │ ║
║  │                                                         │ ║
║  │  Último cal.: 2026-03-21   Kcel: 1.02                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  [🔄 Resetear Calibración]  [💾 Exportar Datos]             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Proceso en la Interfaz Web

1. Observar la **lectura raw** (voltaje crudo del ADS1115) — debe ser estable
2. Cuando la lectura se estabilice (fluctuación <2mV por 10 segundos), hacer clic en el botón correspondiente
3. El sistema guardará el valor de voltaje asociado al punto de calibración
4. Un mensaje de confirmación aparecerá: "✅ Punto calibrado correctamente"
5. Repetir para el segundo punto
6. Los coeficientes de calibración se almacenan en la **EEPROM/NVS** del ESP32

### Comandos MQTT para Calibración Remota

Si no tiene acceso a la interfaz web, puede enviar comandos MQTT:

```bash
# Calibrar pH punto 7.00
mosquitto_pub -h <broker> -t "hydro/zona1/calibrate" -m '{"sensor":"pH","point":7.00}'

# Calibrar pH punto 4.00
mosquitto_pub -h <broker> -t "hydro/zona1/calibrate" -m '{"sensor":"pH","point":4.00}'

# Calibrar EC punto bajo
mosquitto_pub -h <broker> -t "hydro/zona1/calibrate" -m '{"sensor":"EC","point":1.413}'

# Calibrar EC punto alto
mosquitto_pub -h <broker> -t "hydro/zona1/calibrate" -m '{"sensor":"EC","point":12.88}'

# Verificar estado de calibración
mosquitto_pub -h <broker> -t "hydro/zona1/calibrate" -m '{"action":"status"}'
```

---

## 🔧 Mantenimiento de Sondas

### Sonda de pH

| Aspecto | Recomendación |
|---------|--------------|
| **Almacenamiento** | SIEMPRE en solución KCl 3M (nunca seca, nunca en agua destilada) |
| **Limpieza** | Enjuagar con agua destilada después de cada uso |
| **Limpieza profunda** | Sumergir 30 min en HCl 0.1M si hay depósitos (cada 3 meses) |
| **Vida útil** | 12-18 meses de uso continuo (menos en soluciones agresivas) |
| **Señales de desgaste** | Respuesta lenta (>2 min), lecturas inestables, imposibilidad de calibrar |
| **Temperatura máxima** | 60°C (para uso en hidroponía, normalmente 15-35°C) |
| **No sumergir en** | Aceites, solventes orgánicos, ácidos concentrados |

> [!WARNING]
> **NUNCA deje la sonda de pH seca.** El bulbo de vidrio contiene un gel que
> se deshidrata irreversiblemente. Si la sonda se seca, puede perder precisión
> permanentemente. Si sucede, intente rehidratar en KCl 3M por 24 horas.

### Sonda de EC

| Aspecto | Recomendación |
|---------|--------------|
| **Almacenamiento** | Puede almacenarse seca (a diferencia de pH) |
| **Limpieza** | Enjuagar con agua destilada después de cada uso |
| **Limpieza de depósitos** | Sumergir en vinagre blanco 30 min si hay incrustaciones |
| **Vida útil** | 24-36 meses de uso continuo |
| **Señales de desgaste** | Lecturas consistentemente bajas, imposibilidad de calibrar |
| **Electrodos** | Verificar que los electrodos no estén oxidados o cubiertos de depósitos |
| **No exponer a** | Solventes, ácidos/bases concentrados |

### Calendario de Mantenimiento de Sondas

```
┌──────────────────────────────────────────────────────────────┐
│           CALENDARIO DE MANTENIMIENTO DE SONDAS              │
├──────────────┬────────────────────┬──────────────────────────┤
│   Frecuencia │    Sonda de pH     │     Sonda de EC          │
├──────────────┼────────────────────┼──────────────────────────┤
│   Diario     │ Verificar que esté │ N/A                      │
│              │ sumergida en KCl   │                          │
├──────────────┼────────────────────┼──────────────────────────┤
│   Semanal    │ Enjuagar y revisar │ Enjuagar con agua        │
│              │ bulbo de vidrio    │ destilada                │
├──────────────┼────────────────────┼──────────────────────────┤
│   Mensual    │ CALIBRAR           │ Revisar electrodos       │
│              │ (2 puntos)         │ por depósitos            │
├──────────────┼────────────────────┼──────────────────────────┤
│   Bimestral  │ Limpieza profunda  │ CALIBRAR (2 puntos)      │
│              │ (HCl 0.1M)        │ Limpieza con vinagre     │
├──────────────┼────────────────────┼──────────────────────────┤
│   Anual      │ Evaluar reemplazo  │ Evaluar reemplazo        │
│              │ (12-18 meses)      │ (24-36 meses)            │
└──────────────┴────────────────────┴──────────────────────────┘
```

---

## 🔍 Solución de Problemas

### Problemas de Calibración de pH

| Problema | Posible Causa | Solución |
|----------|--------------|----------|
| Lectura no se estabiliza | Sonda dañada o deshidratada | Rehidratar en KCl 24h; si persiste, reemplazar |
| Lectura siempre 7.0 | Cable desconectado o cortado | Verificar conexión BNC y cable |
| Lectura difiere >0.5 pH del buffer | Solución buffer vencida | Usar solución buffer nueva y verificar fecha |
| Calibración no converge | Aislador analógico defectuoso | Verificar voltaje de salida del aislador |
| Lectura fluctúa ±0.3 pH | Lazos de tierra | Verificar aislador galvánico; verificar conexiones |
| Voltaje raw = 0V o 3.3V | ADS1115 saturado | Verificar conexiones I2C y alimentación del ADS1115 |
| Pendiente fuera de rango | Sonda agotada (vida útil) | Pendiente ideal: -54 a -60 mV/pH a 25°C; reemplazar si <-48 mV/pH |

### Problemas de Calibración de EC

| Problema | Posible Causa | Solución |
|----------|--------------|----------|
| Lectura siempre 0 mS/cm | Cable desconectado o sonda seca | Verificar conexión; sumergir sonda |
| Lectura mucho mayor al buffer | Contaminación cruzada | Enjuagar bien con agua destilada entre soluciones |
| Lectura baja pero estable | Depósitos en electrodos | Limpiar electrodos con vinagre |
| Lectura varía con la temperatura | Compensación deshabilitada | Verificar que DS18B20 funcione correctamente |
| No cambia entre soluciones | Sonda defectuosa | Reemplazar sonda de EC |

### Verificación del ADS1115

Si sospecha problemas con el ADC:

```bash
# Verificar comunicación I2C (desde el monitor serial del ESP32)
# El ADS1115 debe aparecer en la dirección 0x48 (ADDR → GND)

I2C Scanner:
  Scanning...
  Device found at address 0x48  ← ADS1115 detectado ✅
  Scan complete.
```

### Verificación de Aisladores Analógicos

```
Prueba del Aislador DFRobot Gravity:

  Entrada (lado sensor):  Medir voltaje entre SIG y GND del sensor
  Salida (lado ADS1115):  Medir voltaje entre SIG y GND del ADS1115

  ✅ Correcto: Ambos voltajes son iguales (±10mV)
  ❌ Error:    Voltajes difieren significativamente → Aislador defectuoso
  ❌ Error:    Voltaje de salida = 0V → Verificar alimentación del aislador
```

---

## 📝 Registro de Calibración

Mantenga un registro de cada calibración realizada:

| Fecha | Zona | Sensor | Punto 1 (Voltaje) | Punto 2 (Voltaje) | Pendiente/K | Verificación | Operador |
|-------|------|--------|:------------------:|:------------------:|:-----------:|:------------:|----------|
| 2026-06-01 | 1 | pH | 7.00 (1.500V) | 4.00 (2.032V) | -57.7 mV/pH | 6.86→6.84 ✅ | — |
| 2026-06-01 | 1 | EC | 1.413 (0.85V) | 12.88 (2.10V) | K=1.02 | 1.413→1.40 ✅ | — |
| | | | | | | | |
| | | | | | | | |

> [!TIP]
> El sistema guarda automáticamente los datos de calibración en la memoria NVS
> del ESP32 y los reporta al backend vía MQTT. Puede consultar el historial
> de calibraciones desde Grafana en el dashboard "Mantenimiento".

---

## 📐 Valores de Referencia

### Rangos Típicos en Hidroponía

| Parámetro | Rango Óptimo | Rango Aceptable | Peligro |
|-----------|:------------:|:---------------:|:-------:|
| **pH** | 5.5 - 6.5 | 5.0 - 7.0 | <4.5 o >7.5 |
| **EC** | 1.2 - 3.0 mS/cm | 0.8 - 3.5 mS/cm | <0.5 o >4.0 mS/cm |
| **Temperatura** | 18 - 24°C | 15 - 28°C | <10°C o >32°C |

### Ecuaciones de Calibración

**pH (calibración lineal):**
```
pH = pendiente × voltaje + offset

Donde:
  pendiente = (pH₂ - pH₁) / (V₂ - V₁)
  offset    = pH₁ - pendiente × V₁

  Punto 1: pH₁ = 7.00, V₁ = voltaje medido en buffer 7.00
  Punto 2: pH₂ = 4.00, V₂ = voltaje medido en buffer 4.00
```

**EC (con compensación de temperatura):**
```
EC_raw = Kcel × f(voltaje)
EC_compensada = EC_raw / (1 + α × (T - 25))

Donde:
  Kcel = constante de celda (determinada por calibración)
  α    = coeficiente de temperatura ≈ 0.02 /°C
  T    = temperatura actual en °C (del DS18B20)
```

---

[← Volver al README](../README.md) | [Guía de Instalación →](INSTALLATION.md)

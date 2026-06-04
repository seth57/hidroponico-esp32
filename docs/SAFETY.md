# ⚡ Guía de Seguridad Eléctrica - HydroControl Pro

![Safety](https://img.shields.io/badge/seguridad-crítico-red)
![Voltage](https://img.shields.io/badge/voltaje-110V%20AC-orange)

---

> [!CAUTION]
> **Este sistema opera con voltaje de línea de 110V AC, potencialmente letal.**
> La instalación, mantenimiento y reparación DEBEN ser realizados por personal
> calificado o bajo la supervisión directa de un electricista certificado.

---

## 📋 Tabla de Contenidos

- [Requisitos de Conocimiento](#-requisitos-de-conocimiento)
- [Advertencias Generales](#-advertencias-generales)
- [Modos de Fallo de SSR](#-modos-de-fallo-de-ssr)
- [Requisitos de Desconexión Manual](#-requisitos-de-desconexión-manual)
- [Puesta a Tierra](#-puesta-a-tierra)
- [Separación Agua-Electricidad](#-separación-agua-electricidad)
- [Protección Contra Incendios](#-protección-contra-incendios)
- [Procedimientos de Emergencia](#-procedimientos-de-emergencia)
- [Programa de Mantenimiento](#-programa-de-mantenimiento)
- [Lista de Verificación de Seguridad](#-lista-de-verificación-de-seguridad)

---

## 🎓 Requisitos de Conocimiento

Antes de trabajar con este sistema, el personal **DEBE** tener:

| Requisito | Descripción |
|-----------|-------------|
| Electricidad básica | Comprensión de voltaje AC, corriente, resistencia y potencia |
| Uso de multímetro | Capacidad de medir voltaje, continuidad y resistencia |
| Normas eléctricas locales | Conocimiento del código eléctrico nacional aplicable |
| Primeros auxilios | Conocimiento básico de RCP y tratamiento de quemaduras eléctricas |
| Lectura de diagramas | Capacidad de interpretar esquemas eléctricos y diagramas de cableado |

> [!WARNING]
> **Si no cumple con TODOS los requisitos anteriores, NO proceda con la instalación.**
> Contrate a un electricista certificado para la instalación eléctrica.

---

## ⚠️ Advertencias Generales

### Voltaje de Línea (110V AC)

> [!CAUTION]
> **110V AC puede causar electrocución fatal.** El contacto con conductores
> energizados puede provocar paro cardíaco, quemaduras graves o la muerte.

**Reglas fundamentales:**

1. **SIEMPRE** desconectar el breaker principal antes de trabajar en el gabinete
2. **SIEMPRE** verificar ausencia de voltaje con multímetro antes de tocar conductores
3. **NUNCA** trabajar solo — siempre tener a otra persona presente
4. **NUNCA** trabajar en el gabinete con las manos húmedas o mojadas
5. **NUNCA** dejar conductores expuestos sin aislamiento
6. **SIEMPRE** usar herramientas con aislamiento dieléctrico certificado
7. **SIEMPRE** usar zapatos con suela aislante (no conductivos)
8. **NUNCA** hacer bypass de protecciones de seguridad (fusibles, breakers, contactores)

### Ambiente Húmedo (Invernadero)

> [!WARNING]
> Los invernaderos tienen **alta humedad relativa (60-90%)**. Esto incrementa
> significativamente el riesgo de cortocircuito, arco eléctrico y electrocución.

- Todos los gabinetes eléctricos deben ser **IP65 mínimo**
- Las prensaestopas (cable glands) deben mantener el grado IP del gabinete
- Los cables que transiten por zonas húmedas deben ser tipo **uso rudo** o **conduit sellado**
- Las conexiones eléctricas externas deben estar en **cajas de conexión IP67**
- Inspeccionar periódicamente la formación de condensación dentro de gabinetes

---

## 🔴 Modos de Fallo de SSR

> [!CAUTION]
> **Los relés de estado sólido (SSR) pueden fallar en CORTOCIRCUITO (cerrados).**
> Esto significa que un SSR defectuoso mantendrá la carga SIEMPRE ENCENDIDA,
> incluso cuando el ESP32 ordene apagarla. Este es el modo de fallo más peligroso.

### Tipos de Fallo del SSR-40DA

| Modo de Fallo | Efecto | Peligrosidad | Mitigación |
|---------------|--------|:------------:|------------|
| **Fallo en corto** | Carga permanentemente encendida | 🔴 **ALTA** | Contactor de seguridad + fusible |
| **Fallo en abierto** | Carga no enciende | 🟡 Media | Monitoreo de estado vía sensor de corriente |
| **Degradación gradual** | Corriente de fuga creciente | 🟠 Media-Alta | Inspección térmica periódica |
| **Sobrecalentamiento** | Daño al SSR y gabinete | 🔴 **ALTA** | Disipador adecuado + ventilación |

### Protecciones Implementadas

```
┌──────────────────────────────────────────────────────────┐
│              CADENA DE PROTECCIÓN POR CANAL               │
│                                                          │
│  ESP32 GPIO                                              │
│      │                                                   │
│      ├── 10kΩ Pull-Down (estado seguro = OFF al inicio)  │
│      │                                                   │
│      ▼                                                   │
│  SSR-40DA ◄── RC Snubber (100Ω + 0.1µF/400V)           │
│      │                                                   │
│      ▼                                                   │
│  Contactor (para bombas >5A)                             │
│      │                                                   │
│      ▼                                                   │
│  Fusible (calibrado por canal)                           │
│      │                                                   │
│      ▼                                                   │
│  CARGA (Bomba / Luz)                                     │
│                                                          │
│  Breaker General ── Interruptor de Emergencia (seta)     │
└──────────────────────────────────────────────────────────┘
```

### Importancia del RC Snubber

El circuito RC snubber (100Ω + 0.1µF 400V) conectado en paralelo con los terminales de salida del SSR cumple funciones críticas:

- **Suprime picos de voltaje** inductivos al apagar cargas como bombas (motor inductivo)
- **Reduce el dV/dt** que puede disparar falsamente el triac interno del SSR
- **Extiende la vida útil** del SSR al reducir estrés eléctrico
- **Previene arcos eléctricos** durante la conmutación

> [!IMPORTANT]
> El capacitor del snubber **DEBE** ser de tipo **metalizado de película (MKP)** con
> clasificación de voltaje de **mínimo 400V AC**. NO usar capacitores electrolíticos
> ni cerámicos. Verificar que el capacitor tenga certificación **X2** para uso en línea AC.

---

## 🔌 Requisitos de Desconexión Manual

> [!IMPORTANT]
> **Toda instalación DEBE tener un medio de desconexión manual accesible.**
> En caso de emergencia, la desconexión debe estar al alcance en menos de 3 segundos.

### Elementos Obligatorios

1. **Breaker principal** (disyuntor termomagnético)
   - Ubicado en la entrada de alimentación del gabinete
   - Capacidad: 2× la corriente máxima total esperada
   - Tipo: Bipolar (corta línea Y neutro)

2. **Botón de emergencia (seta roja)**
   - Ubicado en el **exterior** del gabinete
   - Tipo: NC (normalmente cerrado) — se abre al presionar
   - Color: ROJO con fondo AMARILLO
   - Corta **toda** la alimentación AC del gabinete
   - Requiere desbloqueo manual (giro para resetear)

3. **Seccionador por canal** (opcional pero recomendado)
   - Interruptores individuales por cada bomba
   - Permite mantenimiento de una bomba sin apagar el sistema

```
                    RED AC 110V
                        │
                        ▼
              ┌──────────────────┐
              │  BREAKER GENERAL │ ◄── Protección contra sobrecorriente
              │    2P / 30A      │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │  BOTÓN EMERGENCIA│ ◄── Seta roja, exterior del gabinete
              │   (NC - Seta)    │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │   BARRA DE       │
              │  DISTRIBUCIÓN    │
              └─┬──┬──┬──┬──┬──┬┘
                │  │  │  │  │  │
               F1 F2 F3 F4 F5 F6  ◄── Fusibles individuales por canal
                │  │  │  │  │  │
               B1 B2 B3 B4 B5 B6  ◄── Bombas / Cargas
```

---

## 🌍 Puesta a Tierra

> [!CAUTION]
> **La puesta a tierra es OBLIGATORIA, no opcional.** Una falla de tierra puede
> causar que el gabinete metálico, las tuberías o el agua se energicen a 110V,
> creando un riesgo letal de electrocución.

### Requisitos de Tierra

| Elemento | Requisito |
|----------|-----------|
| Cable de tierra | AWG 12 mínimo (verde/amarillo), continuo sin empalmes |
| Barra de tierra del gabinete | Barra de cobre con conexión directa al electrodo |
| Electrodo de tierra | Varilla de cobre de 2.4m, resistencia <25Ω |
| Gabinete metálico | Conexión directa a barra de tierra |
| Bombas metálicas | Cada bomba conectada a tierra individual |
| Tuberías metálicas | Conexión equipotencial a tierra |

### Diagrama de Puesta a Tierra

```
    Gabinete ──── Barra de Tierra ──── Electrodo (varilla Cu 2.4m)
       │              │
       ├── SSR (chasis)│
       ├── Contactores │
       ├── Bomba 1 ────┤
       ├── Bomba 2 ────┤
       ├── Bomba 3 ────┤
       ├── Bomba 4 ────┤
       ├── Bomba 5 ────┤
       ├── Bomba 6 ────┤
       └── Tuberías ───┘
```

> [!WARNING]
> **NUNCA** usar el conductor neutro como tierra.
> **NUNCA** conectar tierra a tuberías de agua como electrodo principal.
> **SIEMPRE** verificar la continuidad de la tierra con multímetro antes de energizar.

---

## 💧 Separación Agua-Electricidad

### Reglas de Separación

| Regla | Descripción |
|-------|-------------|
| **Distancia mínima** | 60 cm entre conductores eléctricos y tuberías de agua |
| **Gabinete elevado** | El gabinete eléctrico debe estar mínimo 1.2m sobre el suelo |
| **Sin cables sobre agua** | Los cables nunca deben pasar directamente sobre reservorios o canales |
| **Prensaestopas** | Todos los cables que entren al gabinete usan prensaestopas IP68 |
| **Cables goteantes** | Los cables deben hacer un "bucle de goteo" antes de entrar al gabinete |
| **Sondas aisladas** | Las sondas pH/EC usan aisladores galvánicos (ya incluidos en el diseño) |

### Bucle de Goteo (Drip Loop)

```
    Gabinete
    ┌───────┐
    │       │    Cable
    │   ────┼────────────\
    │       │             \
    └───────┘              \        ← El agua escurre aquí
                            \       y NO entra al gabinete
                             \
                              ╰─── Punto más bajo del cable
                              │
                              │
                         Sensor/Bomba
```

> [!IMPORTANT]
> **Todo cable que entre al gabinete debe tener un bucle de goteo.**
> El punto más bajo del cable debe estar DEBAJO del punto de entrada al gabinete,
> para que cualquier agua que escurra por el cable caiga por gravedad antes de
> llegar al gabinete.

---

## 🔥 Protección Contra Incendios

### Factores de Riesgo

| Riesgo | Causa | Prevención |
|--------|-------|------------|
| Sobrecalentamiento SSR | Corriente excesiva, disipador insuficiente | Disipador térmico correcto, ventilación |
| Cortocircuito | Cable dañado, conexión suelta | Fusibles calibrados, inspección periódica |
| Arco eléctrico | Conexiones flojas, humedad | Torque adecuado en terminales, IP65 |
| Sobrecarga | Demasiadas cargas simultáneas | Cálculo de carga correcto, breaker |

### Medidas Obligatorias

1. **Extintor clase C** (para fuegos eléctricos) a menos de 5m del gabinete
2. **Material del gabinete**: metal (NO plástico) para resistencia al fuego
3. **Cables retardantes de llama** (tipo THHN/THWN mínimo)
4. **Canaletas metálicas** para organización de cables dentro del gabinete
5. **Detector de humo** en el área del gabinete (opcional pero recomendado)
6. **Ventilación del gabinete** con filtro para evitar acumulación de calor

> [!WARNING]
> **En caso de incendio eléctrico:**
> 1. **NO usar agua** — riesgo de electrocución
> 2. Desconectar el breaker general (si es seguro hacerlo)
> 3. Usar extintor clase C (CO₂ o polvo químico seco)
> 4. Evacuar si el fuego no se controla en 30 segundos
> 5. Llamar a los bomberos

---

## 🚨 Procedimientos de Emergencia

### Electrocución de una Persona

```
┌──────────────────────────────────────────────────────────────┐
│              PROTOCOLO DE EMERGENCIA - ELECTROCUCIÓN          │
│                                                              │
│  1. ⚡ NO TOCAR a la víctima directamente                    │
│  2. 🔴 DESCONECTAR el breaker general o botón de emergencia  │
│  3. 📞 LLAMAR a emergencias (número local)                   │
│  4. 🫁 Si no respira: iniciar RCP                            │
│  5. 🔥 Tratar quemaduras con agua fría (después de           │
│        desconectar la electricidad)                           │
│  6. 🏥 NO mover a la víctima si se sospecha lesión espinal   │
│  7. 📋 Mantener a la víctima caliente y en posición lateral   │
│        de seguridad hasta la llegada de paramédicos           │
└──────────────────────────────────────────────────────────────┘
```

### Fuga de Agua en el Gabinete

1. **DESCONECTAR** el breaker general inmediatamente
2. **NO abrir** el gabinete hasta que esté completamente desenergizado
3. Verificar ausencia de voltaje con multímetro
4. Identificar y reparar la fuente de la fuga
5. Secar completamente el gabinete con aire comprimido
6. Inspeccionar todos los componentes por daño de agua
7. Medir resistencia de aislamiento antes de re-energizar

### Fallo de SSR (Bomba que No Se Apaga)

1. **DESCONECTAR** el fusible individual de la bomba afectada
2. Si no es posible, **DESCONECTAR** el breaker general
3. Verificar el estado del SSR (medir voltaje en terminales de salida)
4. Reemplazar el SSR defectuoso
5. Verificar el circuito RC snubber
6. Documentar el fallo para análisis

---

## 🔧 Programa de Mantenimiento

### Mantenimiento Semanal

| Tarea | Procedimiento |
|-------|---------------|
| Inspección visual del gabinete | Buscar signos de humedad, corrosión, sobrecalentamiento |
| Verificar indicadores LED | Todos los LEDs de estado deben funcionar correctamente |
| Revisar operación de bombas | Verificar que todas las bombas encienden y apagan correctamente |
| Verificar lecturas de sensores | Comparar con mediciones manuales (pH, EC, temperatura) |

### Mantenimiento Mensual

| Tarea | Procedimiento |
|-------|---------------|
| Calibración de pH | Calibrar con soluciones buffer 4.0 y 7.0 |
| Inspección de cables | Buscar cables dañados, roídos o con aislamiento deteriorado |
| Limpieza de sondas | Limpiar sondas de pH y EC según guía del fabricante |
| Verificar prensaestopas | Asegurar que mantienen el sello IP |
| Limpieza de filtros de ventilación | Limpiar o reemplazar filtros del gabinete |

### Mantenimiento Trimestral

| Tarea | Procedimiento |
|-------|---------------|
| **Inspección térmica de SSR** | Con el sistema operando, verificar temperatura de los SSR con termómetro IR. Máximo 60°C en el disipador |
| Calibración de EC | Calibrar con soluciones de referencia |
| Torque de terminales | Verificar apriete de todas las conexiones (con sistema desenergizado) |
| Prueba de botón de emergencia | Verificar que el botón de emergencia corta toda la alimentación |
| Prueba de breaker | Verificar operación correcta del breaker principal |
| Prueba de tierra | Medir resistencia de tierra (<25Ω) |

### Mantenimiento Anual

| Tarea | Procedimiento |
|-------|---------------|
| **Reemplazo preventivo de SSR** | Considerar reemplazar SSR con >10,000 horas de operación |
| Inspección de contactores | Verificar estado de contactos, reemplazar si están picados |
| Prueba de aislamiento | Medir resistencia de aislamiento de todos los cables |
| Reemplazo de sondas | Evaluar reemplazo de sondas pH (vida útil ~12-18 meses) |
| Revisión general del gabinete | Inspección completa por electricista certificado |
| Actualización de firmware | Actualizar a la última versión estable |

---

## ✅ Lista de Verificación de Seguridad

### Antes de la Primera Energización

- [ ] Breaker principal instalado y en posición OFF
- [ ] Botón de emergencia instalado y funcional (probado mecánicamente)
- [ ] Todos los fusibles instalados con valores correctos
- [ ] Puesta a tierra verificada (continuidad + resistencia <25Ω)
- [ ] Todas las conexiones con torque adecuado
- [ ] Cable de tierra conectado a todas las partes metálicas
- [ ] Prensaestopas instalados y sellados
- [ ] Separación correcta entre sección de potencia y control
- [ ] RC snubbers instalados en todos los SSR
- [ ] Pull-downs de 10kΩ en todos los GPIOs de control
- [ ] Disipadores de calor instalados en todos los SSR
- [ ] Extintor clase C disponible y accesible
- [ ] Personal capacitado presente durante la primera energización
- [ ] Ruta de evacuación despejada

### Verificación Periódica (Cada 3 Meses)

- [ ] Temperatura de SSR verificada (<60°C en operación)
- [ ] Botón de emergencia probado
- [ ] Breaker probado
- [ ] Tierra medida (<25Ω)
- [ ] Gabinete libre de humedad y condensación
- [ ] Cables sin daño visible
- [ ] Fusibles sin signos de estrés térmico
- [ ] Sondas de pH/EC limpias y calibradas

---

> [!CAUTION]
> **RECORDATORIO FINAL:** Este documento proporciona pautas de seguridad, pero
> **no reemplaza** el conocimiento de un electricista certificado ni las normas
> eléctricas locales vigentes. SIEMPRE consulte con un profesional calificado
> antes de realizar instalaciones o modificaciones eléctricas.

---

[← Volver al README](../README.md) | [Guía de Instalación →](INSTALLATION.md)

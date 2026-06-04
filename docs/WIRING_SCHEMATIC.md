# Esquema de Conexionado - HydroControl Pro

> [!WARNING]
> **SEGURIDAD ELÉCTRICA**: Este proyecto maneja **110V AC hasta 15A**. Antes de realizar cualquier conexión:
> 1. Desconecte la alimentación principal.
> 2. Use fusibles adecuados (20A general, 5A para luces).
> 3. Mantenga una estricta separación física entre la zona de potencia (AC) y la de control (DC/Sensores).

## Diagrama General de Control y Potencia

```text
======================= ZONA DE POTENCIA AC =======================
                  (Gabinete Metálico Aislado)

    LÍNEA (110V AC) -----------------------------+-----------------
          |                                      |
      [Fusible 20A]                              |
          |                                      |
          +----[SSR-40DA_1]-----( Bomba Princ. )-+
          |                                      |
          +----[SSR-40DA_2]-----( Bomba N. A )---+
          |                                      |
          +----[SSR-40DA_3]-----( Bomba N. B )---+  (Retorno
          |                                      |  a Neutro)
          +----[SSR-40DA_4]-----( Bomba pH + )---+
          |                                      |
          +----[SSR-40DA_5]-----( Bomba pH - )---+
          |                                      |
          +----[SSR-40DA_6]-----( Luz Zona   )---+

*Nota: Para bombas >5A o alta carga inductiva, el SSR debe
       activar la BOBINA de un Contactor AC, no la bomba directamente.
       Incluir RC Snubber en paralelo a los terminales de salida del SSR.

====================== ZONA DE CONTROL DC =======================
                  (Gabinete Plástico IP65)

           [ ESP32 WROOM 32 DevKit ]
           
-- I2C / Sensores Analógicos y RTC --
GPIO 21 (SDA) ----> ADS1115 SDA   [ Y en paralelo ] ----> DS3231 (SDA)
GPIO 22 (SCL) ----> ADS1115 SCL   [ Y en paralelo ] ----> DS3231 (SCL)
3.3V         ----> ADS1115 VDD   [ Y en paralelo ] ----> DS3231 (VCC)
GND          ----> ADS1115 GND   [ Y en paralelo ] ----> DS3231 (GND)

ADS1115 A0 ----> [Isolator] ----> Módulo pH V2 (DFRobot)
ADS1115 A1 ----> [Isolator] ----> Módulo EC V2 (DFRobot)

-- Sensores Digitales e Interruptores --
GPIO  4 (1-Wire) ----> DS18B20 Temp (con R_Pull-up 4.7k a 3.3V)
GPIO 14          ----> Jumper Selector de Modo (Conectar a GND para Modo Autónomo Local)

-- LEDs Indicadores de Estado --
GPIO 23 ----> [Resistencia 330Ω] ----> LED AZUL (Internet / MQTT) ----> GND
GPIO 13 ----> [Resistencia 330Ω] ----> LED AMARILLO (Modo Autónomo) ----> GND
GPIO 12 ----> [Resistencia 330Ω] ----> LED ROJO (Alarma / Fallo I/O) ----> GND

-- Control Actuadores (Entradas de SSRs) --
GPIO 25 ----> [Resistencia 10k↓ a GND] ----> SSR_1 (+)
GPIO 26 ----> [Resistencia 10k↓ a GND] ----> SSR_2 (+)
GPIO 27 ----> [Resistencia 10k↓ a GND] ----> SSR_3 (+)
GPIO 32 ----> [Resistencia 10k↓ a GND] ----> SSR_4 (+)
GPIO 33 ----> [Resistencia 10k↓ a GND] ----> SSR_5 (+)
GPIO 16 ----> [Resistencia 10k↓ a GND] ----> SSR_6 (+) Luces Z1

*Nota: Todas las entradas (-) de los SSR van unidas al GND del ESP32.
```

## Cableado y Gabinetes
Para el cableado de potencia: Use alambre **AWG 12 o 14** resistente a humedad.
Para control: Use cables trenzados Cat5/Cat6 y preferiblemente blindados para evitar EMI en los sensores analógicos de pH y EC.

// =============================================================================
// HydroControl Pro - Configuración Global del Sistema
// Definiciones de pines, constantes y parámetros del sistema hidropónico
// =============================================================================

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =============================================================================
// VERSIÓN DEL FIRMWARE
// =============================================================================
#ifndef HYDRO_VERSION
  #define HYDRO_VERSION "1.0.0"
#endif

// =============================================================================
// CONFIGURACIÓN DE PINES - BUS I2C (ADS1115)
// =============================================================================
#define PIN_I2C_SDA                 21    // Datos I2C
#define PIN_I2C_SCL                 22    // Reloj I2C

// =============================================================================
// CONFIGURACIÓN DE PINES - SENSOR DE TEMPERATURA (DS18B20)
// =============================================================================
#define PIN_ONEWIRE                 4     // Bus OneWire para DS18B20

// =============================================================================
// CONFIGURACIÓN DE PINES - BOMBAS (SSR-40DA)
// =============================================================================
#define PIN_BOMBA_PRINCIPAL         25    // Bomba principal de riego
#define PIN_BOMBA_NUTRIENTES_A      26    // Dosificador nutriente A
#define PIN_BOMBA_NUTRIENTES_B      27    // Dosificador nutriente B
#define PIN_BOMBA_PH_UP             32    // Dosificador pH Up
#define PIN_BOMBA_PH_DOWN           33    // Dosificador pH Down
#define PIN_BOMBA_RECIRCULACION     5     // Bomba de recirculación

// =============================================================================
// CONFIGURACIÓN DE PINES - ILUMINACIÓN (SSR para bombillas 60W)
// =============================================================================
#define PIN_LUZ_ZONA_1              16    // SSR luz zona 1
#define PIN_LUZ_ZONA_2              17    // SSR luz zona 2
#define PIN_LUZ_ZONA_3              18    // SSR luz zona 3
#define PIN_LUZ_ZONA_4              19    // SSR luz zona 4
#define PIN_LUZ_ZONA_5              2     // SSR luz zona 5

// Pines de iluminación como arreglo para acceso indexado
const uint8_t PINES_LUZ[] = {
    PIN_LUZ_ZONA_1,
    PIN_LUZ_ZONA_2,
    PIN_LUZ_ZONA_3,
    PIN_LUZ_ZONA_4,
    PIN_LUZ_ZONA_5
};

// =============================================================================
// CONFIGURACIÓN DE PINES - SENSORES AUXILIARES
// =============================================================================
#define PIN_SENSOR_FLUJO            23    // Sensor de flujo de agua
#define PIN_SENSOR_NIVEL_ALTO       13    // Sensor de nivel alto del tanque
#define PIN_SENSOR_NIVEL_BAJO       12    // Sensor de nivel bajo del tanque

// =============================================================================
// CONFIGURACIÓN DE PINES - LED DE ESTADO
// =============================================================================
#define PIN_LED_ESTADO              2     // LED integrado (compartido con luz zona 5)

// =============================================================================
// CONFIGURACIÓN WiFi POR DEFECTO
// =============================================================================
#define WIFI_SSID_DEFAULT           "TuRedWiFi"
#define WIFI_PASS_DEFAULT           "TuContraseña"
#define WIFI_AP_SSID_PREFIX         "HydroControl-"
#define WIFI_AP_PASSWORD            "hydro1234"
#define WIFI_CONNECT_TIMEOUT_MS     15000   // Tiempo máximo de conexión (ms)
#define WIFI_RECONNECT_INTERVAL_MS  30000   // Intervalo de reconexión (ms)

// =============================================================================
// CONFIGURACIÓN MQTT
// =============================================================================
#define MQTT_BROKER_DEFAULT         "192.168.1.100"
#define MQTT_PORT_DEFAULT           1883
#define MQTT_USER_DEFAULT           ""
#define MQTT_PASS_DEFAULT           ""
#define MQTT_CLIENT_PREFIX          "HydroControl_"
#define MQTT_TOPIC_BASE             "hydro/zone/"
#define MQTT_PUBLISH_INTERVAL_MS    10000   // Publicar cada 10 segundos
#define MQTT_RECONNECT_MIN_MS       1000    // Reconexión mínima (ms)
#define MQTT_RECONNECT_MAX_MS       60000   // Reconexión máxima (ms)

// =============================================================================
// CONFIGURACIÓN DE ZONAS
// =============================================================================
#define NUM_ZONAS                   5       // Número total de zonas
#define ZONA_ID_DEFAULT             1       // ID de zona por defecto
#define AREA_INVERNADERO_M2         100     // Área total del invernadero (m²)

// =============================================================================
// CONFIGURACIÓN DEL ADS1115 (ADC de 16 bits)
// =============================================================================
#define ADS1115_ADDRESS             0x48    // Dirección I2C del ADS1115
#define ADS_CANAL_PH                0       // Canal A0 para sensor pH
#define ADS_CANAL_EC                1       // Canal A1 para sensor EC
#define ADS_GANANCIA                GAIN_ONE // Ganancia ±4.096V

// =============================================================================
// CALIBRACIÓN DE SENSORES - VALORES POR DEFECTO
// =============================================================================

// Calibración pH: pH = pendiente * voltaje + intercepto
#define PH_PENDIENTE_DEFAULT        -5.70f  // Pendiente por defecto
#define PH_INTERCEPTO_DEFAULT       21.34f  // Intercepto por defecto
#define PH_BUFFER_PUNTO1            4.0f    // Buffer de calibración punto 1
#define PH_BUFFER_PUNTO2            7.0f    // Buffer de calibración punto 2

// Calibración EC: EC = pendiente * voltaje + intercepto (con compensación de temperatura)
#define EC_PENDIENTE_DEFAULT        1.0f    // Pendiente por defecto
#define EC_INTERCEPTO_DEFAULT       0.0f    // Intercepto por defecto
#define EC_SOLUCION_PUNTO1          1.413f  // Solución calibración punto 1 (mS/cm)
#define EC_SOLUCION_PUNTO2          12.88f  // Solución calibración punto 2 (mS/cm)
#define EC_COEF_TEMPERATURA         0.02f   // Coeficiente de compensación de temperatura

// Temperatura de referencia para compensación EC
#define TEMP_REFERENCIA_EC          25.0f   // 25°C como referencia

// =============================================================================
// LÍMITES DE SEGURIDAD
// =============================================================================

// Rango de pH seguro
#define PH_MINIMO                   5.5f
#define PH_MAXIMO                   7.0f
#define PH_ALARMA_CRITICA_MIN       4.0f    // pH crítico bajo
#define PH_ALARMA_CRITICA_MAX       8.5f    // pH crítico alto

// Rango de EC seguro (mS/cm)
#define EC_MINIMO                   0.5f
#define EC_MAXIMO                   3.0f
#define EC_ALARMA_CRITICA_MIN       0.1f    // EC crítica baja
#define EC_ALARMA_CRITICA_MAX       5.0f    // EC crítica alta

// Rango de temperatura seguro (°C)
#define TEMP_MINIMO                 18.0f
#define TEMP_MAXIMO                 32.0f
#define TEMP_ALARMA_CRITICA_MIN     5.0f    // Temperatura crítica baja
#define TEMP_ALARMA_CRITICA_MAX     40.0f   // Temperatura crítica alta

// =============================================================================
// CONFIGURACIÓN DE BOMBAS
// =============================================================================
#define NUM_BOMBAS                  6       // Número total de bombas
#define BOMBA_TIMEOUT_PRINCIPAL_MS  1800000 // 30 min tiempo máximo bomba principal
#define BOMBA_TIMEOUT_DOSIF_MS      60000   // 1 min tiempo máximo dosificadores
#define BOMBA_TIMEOUT_RECIRC_MS     3600000 // 60 min tiempo máximo recirculación
#define BOMBA_FLUJO_MIN_PULSOS      5       // Pulsos mínimos para detectar flujo

// Histéresis para control automático de pH
#define PH_HISTERESIS               0.2f    // Banda muerta de pH

// Histéresis para control automático de EC
#define EC_HISTERESIS               0.1f    // Banda muerta de EC (mS/cm)

// =============================================================================
// CONFIGURACIÓN DE ILUMINACIÓN
// =============================================================================
#define NUM_CANALES_LUZ             5       // Número de canales de iluminación
#define LUZ_PWM_FRECUENCIA          5000    // Frecuencia PWM para futuras LEDs (Hz)
#define LUZ_PWM_RESOLUCION          8       // Resolución PWM (8 bits = 0-255)
#define LUZ_ENCENDIDO_DEFAULT       "18:00" // Hora de encendido por defecto (puesta de sol)
#define LUZ_APAGADO_DEFAULT         "06:00" // Hora de apagado por defecto (salida de sol)

// =============================================================================
// FILTRO DE MEDIA MÓVIL
// =============================================================================
#define FILTRO_NUM_MUESTRAS         10      // Número de muestras para media móvil
#define SENSOR_LECTURA_INTERVAL_MS  500     // Intervalo entre lecturas (ms)

// =============================================================================
// DETECCIÓN DE DESCONEXIÓN DE SENSORES
// =============================================================================
#define SENSOR_VOLTAJE_MIN          0.05f   // Voltaje mínimo válido (V)
#define SENSOR_VOLTAJE_MAX          3.3f    // Voltaje máximo válido (V)
#define SENSOR_TEMP_DESCONECTADO    -127.0f // Lectura de DS18B20 desconectado
#define SENSOR_DESCONEXION_COUNT    10      // Lecturas inválidas para declarar desconexión

// =============================================================================
// CONFIGURACIÓN NTP Y ZONA HORARIA
// =============================================================================
#define NTP_SERVIDOR                "pool.ntp.org"
#define NTP_OFFSET_UTC              -14400  // UTC-4 en segundos (-4 * 3600)
#define NTP_INTERVALO_SYNC_MS       3600000 // Sincronizar cada hora

// =============================================================================
// CONFIGURACIÓN DEL PROGRAMADOR DE TAREAS
// =============================================================================
#define MAX_PROGRAMACIONES          20      // Máximo número de programaciones
#define ARCHIVO_PROGRAMACIONES      "/config/schedules.json"

// =============================================================================
// REGISTRO DE DATOS
// =============================================================================
#define LOG_INTERVALO_MS            300000  // Registrar cada 5 minutos
#define LOG_DIAS_MAXIMOS            7       // Máximo días de datos almacenados
#define LOG_DIRECTORIO              "/logs"
#define LOG_EVENTOS_ARCHIVO         "/logs/events.json"
#define LOG_EVENTOS_MAX             200     // Máximo de eventos en buffer circular

// =============================================================================
// SERVIDOR WEB
// =============================================================================
#define WEB_SERVER_PORT             80
#define WEB_SOCKET_PATH             "/ws"
#define WS_BROADCAST_INTERVAL_MS    3000    // Transmitir datos cada 3 segundos

// =============================================================================
// CALIBRACIÓN
// =============================================================================
#define CAL_ESTABILIDAD_UMBRAL      0.02f   // Varianza máxima para estabilidad
#define CAL_ESTABILIDAD_TIEMPO_MS   5000    // Tiempo requerido de estabilidad (5 seg)
#define CAL_HISTORIAL_ARCHIVO       "/config/cal_history.json"
#define CAL_MAX_HISTORIAL           20      // Máximo entradas en historial

// =============================================================================
// WATCHDOG
// =============================================================================
#define WDT_TIMEOUT_S               30      // Timeout del watchdog (segundos)

// =============================================================================
// CONFIGURACIÓN OTA
// =============================================================================
#define OTA_HOSTNAME                "HydroControl"
#define OTA_PASSWORD                "hydro_ota_2026"
#define OTA_PORT                    3232

// =============================================================================
// PREFERENCIAS (NVS) - Nombres de namespaces y claves
// =============================================================================
#define PREF_NAMESPACE              "hydrocontrol"
#define PREF_KEY_PH_PENDIENTE       "phPend"
#define PREF_KEY_PH_INTERCEPTO      "phInter"
#define PREF_KEY_EC_PENDIENTE       "ecPend"
#define PREF_KEY_EC_INTERCEPTO      "ecInter"
#define PREF_KEY_WIFI_SSID          "wifiSSID"
#define PREF_KEY_WIFI_PASS          "wifiPass"
#define PREF_KEY_MQTT_BROKER        "mqttBroker"
#define PREF_KEY_MQTT_PORT          "mqttPort"
#define PREF_KEY_MQTT_USER          "mqttUser"
#define PREF_KEY_MQTT_PASS          "mqttPass"
#define PREF_KEY_ZONA_ID            "zonaId"

// =============================================================================
// ESTADOS DEL SISTEMA
// =============================================================================
enum EstadoSistema {
    ESTADO_INIT = 0,          // Inicializando
    ESTADO_EJECUTANDO,        // En funcionamiento normal
    ESTADO_CALIBRANDO,        // En proceso de calibración
    ESTADO_ERROR,             // Error del sistema
    ESTADO_MANTENIMIENTO      // Modo mantenimiento
};

// =============================================================================
// ÍNDICES DE BOMBAS
// =============================================================================
enum IndiceBomba {
    BOMBA_PRINCIPAL = 0,
    BOMBA_NUTRIENTES_A,
    BOMBA_NUTRIENTES_B,
    BOMBA_PH_UP,
    BOMBA_PH_DOWN,
    BOMBA_RECIRCULACION
};

// =============================================================================
// MODOS DE OPERACIÓN
// =============================================================================
enum ModoOperacion {
    MODO_MANUAL = 0,
    MODO_AUTOMATICO,
    MODO_PROGRAMADO
};

#endif // CONFIG_H

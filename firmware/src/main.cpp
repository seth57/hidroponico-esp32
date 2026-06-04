#include <Arduino.h>
#include "config.h"
#include "sensor_manager.h"
#include "calibration.h"
#include "sensor_manager.h"
#include "pump_controller.h"
#include "light_controller.h"
#include "task_recovery.h"
// TODO: Include wifi, webserver, mqtt etc when ready.

#define PIN_JUMPER_MODE 14 // LOW = Autónomo, HIGH = Nube (Firebase)
bool isAutonomousMode = true;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- HydroControl Pro Iniciando ---");
    
    // Configurar pin del Jumper con resistencia pull-up interna
    pinMode(PIN_JUMPER_MODE, INPUT_PULLUP);
    
    // Initialize components
    calibration.begin();
    pumps.begin();
    lights.begin();
    
    // Initialize RTC, ADS1115 and Recovery system
    Wire.begin(21, 22); // I2C pins for both ADS1115 and RTC DS3231
    sensors.begin();
    taskRecovery.begin();
    
    // Check for missed tasks immediately on boot
    taskRecovery.processMissedTasks();
    
    // Placeholder for other init
    Serial.println("Sistema inicializado correctamente.");
}

void loop() {
    // Lectura de sensores reales vía ADS1115 (pH, EC, LDR)
    sensors.update();
    
    // Evaluar Modo de Operación: Jumper físico o Estado de Red
    // Si el jumper está en ON (GND) -> Autónomo
    // Si está en OFF (HIGH) pero falla la comunicación (ej. sin WiFi/MQTT) -> Autónomo como respaldo
    bool cloudConnected = false; // TODO: reemplazar con mqttClient.isConnected() cuando esté implementado el módulo WiFi/MQTT
    
    if (digitalRead(PIN_JUMPER_MODE) == LOW || !cloudConnected) {
        if (!isAutonomousMode) {
            Serial.println("MODO AUTÓNOMO ACTIVO (Por Jumper o pérdida de conexión). Usando config local.");
            isAutonomousMode = true;
        }
        // En modo autónomo, el ESP32 usa sus propias reglas y horarios guardados
        pumps.update();
        lights.update("12:00", sensors.getLightLevel()); // Horario local
    } else {
        if (isAutonomousMode) {
            Serial.println("MODO NUBE ACTIVO. Dependiendo de Firebase/Servidor Central.");
            isAutonomousMode = false;
        }
        // En modo nube, las órdenes de bombas y luces vienen de Firebase (vía MQTT).
        // Solo actualizamos sensores para mandarlos a la nube.
        // pumps.update() no aplicará horarios locales si se configura para omitirlos en modo nube.
        pumps.update(); // Mantiene gestión de timeout de seguridad
    }
    
    // Registrar ejecución periódicamente (simulación de una tarea finalizada exitosamente)
    static unsigned long lastSaveTime = 0;
    if (millis() - lastSaveTime > 60000) { // Registrar estado de vida cada minuto
        taskRecovery.registerSuccessfulTask();
        lastSaveTime = millis();
    }
    
    // Placeholder delay
    delay(100);
}

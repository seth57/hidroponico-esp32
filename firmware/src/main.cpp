#include <Arduino.h>
#include "config.h"
#include "sensor_manager.h"
#include "calibration.h"
#include "sensor_manager.h"
#include "pump_controller.h"
#include "light_controller.h"
#include "task_recovery.h"
// TODO: Include wifi, webserver, mqtt etc when ready.

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- HydroControl Pro Iniciando ---");
    
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
    
    // Update modules
    pumps.update();
    
    // Pasamos la hora actual simulada y el nivel de luz natural al controlador
    // String time = getNTPTimeHHMM(); o usar RTC
    lights.update("12:00", sensors.getLightLevel()); 
    
    // Registrar ejecución periódicamente (simulación de una tarea finalizada exitosamente)
    static unsigned long lastSaveTime = 0;
    if (millis() - lastSaveTime > 60000) { // Registrar estado de vida cada minuto
        taskRecovery.registerSuccessfulTask();
        lastSaveTime = millis();
    }
    
    // Placeholder delay
    delay(100);
}

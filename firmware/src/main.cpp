#include <Arduino.h>
#include "config.h"
#include "sensor_manager.h"
#include "calibration.h"
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
    
    // Initialize RTC and Recovery system
    Wire.begin(21, 22); // I2C pins for both ADS1115 and RTC DS3231
    taskRecovery.begin();
    
    // Check for missed tasks immediately on boot
    taskRecovery.processMissedTasks();
    
    // Placeholder for other init
    Serial.println("Sistema inicializado correctamente.");
}

void loop() {
    // Lectura de sensores simulada o real si sensor_manager está implementado completo
    
    // Update modules
    pumps.update();
    // String time = getNTPTimeHHMM(); 
    lights.update("12:00"); // simulado
    
    // Registrar ejecución periódicamente (simulación de una tarea finalizada exitosamente)
    static unsigned long lastSaveTime = 0;
    if (millis() - lastSaveTime > 60000) { // Registrar estado de vida cada minuto
        taskRecovery.registerSuccessfulTask();
        lastSaveTime = millis();
    }
    
    // Placeholder delay
    delay(100);
}

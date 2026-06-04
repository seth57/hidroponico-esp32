#include <Arduino.h>
#include "config.h"
#include "sensor_manager.h"
#include "calibration.h"
#include "pump_controller.h"
#include "light_controller.h"
// TODO: Include wifi, webserver, mqtt etc when ready.

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- HydroControl Pro Iniciando ---");
    
    // Initialize components
    calibration.begin();
    pumps.begin();
    lights.begin();
    
    // Placeholder for other init
    Serial.println("Sistema inicializado correctamente.");
}

void loop() {
    // Lectura de sensores simulada o real si sensor_manager está implementado completo
    
    // Update modules
    pumps.update();
    // String time = getNTPTimeHHMM(); 
    lights.update("12:00"); // simulado
    
    // Placeholder delay
    delay(100);
}

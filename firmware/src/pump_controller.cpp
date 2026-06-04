#include "pump_controller.h"

PumpController pumps;

PumpController::PumpController() {
    pumps[0] = new Pump(0, "Principal", PIN_PUMP_MAIN);
    pumps[1] = new Pump(1, "Nutrientes A", PIN_PUMP_NUTA);
    pumps[2] = new Pump(2, "Nutrientes B", PIN_PUMP_NUTB);
    pumps[3] = new Pump(3, "pH Up", PIN_PUMP_PH_UP);
    pumps[4] = new Pump(4, "pH Down", PIN_PUMP_PH_DOWN);
    pumps[5] = new Pump(5, "Recirculación", PIN_PUMP_RECIRC);
    lastUpdate = 0;
}

void PumpController::begin() {
    for (int i = 0; i < 6; i++) {
        pinMode(pumps[i]->pin, OUTPUT);
        digitalWrite(pumps[i]->pin, LOW); // Todas apagadas por seguridad al iniciar
    }
    Serial.println("Controlador de bombas inicializado.");
}

void PumpController::update() {
    unsigned long currentMillis = millis();
    
    // Actualizar runtime
    if (currentMillis - lastUpdate >= 1000) {
        lastUpdate = currentMillis;
        for (int i = 0; i < 6; i++) {
            if (pumps[i]->state) {
                pumps[i]->runtime++;
                
                // Timeout de seguridad (ej: 30 mins máximo continuo)
                if ((currentMillis - pumps[i]->lastOnTime) > 30 * 60 * 1000) {
                    Serial.printf("Alarma: Timeout alcanzado para bomba %s. Apagando.\n", pumps[i]->name.c_str());
                    setPumpState(i, false);
                }
            }
        }
    }
}

void PumpController::setPumpState(int id, bool state) {
    if (id < 0 || id >= 6) return;
    
    // Interlock: no permitir pH Up y pH Down al mismo tiempo
    if (id == 3 && state && getPumpState(4)) {
        setPumpState(4, false);
    } else if (id == 4 && state && getPumpState(3)) {
        setPumpState(3, false);
    }
    
    pumps[id]->state = state;
    digitalWrite(pumps[id]->pin, state ? HIGH : LOW);
    
    if (state) {
        pumps[id]->lastOnTime = millis();
    }
    
    Serial.printf("Bomba %s (%d) cambiada a estado: %s\n", pumps[id]->name.c_str(), id, state ? "ON" : "OFF");
}

void PumpController::setPumpMode(int id, PumpMode mode) {
    if (id < 0 || id >= 6) return;
    pumps[id]->mode = mode;
    Serial.printf("Bomba %s modo cambiado a: %d\n", pumps[id]->name.c_str(), mode);
}

bool PumpController::getPumpState(int id) {
    if (id < 0 || id >= 6) return false;
    return pumps[id]->state;
}

PumpMode PumpController::getPumpMode(int id) {
    if (id < 0 || id >= 6) return PUMP_MANUAL;
    return pumps[id]->mode;
}

Pump* PumpController::getPump(int id) {
    if (id < 0 || id >= 6) return nullptr;
    return pumps[id];
}

#include "light_controller.h"

LightController lights;

LightController::LightController() {
    // 5 zones using different pins
    channels[0] = new LightChannel(1, 16);
    channels[1] = new LightChannel(2, 17);
    channels[2] = new LightChannel(3, 18);
    channels[3] = new LightChannel(4, 19);
    channels[4] = new LightChannel(5, 2);
}

void LightController::begin() {
    for (int i = 0; i < 5; i++) {
        pinMode(channels[i]->pin, OUTPUT);
        digitalWrite(channels[i]->pin, LOW); // Off by default
    }
    Serial.println("Controlador de iluminación inicializado.");
}

void LightController::update(String currentTimeHHMM) {
    for (int i = 0; i < 5; i++) {
        if (channels[i]->mode == LIGHT_PROGRAMADO) {
            // Simple string comparison for HH:MM format
            // Handles passing midnight
            bool shouldBeOn = false;
            if (channels[i]->timeOn < channels[i]->timeOff) {
                // Example: 08:00 to 20:00
                shouldBeOn = (currentTimeHHMM >= channels[i]->timeOn && currentTimeHHMM < channels[i]->timeOff);
            } else {
                // Example: 18:00 to 06:00 (overnight)
                shouldBeOn = (currentTimeHHMM >= channels[i]->timeOn || currentTimeHHMM < channels[i]->timeOff);
            }
            
            if (shouldBeOn != channels[i]->state) {
                setLightState(i + 1, shouldBeOn);
            }
        }
    }
}

void LightController::setLightState(int zoneId, bool state) {
    if (zoneId < 1 || zoneId > 5) return;
    int index = zoneId - 1;
    
    channels[index]->state = state;
    digitalWrite(channels[index]->pin, state ? HIGH : LOW);
    
    Serial.printf("Iluminación Zona %d cambiada a: %s\n", zoneId, state ? "ON" : "OFF");
}

void LightController::setLightMode(int zoneId, LightMode mode) {
    if (zoneId < 1 || zoneId > 5) return;
    channels[zoneId - 1]->mode = mode;
    Serial.printf("Iluminación Zona %d modo cambiado a: %d\n", zoneId, mode);
}

void LightController::setSchedule(int zoneId, String timeOn, String timeOff) {
    if (zoneId < 1 || zoneId > 5) return;
    int index = zoneId - 1;
    channels[index]->timeOn = timeOn;
    channels[index]->timeOff = timeOff;
    Serial.printf("Iluminación Zona %d programada: ON %s, OFF %s\n", zoneId, timeOn.c_str(), timeOff.c_str());
}

bool LightController::getLightState(int zoneId) {
    if (zoneId < 1 || zoneId > 5) return false;
    return channels[zoneId - 1]->state;
}

LightMode LightController::getLightMode(int zoneId) {
    if (zoneId < 1 || zoneId > 5) return LIGHT_MANUAL;
    return channels[zoneId - 1]->mode;
}

LightChannel* LightController::getChannel(int zoneId) {
    if (zoneId < 1 || zoneId > 5) return nullptr;
    return channels[zoneId - 1];
}

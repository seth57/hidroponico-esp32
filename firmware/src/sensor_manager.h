#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>

class SensorManager {
private:
    Adafruit_ADS1115 ads;
    float currentPH;
    float currentEC;
    float currentLDR; // 0.0 a 100.0 %
    
    // Filtros de media móvil simples
    float phBuffer[10];
    float ecBuffer[10];
    uint8_t bufferIndex;

    float readADSVoltage(uint8_t channel);

public:
    SensorManager();
    void begin();
    void update();
    
    float getPH();
    float getEC();
    float getLightLevel(); // Retorna porcentaje de luminosidad natural
};

extern SensorManager sensors;

#endif

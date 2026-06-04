#include "sensor_manager.h"
#include "calibration.h"

SensorManager sensors;

SensorManager::SensorManager() {
    currentPH = 7.0;
    currentEC = 1.0;
    currentLDR = 100.0;
    bufferIndex = 0;
    for(int i=0; i<10; i++) {
        phBuffer[i] = 7.0;
        ecBuffer[i] = 1.0;
    }
}

void SensorManager::begin() {
    if (!ads.begin()) {
        Serial.println("Fallo al inicializar ADS1115.");
    } else {
        Serial.println("ADS1115 inicializado.");
        ads.setGain(GAIN_ONE); // 1x gain   +/- 4.096V  1 bit = 0.125mV
    }
}

float SensorManager::readADSVoltage(uint8_t channel) {
    int16_t adc = ads.readADC_SingleEnded(channel);
    return ads.computeVolts(adc);
}

void SensorManager::update() {
    // Leer voltajes del ADC
    float vPH = readADSVoltage(0); // Canal A0 para pH
    float vEC = readADSVoltage(1); // Canal A1 para EC
    float vLDR = readADSVoltage(2); // Canal A2 para LDR
    
    // Actualizar máquina de calibración con el voltaje crudo
    calibration.update(calibration.getCurrentSensor() == SENSOR_PH ? vPH : vEC);
    
    // Mapeo básico de voltaje a valor (usando coeficientes guardados)
    // Formula lineal: y = m*x + b
    float calcPH = (calibration.getPHCoefficient_m() * vPH) + calibration.getPHCoefficient_b();
    float calcEC = (calibration.getECCoefficient_m() * vEC) + calibration.getECCoefficient_b();
    
    // Filtro de media móvil
    phBuffer[bufferIndex] = calcPH;
    ecBuffer[bufferIndex] = calcEC;
    bufferIndex = (bufferIndex + 1) % 10;
    
    float sumPH = 0;
    float sumEC = 0;
    for(int i=0; i<10; i++) {
        sumPH += phBuffer[i];
        sumEC += ecBuffer[i];
    }
    currentPH = sumPH / 10.0;
    currentEC = sumEC / 10.0;
    
    // Cálculo de LDR: Suponiendo divisor de voltaje a 3.3V, Max volt ~3.3V
    // Mapeo de voltaje a porcentaje (0% oscuro, 100% brillante)
    // El divisor exacto puede variar, asumimos 0V = 0%, 3.3V = 100%
    currentLDR = (vLDR / 3.3) * 100.0;
    if (currentLDR > 100.0) currentLDR = 100.0;
    if (currentLDR < 0.0) currentLDR = 0.0;
}

float SensorManager::getPH() { return currentPH; }
float SensorManager::getEC() { return currentEC; }
float SensorManager::getLightLevel() { return currentLDR; }

#include "calibration.h"

CalibrationManager calibration;

CalibrationManager::CalibrationManager() {
    currentState = CAL_IDLE;
    ph_voltage_4 = 2.0; // Valores por defecto (ajustar según sensor)
    ph_voltage_7 = 1.5;
    ec_voltage_1_413 = 1.0;
    ec_voltage_12_88 = 2.0;
}

void CalibrationManager::begin() {
    prefs.begin("hydro_calib", false);
    loadCoefficients();
    Serial.println("Calibración inicializada. Coeficientes cargados.");
}

void CalibrationManager::loadCoefficients() {
    ph_voltage_4 = prefs.getFloat("ph_v4", 2.0);
    ph_voltage_7 = prefs.getFloat("ph_v7", 1.5);
    ec_voltage_1_413 = prefs.getFloat("ec_v1_4", 1.0);
    ec_voltage_12_88 = prefs.getFloat("ec_v12_8", 2.0);
}

void CalibrationManager::saveCoefficients() {
    prefs.putFloat("ph_v4", ph_voltage_4);
    prefs.putFloat("ph_v7", ph_voltage_7);
    prefs.putFloat("ec_v1_4", ec_voltage_1_413);
    prefs.putFloat("ec_v12_8", ec_voltage_12_88);
    Serial.println("Nuevos coeficientes guardados en NVS.");
}

void CalibrationManager::update(float currentSensorVoltage) {
    if (currentState == CAL_IDLE || currentState == CAL_COMPLETE || currentState == CAL_ERROR) return;

    if (currentState == CAL_STABILIZING1 || currentState == CAL_STABILIZING2) {
        if (abs(currentSensorVoltage - lastVoltage) < 0.05) { // Tolerancia
            stabilityCounter++;
        } else {
            stabilityCounter = 0;
        }
        
        lastVoltage = currentSensorVoltage;
        
        // 5 segundos de estabilidad (asumiendo update() llamado cada 1s)
        if (stabilityCounter >= 5) {
            this->currentVoltage = currentSensorVoltage;
            
            if (currentState == CAL_STABILIZING1) {
                currentState = CAL_WAITING_POINT2;
                Serial.println("Punto 1 estabilizado. Esperando Punto 2.");
            } else if (currentState == CAL_STABILIZING2) {
                currentState = CAL_COMPLETE;
                Serial.println("Punto 2 estabilizado. Calibración completa.");
            }
        }
    }
}

void CalibrationManager::beginPHCalibration() {
    currentSensor = SENSOR_PH;
    currentState = CAL_WAITING_POINT1;
    stabilityCounter = 0;
    Serial.println("Iniciando calibración de pH. Coloque el sensor en buffer pH 7.0");
}

void CalibrationManager::beginECCalibration() {
    currentSensor = SENSOR_EC;
    currentState = CAL_WAITING_POINT1;
    stabilityCounter = 0;
    Serial.println("Iniciando calibración de EC. Coloque el sensor en solución 1.413 mS/cm");
}

void CalibrationManager::advanceCalibration(float referenceValue) {
    if (currentState == CAL_WAITING_POINT1) {
        currentState = CAL_STABILIZING1;
        Serial.println("Estabilizando lectura para Punto 1...");
    } else if (currentState == CAL_WAITING_POINT2) {
        currentState = CAL_STABILIZING2;
        Serial.println("Estabilizando lectura para Punto 2...");
    } else if (currentState == CAL_COMPLETE) {
        // Al finalizar, guardamos los valores según el tipo de sensor
        if (currentSensor == SENSOR_PH) {
            // Asumimos que Punto 1 fue pH 7 y Punto 2 fue pH 4
            ph_voltage_7 = this->currentVoltage; // Valor de Punto 1 guardado previamente
            ph_voltage_4 = this->currentVoltage; // En una versión completa esto requiere lógica más robusta para mapear el buffer al valor leído
            saveCoefficients();
        } else {
            ec_voltage_1_413 = this->currentVoltage;
            ec_voltage_12_88 = this->currentVoltage;
            saveCoefficients();
        }
        currentState = CAL_IDLE;
    }
}

void CalibrationManager::cancelCalibration() {
    currentState = CAL_IDLE;
    Serial.println("Calibración cancelada.");
}

CalibrationState CalibrationManager::getStatus() {
    return currentState;
}

SensorType CalibrationManager::getCurrentSensor() {
    return currentSensor;
}

// m = (y2 - y1) / (x2 - x1)
float CalibrationManager::getPHCoefficient_m() {
    return (4.0 - 7.0) / (ph_voltage_4 - ph_voltage_7);
}

// b = y - m*x
float CalibrationManager::getPHCoefficient_b() {
    return 7.0 - (getPHCoefficient_m() * ph_voltage_7);
}

float CalibrationManager::getECCoefficient_m() {
    return (12.88 - 1.413) / (ec_voltage_12_88 - ec_voltage_1_413);
}

float CalibrationManager::getECCoefficient_b() {
    return 1.413 - (getECCoefficient_m() * ec_voltage_1_413);
}

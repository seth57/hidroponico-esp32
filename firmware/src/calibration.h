#ifndef CALIBRATION_H
#define CALIBRATION_H

#include <Arduino.h>
#include <Preferences.h>
#include <ArduinoJson.h>

enum CalibrationState {
    CAL_IDLE,
    CAL_WAITING_POINT1,
    CAL_STABILIZING1,
    CAL_WAITING_POINT2,
    CAL_STABILIZING2,
    CAL_COMPLETE,
    CAL_ERROR
};

enum SensorType {
    SENSOR_PH,
    SENSOR_EC
};

class CalibrationManager {
private:
    Preferences prefs;
    CalibrationState currentState;
    SensorType currentSensor;
    
    // pH Calibration Data
    float ph_voltage_4;
    float ph_voltage_7;
    
    // EC Calibration Data
    float ec_voltage_1_413;
    float ec_voltage_12_88;
    
    // State machine variables
    unsigned long stateStartTime;
    float currentVoltage;
    float lastVoltage;
    int stabilityCounter;
    
    void loadCoefficients();
    void saveCoefficients();

public:
    CalibrationManager();
    void begin();
    void update(float currentSensorVoltage);
    
    void beginPHCalibration();
    void beginECCalibration();
    void advanceCalibration(float referenceValue);
    void cancelCalibration();
    
    CalibrationState getStatus();
    SensorType getCurrentSensor();
    
    float getPHCoefficient_m();
    float getPHCoefficient_b();
    
    float getECCoefficient_m();
    float getECCoefficient_b();
};

extern CalibrationManager calibration;

#endif

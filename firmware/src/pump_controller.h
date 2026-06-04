#ifndef PUMP_CONTROLLER_H
#define PUMP_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

enum PumpMode {
    PUMP_MANUAL,
    PUMP_AUTOMATICO,
    PUMP_PROGRAMADO
};

class Pump {
public:
    int id;
    String name;
    uint8_t pin;
    bool state;
    PumpMode mode;
    unsigned long runtime; // in seconds
    unsigned long lastOnTime;
    
    Pump(int id, String name, uint8_t pin) : id(id), name(name), pin(pin), state(false), mode(PUMP_AUTOMATICO), runtime(0), lastOnTime(0) {}
};

class PumpController {
private:
    Pump* pumps[6];
    unsigned long lastUpdate;
    
public:
    PumpController();
    void begin();
    void update();
    void setPumpState(int id, bool state);
    void setPumpMode(int id, PumpMode mode);
    bool getPumpState(int id);
    PumpMode getPumpMode(int id);
    Pump* getPump(int id);
};

extern PumpController pumps;

#endif

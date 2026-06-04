#ifndef LIGHT_CONTROLLER_H
#define LIGHT_CONTROLLER_H

#include <Arduino.h>

enum LightMode {
    LIGHT_MANUAL,
    LIGHT_AUTOMATICO,
    LIGHT_PROGRAMADO
};

class LightChannel {
public:
    int zoneId;
    uint8_t pin;
    bool state;
    LightMode mode;
    String timeOn;  // Format HH:MM
    String timeOff; // Format HH:MM
    
    LightChannel(int zoneId, uint8_t pin) : zoneId(zoneId), pin(pin), state(false), mode(LIGHT_PROGRAMADO), timeOn("18:00"), timeOff("06:00") {}
};

class LightController {
private:
    LightChannel* channels[5];
    
public:
    LightController();
    void begin();
    void update(String currentTimeHHMM);
    void setLightState(int zoneId, bool state);
    void setLightMode(int zoneId, LightMode mode);
    void setSchedule(int zoneId, String timeOn, String timeOff);
    bool getLightState(int zoneId);
    LightMode getLightMode(int zoneId);
    LightChannel* getChannel(int zoneId);
};

extern LightController lights;

#endif

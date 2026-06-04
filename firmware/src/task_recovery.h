#ifndef TASK_RECOVERY_H
#define TASK_RECOVERY_H

#include <Arduino.h>
#include <RTClib.h>
#include <Preferences.h>

class TaskRecovery {
private:
    RTC_DS3231 rtc;
    Preferences prefs;
    bool rtcAvailable;
    
    // Almacenamiento del último registro
    uint32_t lastTaskTimestamp;

public:
    TaskRecovery();
    void begin();
    
    // Guarda el momento exacto (Unix time) de una acción ejecutada correctamente
    void registerSuccessfulTask();
    
    // Compara el último registro guardado con el tiempo actual
    // para encolar y recuperar tareas que no se ejecutaron por falta de energía
    void processMissedTasks();
    
    // Sincronizar RTC cuando se obtiene hora via NTP (Internet)
    void syncTimeFromNTP(uint32_t ntpUnixTime);
    
    // Obtener fecha actual desde RTC
    DateTime now();
};

extern TaskRecovery taskRecovery;

#endif

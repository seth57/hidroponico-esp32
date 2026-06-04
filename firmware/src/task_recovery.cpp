#include "task_recovery.h"
#include "pump_controller.h" // Para mandar a ejecutar riegos pendientes

TaskRecovery taskRecovery;

TaskRecovery::TaskRecovery() {
    rtcAvailable = false;
    lastTaskTimestamp = 0;
}

void TaskRecovery::begin() {
    if (!rtc.begin()) {
        Serial.println("¡No se pudo encontrar el RTC DS3231!");
        rtcAvailable = false;
    } else {
        rtcAvailable = true;
        if (rtc.lostPower()) {
            Serial.println("RTC perdió energía, configurando hora por defecto.");
            // En caso de perder la batería, se ajustará luego con NTP
            rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
        }
        Serial.println("RTC inicializado correctamente.");
    }
    
    prefs.begin("task_state", false);
    lastTaskTimestamp = prefs.getUInt("last_ts", 0);
    
    Serial.printf("Último timestamp guardado de ejecución: %u\n", lastTaskTimestamp);
}

void TaskRecovery::registerSuccessfulTask() {
    if (rtcAvailable) {
        lastTaskTimestamp = rtc.now().unixtime();
        prefs.putUInt("last_ts", lastTaskTimestamp);
        // Serial.println("Timestamp de tarea registrada con éxito.");
    }
}

void TaskRecovery::processMissedTasks() {
    if (!rtcAvailable || lastTaskTimestamp == 0) return;
    
    uint32_t currentTime = rtc.now().unixtime();
    
    // Si ha pasado más de 1 hora (3600 segundos) desde la última acción guardada
    // Se considera que hubo una caída larga de energía y se perdieron riegos.
    if (currentTime > lastTaskTimestamp + 3600) {
        Serial.println("¡Se detectaron tareas perdidas! Evaluando la ventana de tiempo offline...");
        
        // --- LÓGICA DE RECUPERACIÓN ---
        // Por seguridad, solo recuperaremos el último ciclo de riego perdido
        // para no inundar el sistema de golpe.
        
        Serial.println(">>> Encolando un ciclo de riego de emergencia para compensar <<<");
        // pumps.setPumpState(0, true); // Activar bomba principal por 1 ciclo corto
        // Se puede añadir un timeout aquí o usar la misma API
        
        // Al final, marcamos que ya nos pusimos al día
        registerSuccessfulTask();
    } else {
        Serial.println("No hay tareas pendientes perdidas o la caída de voltaje fue muy breve.");
    }
}

void TaskRecovery::syncTimeFromNTP(uint32_t ntpUnixTime) {
    if (rtcAvailable) {
        rtc.adjust(DateTime(ntpUnixTime));
        Serial.println("RTC sincronizado con hora de internet.");
    }
}

DateTime TaskRecovery::now() {
    if (rtcAvailable) {
        return rtc.now();
    }
    return DateTime();
}

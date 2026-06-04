// =============================================================================
// HydroControl Pro - Gestor de Sensores
// Lectura y procesamiento de sensores pH, EC y temperatura
// =============================================================================

#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <Adafruit_ADS1X15.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// Estructura para almacenar los coeficientes de calibración
struct CoeficientesCalibración {
    float pendiente;
    float intercepto;
};

// Estructura para el filtro de media móvil
struct FiltroMediaMovil {
    float muestras[FILTRO_NUM_MUESTRAS];
    uint8_t indiceMuestra;
    uint8_t muestrasValidas;
    float suma;
    
    void reset() {
        indiceMuestra = 0;
        muestrasValidas = 0;
        suma = 0.0f;
        for (int i = 0; i < FILTRO_NUM_MUESTRAS; i++) {
            muestras[i] = 0.0f;
        }
    }
    
    float agregar(float valor) {
        // Restar la muestra más antigua de la suma
        suma -= muestras[indiceMuestra];
        // Agregar nueva muestra
        muestras[indiceMuestra] = valor;
        suma += valor;
        indiceMuestra = (indiceMuestra + 1) % FILTRO_NUM_MUESTRAS;
        if (muestrasValidas < FILTRO_NUM_MUESTRAS) {
            muestrasValidas++;
        }
        return suma / muestrasValidas;
    }
};

class SensorManager {
public:
    SensorManager();
    
    // Inicializar todos los sensores
    bool begin();
    
    // Actualizar lecturas de sensores (llamar en loop)
    void update();
    
    // Obtener valores procesados
    float getPH() const;
    float getEC() const;
    float getTemperatura() const;
    
    // Obtener voltajes crudos (útil para calibración)
    float getVoltajePH() const;
    float getVoltajeEC() const;
    
    // Verificar validez de sensores
    bool isPHValido() const;
    bool isECValido() const;
    bool isTemperaturaValida() const;
    bool isValid() const;  // Todos los sensores válidos
    
    // Configurar coeficientes de calibración
    void setCoeficientesPH(float pendiente, float intercepto);
    void setCoeficientesEC(float pendiente, float intercepto);
    
    // Obtener coeficientes actuales
    CoeficientesCalibración getCoeficientesPH() const;
    CoeficientesCalibración getCoeficientesEC() const;

private:
    // Hardware
    Adafruit_ADS1115 _ads;
    OneWire _oneWire;
    DallasTemperature _ds18b20;
    
    // Coeficientes de calibración
    CoeficientesCalibración _coefPH;
    CoeficientesCalibración _coefEC;
    
    // Filtros de media móvil
    FiltroMediaMovil _filtroPH;
    FiltroMediaMovil _filtroEC;
    FiltroMediaMovil _filtroTemp;
    
    // Valores procesados
    float _ph;
    float _ec;
    float _temperatura;
    float _voltajePH;
    float _voltajeEC;
    
    // Estado de los sensores
    bool _adsConectado;
    bool _ds18b20Conectado;
    uint8_t _contadorErrorPH;
    uint8_t _contadorErrorEC;
    uint8_t _contadorErrorTemp;
    
    // Temporización
    unsigned long _ultimaLectura;
    unsigned long _ultimaLecturaTemp;
    
    // Métodos internos
    float _leerVoltajeADS(uint8_t canal);
    float _convertirVoltajeAPH(float voltaje);
    float _convertirVoltajeAEC(float voltaje, float temperatura);
    float _leerTemperatura();
};

#endif // SENSOR_MANAGER_H

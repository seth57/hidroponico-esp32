// =============================================================================
// HydroControl Pro - Gestor de Sensores (Implementación)
// Lectura y procesamiento de sensores pH, EC y temperatura
// =============================================================================

#include "sensor_manager.h"

// =============================================================================
// Constructor
// =============================================================================
SensorManager::SensorManager()
    : _oneWire(PIN_ONEWIRE),
      _ds18b20(&_oneWire),
      _ph(0.0f),
      _ec(0.0f),
      _temperatura(25.0f),
      _voltajePH(0.0f),
      _voltajeEC(0.0f),
      _adsConectado(false),
      _ds18b20Conectado(false),
      _contadorErrorPH(0),
      _contadorErrorEC(0),
      _contadorErrorTemp(0),
      _ultimaLectura(0),
      _ultimaLecturaTemp(0)
{
    // Coeficientes de calibración por defecto
    _coefPH.pendiente = PH_PENDIENTE_DEFAULT;
    _coefPH.intercepto = PH_INTERCEPTO_DEFAULT;
    _coefEC.pendiente = EC_PENDIENTE_DEFAULT;
    _coefEC.intercepto = EC_INTERCEPTO_DEFAULT;
    
    // Inicializar filtros
    _filtroPH.reset();
    _filtroEC.reset();
    _filtroTemp.reset();
}

// =============================================================================
// Inicialización
// =============================================================================
bool SensorManager::begin() {
    Serial.println("[Sensores] Inicializando gestor de sensores...");
    
    // Inicializar bus I2C
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    
    // Inicializar ADS1115
    if (_ads.begin(ADS1115_ADDRESS)) {
        _adsConectado = true;
        _ads.setGain(GAIN_ONE); // ±4.096V
        Serial.println("[Sensores] ADS1115 detectado correctamente");
    } else {
        _adsConectado = false;
        Serial.println("[Sensores] ERROR: No se detectó el ADS1115");
    }
    
    // Inicializar DS18B20
    _ds18b20.begin();
    uint8_t numDispositivos = _ds18b20.getDeviceCount();
    if (numDispositivos > 0) {
        _ds18b20Conectado = true;
        _ds18b20.setResolution(12); // Resolución máxima
        _ds18b20.setWaitForConversion(false); // Lectura asíncrona
        _ds18b20.requestTemperatures(); // Iniciar primera lectura
        Serial.printf("[Sensores] DS18B20 detectado - %d dispositivo(s)\n", numDispositivos);
    } else {
        _ds18b20Conectado = false;
        Serial.println("[Sensores] ADVERTENCIA: No se detectó sensor DS18B20");
    }
    
    // Resetear filtros
    _filtroPH.reset();
    _filtroEC.reset();
    _filtroTemp.reset();
    
    Serial.println("[Sensores] Gestor de sensores inicializado");
    return _adsConectado; // El ADS1115 es esencial
}

// =============================================================================
// Actualización periódica
// =============================================================================
void SensorManager::update() {
    unsigned long ahora = millis();
    
    // Leer sensores analógicos (pH y EC) según intervalo configurado
    if (ahora - _ultimaLectura >= SENSOR_LECTURA_INTERVAL_MS) {
        _ultimaLectura = ahora;
        
        if (_adsConectado) {
            // --- Lectura de pH ---
            float voltajePH = _leerVoltajeADS(ADS_CANAL_PH);
            if (voltajePH >= SENSOR_VOLTAJE_MIN && voltajePH <= SENSOR_VOLTAJE_MAX) {
                _voltajePH = voltajePH;
                float phCrudo = _convertirVoltajeAPH(voltajePH);
                _ph = _filtroPH.agregar(phCrudo);
                _contadorErrorPH = 0;
            } else {
                _contadorErrorPH++;
                if (_contadorErrorPH >= SENSOR_DESCONEXION_COUNT) {
                    Serial.println("[Sensores] ALARMA: Sensor de pH desconectado");
                }
            }
            
            // --- Lectura de EC ---
            float voltajeEC = _leerVoltajeADS(ADS_CANAL_EC);
            if (voltajeEC >= SENSOR_VOLTAJE_MIN && voltajeEC <= SENSOR_VOLTAJE_MAX) {
                _voltajeEC = voltajeEC;
                float ecCrudo = _convertirVoltajeAEC(voltajeEC, _temperatura);
                _ec = _filtroEC.agregar(ecCrudo);
                _contadorErrorEC = 0;
            } else {
                _contadorErrorEC++;
                if (_contadorErrorEC >= SENSOR_DESCONEXION_COUNT) {
                    Serial.println("[Sensores] ALARMA: Sensor de EC desconectado");
                }
            }
        }
    }
    
    // Leer temperatura cada 1 segundo (DS18B20 tarda ~750ms en conversión de 12 bits)
    if (ahora - _ultimaLecturaTemp >= 1000) {
        _ultimaLecturaTemp = ahora;
        
        if (_ds18b20Conectado) {
            float temp = _leerTemperatura();
            if (temp != SENSOR_TEMP_DESCONECTADO && temp > -50.0f && temp < 85.0f) {
                _temperatura = _filtroTemp.agregar(temp);
                _contadorErrorTemp = 0;
            } else {
                _contadorErrorTemp++;
                if (_contadorErrorTemp >= SENSOR_DESCONEXION_COUNT) {
                    Serial.println("[Sensores] ALARMA: Sensor de temperatura desconectado");
                    _ds18b20Conectado = false;
                }
            }
            // Solicitar nueva conversión
            _ds18b20.requestTemperatures();
        }
    }
}

// =============================================================================
// Getters de valores procesados
// =============================================================================
float SensorManager::getPH() const {
    return _ph;
}

float SensorManager::getEC() const {
    return _ec;
}

float SensorManager::getTemperatura() const {
    return _temperatura;
}

float SensorManager::getVoltajePH() const {
    return _voltajePH;
}

float SensorManager::getVoltajeEC() const {
    return _voltajeEC;
}

// =============================================================================
// Validación de sensores
// =============================================================================
bool SensorManager::isPHValido() const {
    return _adsConectado && (_contadorErrorPH < SENSOR_DESCONEXION_COUNT);
}

bool SensorManager::isECValido() const {
    return _adsConectado && (_contadorErrorEC < SENSOR_DESCONEXION_COUNT);
}

bool SensorManager::isTemperaturaValida() const {
    return _ds18b20Conectado && (_contadorErrorTemp < SENSOR_DESCONEXION_COUNT);
}

bool SensorManager::isValid() const {
    return isPHValido() && isECValido() && isTemperaturaValida();
}

// =============================================================================
// Configuración de coeficientes de calibración
// =============================================================================
void SensorManager::setCoeficientesPH(float pendiente, float intercepto) {
    _coefPH.pendiente = pendiente;
    _coefPH.intercepto = intercepto;
    _filtroPH.reset(); // Resetear filtro al cambiar calibración
    Serial.printf("[Sensores] Calibración pH actualizada: pendiente=%.4f, intercepto=%.4f\n",
                  pendiente, intercepto);
}

void SensorManager::setCoeficientesEC(float pendiente, float intercepto) {
    _coefEC.pendiente = pendiente;
    _coefEC.intercepto = intercepto;
    _filtroEC.reset(); // Resetear filtro al cambiar calibración
    Serial.printf("[Sensores] Calibración EC actualizada: pendiente=%.4f, intercepto=%.4f\n",
                  pendiente, intercepto);
}

CoeficientesCalibración SensorManager::getCoeficientesPH() const {
    return _coefPH;
}

CoeficientesCalibración SensorManager::getCoeficientesEC() const {
    return _coefEC;
}

// =============================================================================
// Métodos internos - Lectura de voltaje del ADS1115
// =============================================================================
float SensorManager::_leerVoltajeADS(uint8_t canal) {
    int16_t adcRaw = _ads.readADC_SingleEnded(canal);
    // Con ganancia GAIN_ONE, el factor de conversión es 0.125mV por bit
    float voltaje = adcRaw * 0.125f / 1000.0f;
    return voltaje;
}

// =============================================================================
// Conversión de voltaje a pH
// pH = pendiente * voltaje + intercepto
// =============================================================================
float SensorManager::_convertirVoltajeAPH(float voltaje) {
    float ph = _coefPH.pendiente * voltaje + _coefPH.intercepto;
    // Limitar a rango válido de pH
    if (ph < 0.0f) ph = 0.0f;
    if (ph > 14.0f) ph = 14.0f;
    return ph;
}

// =============================================================================
// Conversión de voltaje a EC con compensación de temperatura
// EC_compensada = EC_medida / (1 + coefTemp * (temp - tempRef))
// =============================================================================
float SensorManager::_convertirVoltajeAEC(float voltaje, float temperatura) {
    float ecCruda = _coefEC.pendiente * voltaje + _coefEC.intercepto;
    
    // Compensación de temperatura
    float factorTemp = 1.0f + EC_COEF_TEMPERATURA * (temperatura - TEMP_REFERENCIA_EC);
    float ecCompensada = (factorTemp > 0.01f) ? ecCruda / factorTemp : ecCruda;
    
    // Limitar a rango válido
    if (ecCompensada < 0.0f) ecCompensada = 0.0f;
    
    return ecCompensada;
}

// =============================================================================
// Lectura de temperatura DS18B20
// =============================================================================
float SensorManager::_leerTemperatura() {
    float temp = _ds18b20.getTempCByIndex(0);
    return temp;
}

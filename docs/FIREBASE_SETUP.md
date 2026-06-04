# 🚀 Guía de Integración con Firebase

El sistema **HydroControl Pro** actualmente está configurado para usar `SQLite` por simplicidad y funcionamiento local. Sin embargo, si deseas escalar el sistema a la nube y usar **Firebase** (Firestore / Realtime Database), sigue estas instrucciones para configurar las colecciones (equivalente a "tablas") de forma automática.

## 1. Crear el Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **Añadir proyecto** y llámalo `HydroControl-Pro`.
3. Desactiva Google Analytics (opcional) y haz clic en **Crear proyecto**.
4. En el panel izquierdo, ve a **Compilación > Base de datos de Firestore** y haz clic en **Crear base de datos**.
5. Selecciona "Comenzar en modo de producción" o "modo de prueba".
6. Ve a la tuerca de Configuración (arriba a la izquierda) > **Configuración del proyecto** > **Cuentas de servicio**.
7. Haz clic en **Generar nueva clave privada**. Esto descargará un archivo JSON (ej. `firebase-adminsdk.json`).

## 2. Configurar el Backend (Node.js)
Coloca el archivo descargado en la carpeta `backend/config/firebase-adminsdk.json`.

Luego, instala el SDK de Firebase en tu terminal:
```bash
cd backend
npm install firebase-admin
```

## 3. Script para "Auto-Crear" las Colecciones
Firebase Firestore es una base de datos NoSQL. No necesitas "crear tablas" explícitamente con comandos SQL como `CREATE TABLE`. Las colecciones se crean automáticamente en cuanto insertas el primer documento. 

Sin embargo, para inicializar la estructura, puedes ejecutar el siguiente script (`backend/services/firebase_init.js`):

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-adminsdk.json');

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initFirebaseCollections() {
  console.log("Inicializando colecciones en Firebase...");

  const defaultZone = {
    name: "Zona 1",
    description: "Invernadero Principal",
    area_m2: 20,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    // 1. Colección de Zonas (Equivalente a tabla 'zones')
    const zoneRef = await db.collection('zones').add(defaultZone);
    console.log(`Colección 'zones' creada. Documento: ${zoneRef.id}`);

    // 2. Colección de Sensores (Equivalente a tabla 'sensor_data')
    await db.collection('sensor_data').add({
      zone_id: zoneRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ph: 6.0,
      ec: 1.5,
      temperature: 24.5,
      ldr: 85.0
    });
    console.log("Colección 'sensor_data' inicializada.");

    // 3. Colección de Eventos de Bombas (Equivalente a tabla 'pump_events')
    await db.collection('pump_events').add({
      zone_id: zoneRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      pump_name: "Principal",
      action: "ON",
      duration: 0
    });
    console.log("Colección 'pump_events' inicializada.");

    console.log("¡Todas las colecciones creadas exitosamente!");
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

initFirebaseCollections();
```

### Ejecutar el script:
```bash
node backend/services/firebase_init.js
```

## 4. Reemplazar SQLite por Firebase (Opcional)
Si deseas que el backend principal deje de usar SQLite y use Firebase, deberás modificar el archivo `backend/services/database.js` para usar las funciones de `admin.firestore()` en lugar de sentencias SQL `INSERT` o `SELECT`.

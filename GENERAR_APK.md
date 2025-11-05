# 📱 Guía para Generar APK de Hotel Manager App

## ✅ Pre-requisitos

1. **Cuenta de Expo** (gratis)
   - Ve a: https://expo.dev/signup
   - Crea una cuenta si no la tienes

2. **EAS CLI instalado globalmente**
   ```bash
   npm install -g eas-cli
   ```

3. **Iniciar sesión en Expo**
   ```bash
   eas login
   ```

---

## 🚀 Pasos para Generar la APK

### 1️⃣ Navega al directorio frontend
```bash
cd C:\Users\patri\hotel-manager-app\frontend
```

### 2️⃣ Instala las dependencias (si aún no lo hiciste)
```bash
npm install
```

### 3️⃣ Instala expo-build-properties (necesario para la configuración)
```bash
npx expo install expo-build-properties
```

### 4️⃣ Configura EAS (primera vez solamente)
```bash
eas build:configure
```
- Selecciona "All" cuando pregunte para qué plataformas
- Esto ya está configurado en tu proyecto

### 5️⃣ Genera la APK para Preview/Testing
```bash
eas build --platform android --profile preview
```

**O para producción:**
```bash
eas build --platform android --profile production
```

### 6️⃣ Espera el Build
- EAS compilará tu app en la nube (toma 5-15 minutos)
- Verás el progreso en la terminal y en: https://expo.dev/accounts/[tu-usuario]/projects/hotel-manager-app/builds

### 7️⃣ Descarga la APK
- Una vez completado, recibirás un enlace en la terminal
- También puedes descargarlo desde: https://expo.dev
- La APK estará disponible para descargar por 30 días

---

## 📝 Notas Importantes

### **Configuración del Backend**

⚠️ **IMPORTANTE**: Por defecto, la app apunta a `http://localhost:5000`. Para que funcione en dispositivos móviles reales, debes:

1. **Cambiar la URL del API** en `frontend/services/api.js`:
   ```javascript
   // Opción 1: Usar tu IP local (para testing en red local)
   baseURL: 'http://TU_IP_LOCAL:5000/api'
   
   // Opción 2: Usar un servidor en producción
   baseURL: 'https://tu-servidor.com/api'
   ```

2. **Encontrar tu IP local** (Windows):
   ```bash
   ipconfig
   ```
   Busca "IPv4 Address" (ejemplo: 192.168.1.10)

3. **Asegúrate de que el backend acepte conexiones externas**:
   En `backend/server.js`, verifica que esté escuchando en `0.0.0.0`:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

### **Testing en Red Local**

Si quieres probar antes de generar la APK:
```bash
npm start
```
Luego escanea el QR con la app Expo Go desde tu celular.

---

## 🔧 Perfiles de Build Disponibles

### **preview** (Recomendado para testing)
- Genera APK directamente instalable
- No requiere Google Play Store
- Ideal para distribuir a testers
```bash
eas build --platform android --profile preview
```

### **production**
- Para publicar en Google Play Store
- Genera AAB (Android App Bundle) por defecto
- Puedes forzar APK con la configuración actual
```bash
eas build --platform android --profile production
```

### **development**
- Para desarrollo con hot reload
- Requiere Expo Dev Client
```bash
eas build --platform android --profile development
```

---

## 📦 Instalación de la APK

1. **Descarga la APK** desde el enlace que te proporciona EAS
2. **Transfiere a tu Android** (por email, cable USB, etc.)
3. **Instala la APK**:
   - Abre el archivo APK en tu dispositivo
   - Android te pedirá permiso para instalar apps de fuentes desconocidas
   - Acepta y completa la instalación

---

## ❓ Solución de Problemas

### Error: "eas command not found"
```bash
npm install -g eas-cli
```

### Error: "No Expo account found"
```bash
eas login
```

### Build falla
1. Revisa los logs en https://expo.dev
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que `app.json` y `eas.json` estén correctamente configurados

### APK se instala pero crashea
1. Verifica la URL del backend en `services/api.js`
2. Asegúrate de que el backend esté corriendo y accesible
3. Revisa los logs con `adb logcat` si tienes Android Debug Bridge

---

## 🎉 ¡Listo!

Una vez descargada e instalada la APK, tendrás tu Hotel Manager App funcionando en Android.

**Recuerda**: Para que funcione correctamente, el backend debe estar corriendo y ser accesible desde el dispositivo móvil.

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

## 🎯 ¿Por qué funciona esta APK?

### ✅ **Sin problemas de CORS**
- Las APKs NO sufren CORS como los navegadores
- Las llamadas a la API en Vercel funcionan sin bloqueos
- Usa axios con token de Supabase autenticado

### ✅ **OAuth Google configurado**
- Deep linking con esquema `hotelmanager://`
- Intent filter para manejar `hotelmanager://auth/callback`
- Redirección automática después del login

### ✅ **Backend en producción**
- Backend desplegado en Vercel funcionando
- Variables de entorno configuradas en EAS
- URLs absolutas (no IPs locales)

### ✅ **Problemas ya resueltos**
- ✅ Fechas con zona horaria de Argentina
- ✅ Asistencias: 4ta salida permitida
- ✅ Tareas/Notas/Usuarios migrados a Supabase
- ✅ Dashboard con fallback para stats

---

## 🔧 Configuración Actual (Ya lista)

### **Variables de entorno en `eas.json` (producción):**

```json
{
  "EXPO_PUBLIC_API_BASE_URL": "https://hotel-manager-backend-ruddy.vercel.app/api",
  "EXPO_PUBLIC_SUPABASE_URL": "https://mkflmlbqfdcvdnknmkmt.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGc..."
}
```

✅ **Todo configurado** - No necesitas cambiar nada

### **Deep Linking en `app.json`:**

```json
{
  "scheme": "hotelmanager",
  "android": {
    "intentFilters": [{
      "action": "VIEW",
      "data": [{ 
        "scheme": "hotelmanager", 
        "host": "auth", 
        "pathPrefix": "/callback" 
      }]
    }]
  }
}
```

✅ **Ya configurado** - Redirect de Google OAuth funciona

---

## 🚀 Pasos para Generar la APK

### 1️⃣ Navega al directorio frontend
```powershell
cd C:\Users\karin\hotel-manager-app\frontend
```

### 2️⃣ Verifica que las dependencias estén instaladas
```powershell
npm install
```

### 3️⃣ Genera la APK de producción
```powershell
eas build -p android --profile production
```

### 4️⃣ Espera el Build
- ⏱️ **Tiempo**: 10-20 minutos
- 📊 **Progreso**: Verás el log en la terminal
- 🌐 **Dashboard**: https://expo.dev/accounts/[tu-usuario]/projects/frontend/builds

### 5️⃣ Descarga la APK
- Una vez completado, recibirás un **enlace de descarga**
- También disponible en: https://expo.dev
- ⏰ **Válido por**: 30 días

---

## � Checklist CRÍTICO antes del Build

### 🌐 **1. Verifica que Supabase tenga el Redirect URL**

Ve a: https://supabase.com/dashboard → Tu proyecto → Authentication → URL Configuration

**Agrega estas URLs:**
- ✅ `hotelmanager://auth/callback` (para Android APK)
- ✅ `https://hotel-manager-frontend.vercel.app/auth/callback` (para Web)

### 🧪 **2. Prueba TODO en Web primero**

Accede a: https://hotel-manager-frontend.vercel.app

**Testing completo:**
- [ ] Login con Google OAuth
- [ ] Login con email/password
- [ ] Dashboard carga estadísticas
- [ ] Crear/editar/eliminar tareas
- [ ] Crear/editar/eliminar notas
- [ ] Check-in/check-out asistencia
- [ ] Gestión de usuarios (admin)
- [ ] Modal de estadísticas sin glitch de animación

### 🔌 **3. Verifica que el backend responda**

```powershell
curl https://hotel-manager-backend-ruddy.vercel.app/api
```

Debe devolver alguna respuesta (aunque sea 404, significa que está vivo)

---

## 🎬 Comando de Build

Una vez verificado todo:

```powershell
cd frontend
eas build -p android --profile production
```

### **Qué hará EAS:**
1. ✅ Sube tu código a la nube de Expo
2. ✅ Instala dependencias
3. ✅ Inyecta variables de entorno del perfil `production`
4. ✅ Genera keystore automáticamente (primera vez)
5. ✅ Compila APK con Gradle
6. ✅ Te da enlace de descarga

---

## 📱 Instalación de la APK

### **En tu dispositivo Android:**

1. **Descarga** el APK desde el enlace de EAS
2. **Habilita** instalación de fuentes desconocidas:
   - Configuración → Seguridad → Fuentes desconocidas
3. **Abre** el archivo APK descargado
4. **Instala** siguiendo los pasos

---

## ✅ Qué probar en el dispositivo real

### **1. Login con Google OAuth**
- Debe abrir navegador
- Login con cuenta Google
- **Volver automáticamente a la app** (por `hotelmanager://auth/callback`)

### **2. Dashboard**
- Debe cargar "Tareas Pendientes"
- Estadísticas de eficacia
- Auto-refresh al volver al tab

### **3. Asistencias**
- Check-in funciona
- Check-out hasta la **4ta salida** permitida
- Fechas correctas (zona horaria Argentina)

### **4. Tareas y Notas**
- Crear, editar, eliminar
- Ver creador y asignado (según rol)
- Filtros funcionan

### **5. Usuarios (Admin)**
- Listar usuarios
- Crear con contraseña temporal
- Ver estadísticas (modal animado)
- Activar/desactivar

---

## ❓ Preguntas Frecuentes

### **¿CORS en APK?**
**No aplica.** CORS es un mecanismo del navegador web. Las APKs nativas no sufren CORS.

### **¿Funciona el login con Google?**
**Sí**, siempre que:
- ✅ Hayas agregado `hotelmanager://auth/callback` en Supabase
- ✅ El intent filter esté configurado (ya lo está)

### **¿Qué pasa si cambio de backend?**
Solo actualiza `EXPO_PUBLIC_API_BASE_URL` en `eas.json` y vuelve a buildear.

### **¿Necesito Android Studio?**
**No**. EAS Build construye en la nube. No necesitas SDK local.

### **¿Cuánto pesa la APK?**
Aproximadamente **40-60 MB**.

### **¿Requisitos de Android?**
API 21+ (Android 5.0 Lollipop o superior)

---

## 🐛 Solución de Problemas

### **Build falla con error de dependencias**
```powershell
cd frontend
rm -rf node_modules package-lock.json
npm install
eas build -p android --profile production
```

### **Login con Google no vuelve a la app**
1. Verifica que `hotelmanager://auth/callback` esté en Supabase
2. Confirma que `app.json` tenga el `intentFilters`
3. Reinstala la APK (desinstala la anterior primero)

### **App crashea al abrir**
1. Revisa logs con ADB:
   ```bash
   adb logcat | grep -i expo
   ```
2. Verifica que el backend esté accesible
3. Confirma que las variables de Supabase sean correctas

### **"Invalid Supabase credentials"**
- Verifica que `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` estén en `eas.json`
- Reconstruye la APK

---

## 🎯 Comandos Rápidos

### **Build de producción (recomendado)**
```powershell
eas build -p android --profile production
```

### **Ver builds anteriores**
```powershell
eas build:list
```

### **Cancelar build en progreso**
```powershell
eas build:cancel
```

### **Ver configuración actual**
```powershell
eas build:configure
```

---

## 📊 Perfiles de Build Disponibles

### **production** (⭐ Recomendado)
- Para distribución final
- Apunta a backend en Vercel
- Auto-incrementa version code
- Genera APK instalable

### **preview**
- Para testing en red local
- Apunta a IP local (no funciona fuera de tu WiFi)

### **development**
- Para desarrollo con hot reload
- Requiere Expo Dev Client

---

## 🎉 ¡Listo para Buildear!

Ejecuta:

```powershell
cd C:\Users\karin\hotel-manager-app\frontend
eas build -p android --profile production
```

⏱️ En **10-20 minutos** tendrás tu APK lista para instalar.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en https://expo.dev
2. Verifica el `PRE_BUILD_CHECKLIST.md`
3. Consulta la documentación de EAS: https://docs.expo.dev/build/introduction/

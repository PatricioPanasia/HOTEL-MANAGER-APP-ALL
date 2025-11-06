# 📋 Checklist PRE-BUILD - Hotel Manager App

## ✅ Lista de Verificación Antes de Generar APK

---

## 🔐 1. Variables de Entorno

### **✅ YA CONFIGURADO en `eas.json`:**

El perfil `production` ya tiene todas las variables necesarias:

```json
{
  "EXPO_PUBLIC_API_BASE_URL": "https://hotel-manager-backend-ruddy.vercel.app/api",
  "EXPO_PUBLIC_SUPABASE_URL": "https://mkflmlbqfdcvdnknmkmt.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGc..."
}
```

✅ **No necesitas crear archivo `.env`** - Las variables se inyectan en el build

⚠️ **NOTA**: El archivo `.env` local solo se usa para desarrollo web, NO para APK builds.

---

## 📱 2. Configuración de la App

### **Verificar `app.json`:**

✅ **Version Code**: Actualmente es `1` - Si ya generaste una APK antes, incrementa `versionCode` y `version`

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1  // ← Incrementar en cada build
    }
  }
}
```

✅ **Bundle Identifier**: `com.patoleonel.hotelmanager` ✓
✅ **Package Name**: `com.patoleonel.hotelmanager` ✓
✅ **Permissions**: `["INTERNET"]` ✓
✅ **Icons**: Verificar que existan en `assets/`:
- `icon.png` ✓
- `adaptive-icon.png` ✓
- `splash-icon.png` ✓
- `favicon.png` ✓

---

## 🔧 3. Configuración de Build (EAS)

### **✅ `eas.json` YA CONFIGURADO:**

```json
"production": {
  "autoIncrement": true,
  "android": {
    "buildType": "apk"
  },
  "env": {
    "EXPO_PUBLIC_API_BASE_URL": "https://hotel-manager-backend-ruddy.vercel.app/api",
    "EXPO_PUBLIC_SUPABASE_URL": "https://mkflmlbqfdcvdnknmkmt.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGc..."
  }
}
```

✅ **Auto-increment**: Incrementa `versionCode` automáticamente en cada build
✅ **Build type APK**: Genera APK directamente instalable (no AAB)
✅ **Variables inyectadas**: Todas las env vars necesarias están configuradas

**No necesitas cambiar nada** - Listo para buildear.

---

## 🌐 4. Backend en Producción

### **Verificar que el backend esté funcionando:**

Prueba estas URLs en el navegador o con curl:

```bash
# Health check del backend
curl https://hotel-manager-backend-ruddy.vercel.app/api

# Endpoint de prueba (debería devolver 401 sin token)
curl https://hotel-manager-backend-ruddy.vercel.app/api/users
```

✅ **Verificar endpoints críticos**:
- `/api/auth/login` - Login con email/password
- `/api/tasks` - Tareas
- `/api/notes` - Notas
- `/api/attendance` - Asistencias
- `/api/users` - Usuarios

---

## 🔐 5. Supabase Configuration

### **✅ Verificar en Supabase Dashboard:**

Ve a: https://supabase.com/dashboard/project/mkflmlbqfdcvdnknmkmt

1. **Authentication → URL Configuration**:
   - ✅ **CRÍTICO**: Agregar `hotelmanager://auth/callback` a "Redirect URLs"
   - ✅ También debe estar: `https://hotel-manager-frontend.vercel.app/auth/callback`

2. **Authentication → Providers**:
   - ✅ Email/Password enabled
   - ✅ Google OAuth configured con Client ID/Secret

3. **Database**:
   - ✅ Tablas: `profiles`, `tareas`, `notas`, `asistencias`
   - ✅ RLS Policies configuradas
   - ✅ Foreign keys y relaciones correctas

4. **API Settings**:
   - ✅ `SUPABASE_URL`: `https://mkflmlbqfdcvdnknmkmt.supabase.co`
   - ✅ `SUPABASE_ANON_KEY`: Ya configurada en eas.json (pública - OK)
   - ⚠️ `SUPABASE_SERVICE_KEY`: Solo en backend (privada - NO exponer)

### **⚠️ CRÍTICO - Agregar Redirect URL para Android:**

**Sin esto, el login con Google NO funcionará en la APK:**

```
hotelmanager://auth/callback
```

Esto permite que después del login con Google, el navegador vuelva a la app.

---

## 📦 6. Dependencias

### **Verificar que todas las dependencias estén instaladas:**

```bash
cd frontend
npm install
```

### **Dependencias críticas para Android:**

```json
{
  "expo": "^51.0.0",
  "react-native": "0.74.5",
  "react-native-reanimated": "~3.10.1",
  "@supabase/supabase-js": "^2.79.0",
  "expo-build-properties": "~0.12.5"
}
```

---

## 🧪 7. Testing Pre-Build

### **Probar funcionalidades críticas en Vercel (Web):**

Accede a: https://hotel-manager-frontend.vercel.app

✅ **Login**:
- [ ] Login con Google OAuth
- [ ] Login con email/password
- [ ] Registro de nuevos usuarios (solo admin)

✅ **Dashboard**:
- [ ] Estadísticas se cargan correctamente
- [ ] Eficacia se calcula bien (admin = promedio, usuarios = individual)
- [ ] Auto-refresh al volver al tab

✅ **Tareas**:
- [ ] Crear tarea
- [ ] Editar tarea
- [ ] Eliminar tarea
- [ ] Ver creador y asignado (según rol)
- [ ] Filtros funcionan

✅ **Notas**:
- [ ] Crear nota
- [ ] Editar nota
- [ ] Eliminar nota
- [ ] Ver creador y asignado (según rol)
- [ ] Filtros funcionan

✅ **Asistencias**:
- [ ] Check-in
- [ ] Check-out
- [ ] Historial

✅ **Usuarios** (solo admin):
- [ ] Crear usuario con contraseña temporal
- [ ] Ver estadísticas de usuario (modal animado correctamente)
- [ ] Editar usuario
- [ ] Desactivar/activar usuario

---

## 🎨 8. UI/UX Final

### **Verificar animaciones:**

✅ **Modales**:
- [ ] Crear Nota - animación suave (FadeIn/FadeOut)
- [ ] Crear Tarea - animación suave
- [ ] Estadísticas Usuario - animación suave SIN glitch al cerrar

✅ **Responsive Design**:
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

✅ **Estilos consistentes**:
- [ ] Colores del theme global
- [ ] Espaciado consistente
- [ ] Cards con sombras uniformes

---

## 🔒 9. Seguridad

### **Verificar configuraciones de seguridad:**

✅ **Backend**:
- [ ] JWT tokens con expiración
- [ ] Middleware de autenticación en todas las rutas protegidas
- [ ] Validación de roles (admin, supervisor, recepcionista)
- [ ] CORS configurado correctamente

✅ **Frontend**:
- [ ] No hay API keys hardcodeadas
- [ ] Tokens se almacenan de forma segura (Supabase Auth)
- [ ] Redirect después de logout

✅ **Supabase**:
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas de seguridad configuradas
- [ ] Service key solo en backend (no expuesta)

---

## 📝 10. Documentación

### **Archivos de documentación actualizados:**

- [ ] `README.md` - Instrucciones generales
- [ ] `GENERAR_APK.md` - Guía para generar APK
- [ ] `PRE_BUILD_CHECKLIST.md` - Este archivo
- [ ] `SAFE_DEPLOYMENT.md` - Workflow de deployment

---

## 🚀 11. Comando Final para Build

### ✅ **Una vez verificado TODO lo anterior:**

```powershell
cd C:\Users\karin\hotel-manager-app\frontend
eas build -p android --profile production
```

### **Qué hará el comando:**

1. ✅ Sube código a la nube de Expo
2. ✅ Instala todas las dependencias
3. ✅ Inyecta variables de entorno del perfil `production`
4. ✅ Genera keystore automáticamente (primera vez)
5. ✅ Compila APK con Gradle
6. ✅ Te da enlace de descarga

⏱️ **Tiempo estimado**: 10-20 minutos

### **Alternativa - Build local (más rápido):**

Si tienes Android SDK instalado:

```powershell
eas build -p android --profile production --local
```

---

## ⚠️ ACCIONES INMEDIATAS REQUERIDAS

Antes de generar la APK, debes:

### ✅ 1. **Agregar Redirect URL en Supabase** (CRÍTICO)

Ve a: https://supabase.com/dashboard/project/mkflmlbqfdcvdnknmkmt/auth/url-configuration

Agrega:
```
hotelmanager://auth/callback
```

**Sin esto, el login con Google NO funcionará en la APK.**

### ✅ 2. **Verificar que el backend responda**
```powershell
curl https://hotel-manager-backend-ruddy.vercel.app/api
```

Debe devolver alguna respuesta (aunque sea 404 = está vivo).

### ✅ 3. **Testing completo en Web (Vercel)**

Probar todas las funcionalidades críticas en:
https://hotel-manager-frontend.vercel.app

**Checklist de testing:**
- [ ] Login con Google OAuth
- [ ] Login con email/password  
- [ ] Dashboard carga estadísticas
- [ ] Crear/editar/eliminar tareas
- [ ] Crear/editar/eliminar notas
- [ ] Check-in/check-out asistencia (hasta 4ta salida)
- [ ] Gestión de usuarios (crear con contraseña)
- [ ] Modal de estadísticas de usuario (sin glitch de animación)
- [ ] Fechas correctas (zona horaria Argentina)

### ✅ 4. **Instalar EAS CLI y login**

```powershell
npm install -g eas-cli
eas login
```

---

## 📌 Notas Finales

- **Tiempo de build**: 10-20 minutos en EAS cloud
- **Tamaño aproximado**: 40-60 MB
- **Requisitos Android**: API 21+ (Android 5.0+)
- **Validez del enlace**: 30 días en EAS

---

**¿Todo listo?** ✅ Entonces ejecuta:

```bash
cd frontend
eas build --platform android --profile production
```

🎉 **¡Buena suerte con el build!**

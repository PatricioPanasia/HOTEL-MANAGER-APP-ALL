# 📋 Checklist PRE-BUILD - Hotel Manager App

## ✅ Lista de Verificación Antes de Generar APK

---

## 🔐 1. Variables de Entorno

### **Crear archivo `.env` en frontend/**

Actualmente NO existe un archivo `.env` en el proyecto. Debes crearlo basándote en `.env.example`:

```bash
cd frontend
cp .env.example .env
```

### **Configurar las variables en `.env`:**

```bash
# URL del backend en producción (Vercel)
EXPO_PUBLIC_API_BASE_URL=https://hotel-manager-backend-ruddy.vercel.app/api

# Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://mkflmlbqfdcvdnknmkmt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmxtbGJxZmRjdmRua25ta210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NTc2ODEsImV4cCI6MjA0NjMzMzY4MX0.0Lx6LxhsWrIg0vb_aTshOBDqWR2Y1Dkv-90Y8xJp3wI
```

⚠️ **IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO debe subirse a GitHub.

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

### **Verificar `eas.json`:**

✅ **Profile de producción** debe apuntar a tu backend en Vercel:

```json
"production": {
  "autoIncrement": true,
  "android": {
    "buildType": "apk"
  },
  "env": {
    "EXPO_PUBLIC_API_BASE_URL": "https://hotel-manager-backend-ruddy.vercel.app/api"
  }
}
```

⚠️ **IMPORTANTE**: Falta el `/api` al final de la URL. Debe ser:
- ❌ `https://hotel-manager-backend-ruddy.vercel.app`
- ✅ `https://hotel-manager-backend-ruddy.vercel.app/api`

**ACCIÓN REQUERIDA**: Corregir esta URL en `eas.json`

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

### **Verificar en Supabase Dashboard:**

1. **Authentication Settings**:
   - ✅ Email/Password enabled
   - ✅ Google OAuth configured
   - ✅ Redirect URLs incluye: `hotelmanager://auth/callback`

2. **Database**:
   - ✅ Tablas: `profiles`, `tareas`, `notas`, `asistencias`
   - ✅ RLS Policies configuradas
   - ✅ Foreign keys y relaciones correctas

3. **API Keys**:
   - ✅ `SUPABASE_URL` correcta
   - ✅ `SUPABASE_ANON_KEY` correcta (pública)
   - ⚠️ `SUPABASE_SERVICE_KEY` solo en backend (privada)

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

Una vez verificado TODO lo anterior:

### **Opción 1: Preview Build (Recomendada para testing)**
```bash
cd frontend
eas build --platform android --profile production
```

### **Opción 2: Local Build (más rápido, requiere Android SDK)**
```bash
cd frontend
eas build --platform android --profile production --local
```

---

## ⚠️ ACCIONES INMEDIATAS REQUERIDAS

Antes de generar la APK, debes:

### 1. **Crear archivo `.env` en `frontend/`**
```bash
cd frontend
cp .env.example .env
# Editar .env con las credenciales correctas
```

### 2. **Corregir URL en `eas.json`**
Cambiar en el profile `production`:
```json
"EXPO_PUBLIC_API_BASE_URL": "https://hotel-manager-backend-ruddy.vercel.app/api"
```
(Agregar `/api` al final)

### 3. **Verificar que el backend responda**
```bash
curl https://hotel-manager-backend-ruddy.vercel.app/api
```

### 4. **Testing completo en Web (Vercel)**
Probar todas las funcionalidades críticas en:
https://hotel-manager-frontend.vercel.app

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

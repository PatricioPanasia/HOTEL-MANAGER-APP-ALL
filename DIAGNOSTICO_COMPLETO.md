# 🔍 DIAGNÓSTICO COMPLETO - Error "Invalid API key"

## ❌ Problema Encontrado:

El archivo `backend/.env` **estaba incompleto**. No contenía las credenciales de Supabase necesarias para validar la autenticación.

### Archivos revisados:
✅ `frontend/.env` - CORRECTO (tiene SUPABASE_URL y ANON_KEY)
✅ `frontend/app.config.js` - CORRECTO (configura variables para Expo)
✅ `frontend/utils/supabase.js` - CORRECTO (usa las variables correctamente)
✅ `frontend/eas.json` - CORRECTO (para builds de producción)
❌ `backend/.env` - **INCOMPLETO** (faltaban variables de Supabase)

## 📋 Estado de las credenciales:

### Frontend (✅ TODO CORRECTO):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Backend (⚠️ REQUIERE ACTUALIZACIÓN):
```env
# ✅ Ya agregué:
SUPABASE_URL=https://your-project.supabase.co
JWT_ISSUER=https://your-project.supabase.co/auth/v1
JWT_AUDIENCE=authenticated

# ⚠️ NECESITAS COMPLETAR CON VALORES REALES:
SUPABASE_SERVICE_ROLE_KEY=<PLACEHOLDER - REEMPLAZAR>
SUPABASE_JWT_SECRET=<PLACEHOLDER - REEMPLAZAR>
```

## 🎯 Solución:

### Paso 1: Obtener credenciales de Supabase
Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

Necesitas copiar:
1. **JWT Secret** (en la sección "JWT Settings")
2. **service_role key** (en la sección "Project API keys" - NO es el anon key)

### Paso 2: Actualizar backend/.env
Abre `backend/.env` y reemplaza:
- `SUPABASE_SERVICE_ROLE_KEY` con el valor real
- `SUPABASE_JWT_SECRET` con el valor real

### Paso 3: Reiniciar backend
```bash
cd backend
npm start
```

### Paso 4: Probar autenticación
- Login con email
- Login con Google OAuth

## 🔐 Diferencias importantes:

| Credencial | Ubicación | Uso |
|------------|-----------|-----|
| **ANON_KEY** | Frontend | Autenticación desde la app (público) |
| **SERVICE_ROLE_KEY** | Backend | Operaciones admin (PRIVADO) |
| **JWT_SECRET** | Backend | Validar tokens de usuarios |

## ⚠️ Seguridad:
- ❌ **NUNCA** pongas el SERVICE_ROLE_KEY en el frontend
- ❌ **NUNCA** lo subas a GitHub
- ✅ Solo úsalo en el backend
- ✅ Mantenlo en `.env` (que debe estar en `.gitignore`)

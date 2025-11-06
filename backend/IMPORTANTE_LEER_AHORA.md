# ⚠️ ACCIÓN REQUERIDA: Configurar JWT_SECRET

## El problema que encontramos:
Tu archivo `.env` del backend **NO tenía las credenciales de Supabase**, por eso el error "Invalid API key" aparecía.

## ✅ Lo que ya hice:
- Añadí `SUPABASE_URL`
- Añadí `SUPABASE_SERVICE_ROLE_KEY` (placeholder - necesita actualización)
- Añadí estructura correcta al `.env`

## 🔴 URGENTE - Debes hacer AHORA:

### 1. Obtener el JWT_SECRET real de Supabase:
1. Ve a: https://supabase.com/dashboard/project/mkflmlbqfdcvdnknmkmt/settings/api
2. En la sección "JWT Settings", busca **"JWT Secret"**
3. Copia ese valor

### 2. Obtener el SERVICE_ROLE_KEY real:
1. En la misma página (API Settings)
2. Busca **"service_role key"** (es diferente al "anon key")
3. Copia ese valor

### 3. Actualiza el archivo `.env` del backend:
Reemplaza estas líneas en `backend/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (TU SERVICE_ROLE KEY REAL AQUÍ)
SUPABASE_JWT_SECRET=tu-jwt-secret-from-supabase-settings (TU JWT SECRET REAL AQUÍ)
```

### 4. Reinicia el backend:
```bash
cd backend
npm start
```

## ⚠️ IMPORTANTE:
- El **SERVICE_ROLE_KEY** es MUY SENSIBLE - nunca lo compartas
- Es diferente al **ANON_KEY** (que usas en el frontend)
- Sin estos valores correctos, la autenticación NO funcionará

## Después de actualizar:
1. Reinicia el backend
2. Prueba el login nuevamente en tu app móvil
3. El error "Invalid API key" debería desaparecer

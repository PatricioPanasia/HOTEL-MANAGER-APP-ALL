# 🚀 Configurar Variables de Entorno en Vercel

## ⚠️ IMPORTANTE:
El backend está en Vercel, por lo que debes configurar las variables de entorno allí, no solo en `.env` local.

## 📋 Pasos para configurar Vercel:

### 1. Ve al dashboard de Vercel:
https://vercel.com/dashboard

### 2. Selecciona tu proyecto backend:
- Busca el proyecto: `hotel-manager-backend`

### 3. Ve a Settings → Environment Variables:
- Click en "Settings" en el menú superior
- Luego click en "Environment Variables" en el menú lateral

### 4. Agrega estas variables (una por una):

| Variable Name | Value |
|---------------|-------|
| `SUPABASE_URL` | `https://mkflmlbqfdcvdnknmkmt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmxtbGJxZmRjdmRua25ta210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0MTAyNiwiZXhwIjoyMDc3OTE3MDI2fQ._ps7kwsqdEF1DstJhJEuM-O1FI0Ya2zIi0sT-jl3yFk` |
| `SUPABASE_JWT_SECRET` | `aZH/GRm/cs1Vq4aW09BZF2YtwjPAOkFIXkGtBw88nZkOGm9hwvm89Ic+0XA+kr9AwpbuQQ770Lq0gyqjwEEzoA==` |
| `JWT_ISSUER` | `https://mkflmlbqfdcvdnknmkmt.supabase.co/auth/v1` |
| `JWT_AUDIENCE` | `authenticated` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

### 5. Selecciona el entorno:
- Marca las casillas: **Production**, **Preview**, y **Development**
- Esto asegura que las variables estén disponibles en todos los entornos

### 6. Click en "Save"

### 7. Redeploy (opcional pero recomendado):
- Ve a la pestaña "Deployments"
- Click en el deployment más reciente
- Click en los tres puntos (⋯) → "Redeploy"
- Esto asegura que las nuevas variables se apliquen inmediatamente

## ✅ Verificación:
Después de configurar las variables:
1. Espera 1-2 minutos para que Vercel actualice
2. Prueba el login en tu app móvil
3. El error "Invalid API key" debería desaparecer

## 🔐 Seguridad:
- Estas variables son PRIVADAS
- Vercel las encripta automáticamente
- No las compartas públicamente
- El archivo `.env` local ya está en `.gitignore`

## 📝 Nota:
El archivo `.env` que actualicé es solo para desarrollo local. Para producción, Vercel lee sus propias variables de entorno configuradas en su dashboard.

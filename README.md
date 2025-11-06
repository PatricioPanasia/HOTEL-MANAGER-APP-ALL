# Hotel Manager App

Full-stack hotel management application with React Native (Expo), Express backend, and Supabase.

## Architecture

- **Frontend**: Expo (React Native) for web, Android, and iOS
- **Backend**: Express.js API (serverless on Vercel)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth with Google OAuth

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Supabase account
- Vercel account
- Google Cloud Console OAuth credentials

### Supabase Setup

1. Create project at https://supabase.com
2. Run SQL schema from `supabase/01_schema.sql` in SQL Editor
3. Configure Auth > Providers > Google:
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Secret
   - Redirect URLs:
     - `https://YOUR-FRONTEND.vercel.app/auth/callback`
     - `http://localhost:19006/auth/callback` (dev web)
     - `https://auth.expo.io/@YOUR_USERNAME/frontend` (Expo dev)
     - `hotelmanager://auth/callback` (native app)

### Backend Deployment (Vercel)

```bash
cd backend
npm install

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# JWT_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1
# JWT_AUDIENCE=authenticated
```

### Frontend Deployment (Vercel)

```bash
cd frontend
npm install

# Build for web
npx expo export:web

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# EXPO_PUBLIC_API_BASE_URL=https://YOUR-BACKEND.vercel.app/api
# EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Mobile Build (EAS)

```bash
cd frontend

# Configure EAS
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

Update `eas.json` with production environment variables before building.

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your backend URL and Supabase credentials
npm install
npx expo start
```

Press `w` for web, `a` for Android emulator, `i` for iOS simulator.

## Environment Variables

### Backend (.env)

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1
JWT_AUDIENCE=authenticated
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Features

- Google OAuth authentication
- User management (admin, supervisor, recepcionista roles)
- Task management with assignment
- Notes (personal, team, general)
- Attendance tracking (check-in/check-out)
- Reports
- Row Level Security (RLS) policies

## Troubleshooting

### "Network error" on login

- Verify backend is running and accessible
- Check EXPO_PUBLIC_API_BASE_URL points to correct backend
- For emulator: use `10.0.2.2:5000` instead of `localhost`
- For LAN devices: use your machine's IP (e.g., `192.168.1.x`)

### "Invalid token" errors

- Verify JWT_ISSUER and JWT_AUDIENCE match Supabase project
- Check SUPABASE_URL and keys are correct
- Ensure Supabase Auth is enabled

### Deep link not working on Android

- Verify `scheme` and `intentFilters` in `app.json`
- Rebuild app with `eas build` or `npx expo run:android`
- Check Google OAuth redirect URLs include `hotelmanager://auth/callback`

### RLS policy errors

- Ensure user has a profile in `profiles` table
- Check `rol` field is set correctly (admin/supervisor/recepcionista)
- Review policies in `supabase/01_schema.sql`

## License

MIT

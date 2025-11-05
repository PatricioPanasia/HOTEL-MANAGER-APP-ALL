@echo off
echo ========================================
echo   HOTEL MANAGER - GENERADOR DE APK
echo ========================================
echo.

echo [1/5] Verificando instalacion de EAS CLI...
call eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] EAS CLI no esta instalado.
    echo Instalando EAS CLI...
    call npm install -g eas-cli
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo instalar EAS CLI.
        pause
        exit /b 1
    )
)
echo [OK] EAS CLI instalado

echo.
echo [2/5] Verificando login en Expo...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo No has iniciado sesion en Expo.
    echo Por favor, inicia sesion:
    call eas login
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo iniciar sesion.
        pause
        exit /b 1
    )
)
echo [OK] Sesion activa en Expo

echo.
echo [3/5] Instalando dependencias...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

echo.
echo [4/5] Instalando expo-build-properties...
call npx expo install expo-build-properties
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo instalar expo-build-properties.
    pause
    exit /b 1
)
echo [OK] expo-build-properties instalado

echo.
echo ========================================
echo   IMPORTANTE: Configuracion del Backend
echo ========================================
echo.
echo Antes de continuar, asegurate de:
echo 1. Cambiar la URL del API en: frontend/services/api.js
echo    - Para testing local: usa tu IP local (192.168.x.x:5000)
echo    - Para produccion: usa tu servidor en linea
echo.
echo 2. El backend debe estar corriendo y accesible desde tu red
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para continuar con el build...
pause >nul

echo.
echo [5/5] Iniciando build de APK...
echo.
echo Selecciona el perfil de build:
echo 1) Preview (Recomendado - APK para testing)
echo 2) Production (APK para produccion)
echo 3) Development (APK con hot reload)
echo.
set /p profile="Ingresa tu eleccion (1-3): "

if "%profile%"=="1" (
    echo Generando APK Preview...
    call eas build --platform android --profile preview
) else if "%profile%"=="2" (
    echo Generando APK Production...
    call eas build --platform android --profile production
) else if "%profile%"=="3" (
    echo Generando APK Development...
    call eas build --platform android --profile development
) else (
    echo Opcion invalida. Usando Preview por defecto...
    call eas build --platform android --profile preview
)

echo.
echo ========================================
echo   BUILD COMPLETADO
echo ========================================
echo.
echo El build esta en proceso en los servidores de Expo.
echo Puedes ver el progreso en: https://expo.dev
echo.
echo Una vez completado, recibiras un enlace para descargar la APK.
echo.
pause

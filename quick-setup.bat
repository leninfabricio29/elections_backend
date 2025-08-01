@echo off
echo =========================================
echo    INSTALACION RAPIDA - ELECTION API
echo =========================================
echo.

echo [1/4] Instalando dependencias de npm...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] Iniciando el servidor en segundo plano...
start /B npm run dev
echo Esperando a que el servidor se inicie...
timeout /t 5 /nobreak > nul

echo.
echo [3/4] Inicializando datos de prueba...
call npm run init:data
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Error al inicializar datos de prueba
    echo El servidor sigue ejecutandose
)

echo.
echo [4/4] Sistema listo!
echo =========================================
echo   ELECTION API - CORRIENDO EN PUERTO 3000
echo =========================================
echo.
echo URLs importantes:
echo   Health Check: http://localhost:3000/api/health
echo   Dashboard:    http://localhost:3000/api/dashboard/stats
echo.
echo Credenciales de administrador:
echo   Email:    admin@elecciones.com
echo   Password: AdminPass123!
echo.
echo Documentacion disponible:
echo   - TESTING_FLOW.md
echo   - Election_API_Postman_Collection.json
echo.
echo Para detener el servidor: Ctrl+C
echo Para ver logs: npm run dev
echo.
pause

@echo off
setlocal
cd /d "%~dp0"
title NagWeb 05 - Biblioteca de recursos (prueba V1.0)
echo.
echo =========================================================
echo       NAGWEB 05 - PRUEBA DE LA BIBLIOTECA V1.0
echo =========================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instala Node.js 20 o posterior desde:
  echo https://nodejs.org/
  echo Despues volve a hacer doble clic en este archivo.
  goto error
)
for /f "delims=" %%V in ('node -p "Number(process.versions.node.split('.')[0])"') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR goto error
if %NODE_MAJOR% LSS 20 (
  echo Tenes Node.js %NODE_MAJOR%. Se necesita Node.js 20 o posterior.
  goto error
)
if not exist "index.html" (
  echo No encuentro index.html. Ejecuta esto desde la carpeta NagWeb completa.
  goto error
)
if not exist "tools\resource-etl\src\editor-acceptance-server.mjs" (
  echo Falta el servidor de prueba. Descarga la rama feat/resource-etl-v1 completa.
  goto error
)
echo Abriendo NagWeb en el navegador predeterminado...
echo No se instala nada, no se despliega Vercel y no se toca GitHub.
echo Para terminar, cerra esta ventana o presiona Ctrl+C.
echo.
node "tools\resource-etl\src\editor-acceptance-server.mjs" --open
if errorlevel 1 goto error
exit /b 0
:error
echo.
echo No se inicio la prueba. Esta ventana muestra el motivo.
pause
exit /b 1

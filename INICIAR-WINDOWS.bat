@echo off
chcp 65001 >nul
title NagWeb Camara 2.0
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js. Opcion simple: abri el archivo index.html con doble clic en Chrome.
  echo Para usar este lanzador instala Node.js desde https://nodejs.org ^(version LTS^) y volve a probar.
  pause
  exit /b 1
)
echo Abriendo NagWeb en http://127.0.0.1:4173/index.html
start "" "http://127.0.0.1:4173/index.html"
node tools\serve.mjs . 4173
pause

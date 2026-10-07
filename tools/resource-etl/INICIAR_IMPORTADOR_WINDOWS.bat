@echo off
setlocal
cd /d "%~dp0"

title NagWeb - Importador de Recursos

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  NagWeb no encontro Node.js en Windows.
  echo ============================================================
  echo.
  echo No se descargo ni modifico nada.
  echo Cuando llegue el momento de probarlo, instalaremos Node.js
  echo y volveremos a abrir este archivo.
  echo.
  pause
  exit /b 1
)

:menu
cls
echo ============================================================
echo            NAGWEB - IMPORTADOR DE RECURSOS
echo ============================================================
echo.
echo  1. PROBAR Poly Haven ^(5 modelos, NO descarga archivos^)
echo  2. DESCARGAR Poly Haven ^(5 modelos 3D, glTF 1K^)
echo  3. PROBAR Shadcn ^(5 componentes, NO guarda archivos^)
echo  4. DESCARGAR Shadcn ^(10 componentes^)
echo  5. CREAR catalogo local ^(25 Poly Haven + 25 Shadcn^)
echo.
echo  0. Salir
echo.
set /p choice=Elegi una opcion y presiona Enter: 

if "%choice%"=="1" goto poly_test
if "%choice%"=="2" goto poly_download
if "%choice%"=="3" goto shadcn_test
if "%choice%"=="4" goto shadcn_download
if "%choice%"=="5" goto catalog
if "%choice%"=="0" exit /b 0

echo.
echo Opcion no reconocida.
pause
goto menu

:poly_test
cls
echo Probando Poly Haven sin descargar archivos...
echo.
node src\cli.mjs --source=polyhaven --limit=5 --dry-run
goto done

:poly_download
cls
echo Descargando 5 modelos de Poly Haven en glTF 1K...
echo.
node src\cli.mjs --source=polyhaven --limit=5 --download --format=gltf --resolution=1k
goto done

:shadcn_test
cls
echo Probando Shadcn sin guardar archivos...
echo.
node src\cli.mjs --source=shadcn --limit=5 --dry-run
goto done

:shadcn_download
cls
echo Descargando 10 componentes Shadcn...
echo.
node src\cli.mjs --source=shadcn --limit=10 --download
goto done

:catalog
cls
echo Creando catalogo local sin bajar binarios 3D...
echo.
node src\cli.mjs --source=polyhaven --limit=25 --write
if errorlevel 1 goto done
node src\cli.mjs --source=shadcn --limit=25 --write
goto done

:done
echo.
echo ============================================================
if errorlevel 1 (
  echo  El importador termino con un error.
) else (
  echo  Operacion terminada.
)
echo ============================================================
echo.
echo Los archivos, cuando corresponda, quedan dentro de:
echo %CD%\output
echo.
pause
goto menu

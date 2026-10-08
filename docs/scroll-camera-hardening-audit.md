# Auditoría local de cámara NagWeb — 8 de octubre de 2026

## Estado y alcance
Repositorio https://github.com/decrackpichon-gif/NagWeb. Rama fuente feat/scroll-camera-v1; HEAD comprobado al clonar y nuevamente al cerrar: 5b55b7bd3fb45dadbf73ce384075f5bfdbc9a268.
Rama local test/scroll-camera-hardening-codex. Checkout: work/NagWeb dentro de este chat.
Se inspeccionaron cámara, integración del Director, modelo, HTML, documentación y workflow. No se modificó código de producto, Director, main, MotionLab ni constructor. Sin push, PR, merge ni despliegue.

## Resultados
- Modelo original: FALLÓ por TypeError (target.matches ausente en el doble de prueba). Después apareció una expectativa desactualizada de selección: dos objetivos estaban superpuestos, por lo que el primer clic elige 50% y el siguiente 100%. Ambas correcciones del test pasan.
- Runtime original: PASÓ. Paridad preview/export, progreso, mensajería, pausas, profundidad, jerarquía, movimiento reducido, compatibilidad desactivada y resize responsive.
- Smoke de navegador original: no era portable; buscaba Chrome únicamente en rutas Linux. Tras admitir Windows, Chrome inició. El servidor Python local 4173 no respondió: Chrome ERR_CONNECTION_TIMED_OUT e Invoke-WebRequest timeout. La ejecución real usó servidor Node estático en 127.0.0.1:4174, mediante NAGWEB_SMOKE_URL. No se sustituyó por una simulación.
- El siguiente intento completó las aserciones existentes pero falló al guardar capturas: EPERM al crear C:\tmp\nagweb-camera-visuals. Se añadió NAGWEB_CAMERA_VISUALS manteniendo el valor Linux por defecto.
- Smoke final completo: PASÓ, con Chrome real headless, Node 24.21.0 y puppeteer-core 25.13.0. Log entregado: final-smoke.log. No hubo pageerror.
- La repetición con Node 22 mediante npx terminó con código 1 sin diagnóstico útil en su salida. No se obtuvo una ejecución Node 22; queda pendiente el entorno exacto de CI.

## Interacciones comprobadas
- Vistas X/Z y X/Y; keyframes, campos XYZ, selección, navegación y cambios de orientación.
- Matriz nueva: 50%, 75%, 100%, 125%, 150%, 200%, 300% en ambas vistas; pan por botón cuando zoom >100%, arrastre del encuadre y deshacer. Verifica desplazamientos reales en coordenadas según range, ancho/alto y signo; tolerancia 1 px por redondeo. El tercer eje queda intacto y cada edición crea una sola entrada de historial.
- Ctrl y Meta + rueda enviados a Chrome; Alt + flecha; Shift + arrastre del fondo; Escape cancela pan; botón central desplaza; Home restablece; flechas navegan entre encuadres. Los atajos no alteran coordenadas del proyecto.
- Curvas: inserción/eliminación sobre trayectoria, tensiones de entrada/salida, handles libres y vectores numéricos. Nueva combinación: zoom y pan antes de arrastrar handle libre, deshacer/re hacer y comprobación en exportación.
- Mirada independiente: edición, arrastre, curvas libres, exportación; vinculación a un elemento y seguimiento de sus keyframes del Director; matriz responsive exportada.
- Pruebas existentes verifican composición 2.5D, contenedores absolutos y en flujo, exportación a 1000/500 px, anclas 3D y compatibilidad de datos antiguos sintéticos.
- Campo de visión y objetivo: evidencia visual real, inspeccionada; no se añadió una prueba numérica de la geometría del campo.

## Hallazgos y gravedad
No hay errores confirmados de producto en el alcance ejecutado.
Media (infraestructura): el test de modelo roto detenía el smoke completo, también antes del navegador en CI. Se corrigió el doble y la expectativa de superposición, sin cambiar selección del producto.
Baja (portabilidad): rutas de ejecutable y capturas Linux impedían completar la prueba Windows. Corregidas mediante detección de Chrome/Edge y variables opcionales.
La ausencia de cobertura de zoom/pan era una brecha de regresión; ahora está cubierta para cámara y curva libre.

## Archivos modificados
.github/nagweb-camera-model-test.mjs — doble DOM y selección repetida de objetivos superpuestos.
.github/nagweb-camera-smoke.mjs — NAGWEB_CHROME_PATH opcional y candidatos Windows; conserva candidatos Linux.
.github/nagweb-camera-browser-smoke.mjs — NAGWEB_CAMERA_VISUALS, capturas del mapa y regresiones de interacción.
docs/scroll-camera-hardening-audit.md — este informe.
No cambian js/nagweb-scroll-camera.js, js/nagweb-scroll-director-v16.js, js/nagweb-story-model.js, index.html ni workflow.

## Capturas entregadas
camera-visuals/map-top.png; map-front.png; map-top-zoom-pan.png; map-front-zoom-pan.png; map-complex-free-curve.png; map-look-target-fov.png.
También camera-editor.png, camera-export.png, camera-export-mobile.png, camera-lookat.png, camera-target-element.png.
Las del mapa se recortan al mapa para evitar el clipping del panel. Zoom/pan corresponde a 300%; curva libre a 125% con pan; objetivo/FOV a vista superior. Capturas de exportación provienen de los iframes reales.

## Pendiente
- Node 22 en Linux con el servidor Python 4173 y workflow sin cambios.
- Movimiento reducido real mediante emulateMediaFeatures; aquí se verifica en modelo/runtime simulados, no en navegador.
- Todos los niveles de zoom/pan sobre objetivos de mirada y sus handles, navegación Shift+flechas de mirada, centrado en objetivo y rueda en dispositivos/macOS reales. Meta se envió a Chrome en Windows.
- Geometría numérica del FOV y ocultamiento de perfil; fotos disponibles, no prueba exhaustiva.
- Proyectos históricos reales: no se usaron datos de usuarios; solo fixtures de compatibilidad.
- Pruebas multi navegador y panel completo en pantalla móvil; se verificó export responsive, no toda la interfaz móvil.

## Reproducir
Desde la raíz del checkout:
npm install --no-save --package-lock=false puppeteer-core
node .github/nagweb-camera-model-test.mjs
node .github/nagweb-camera-runtime-test.mjs
Iniciar un servidor HTTP local; en Linux se mantiene python3 -m http.server 4173 --bind 127.0.0.1.
En Windows definir NAGWEB_CHROME_PATH si la detección no encuentra ejecutable; definir NAGWEB_CAMERA_VISUALS a un directorio escribible.
NAGWEB_SMOKE_URL admite otro puerto. Ejecutar node .github/nagweb-camera-smoke.mjs.
El servidor Node de esta sesión está en work/run-smoke.mjs y usa 4174; es un recurso local de ejecución y no forma parte del commit.

## Transferencia sin desplegar
Se entrega un parche Git del commit local. En el otro checkout, crear una rama local desde el mismo SHA y aplicar con git am /ruta/al/parche.patch; no hacer push.
Alternativa: git apply --check seguido de git apply para revisar sin commit. Repetir pruebas allí.
Antes de cualquier push futuro, revisar la configuración REAL del proyecto Vercel, ramas de producción/preview, integración Git y workflows. Esta auditoría no comprobó esa configuración; no se garantiza que una rama nueva evite deploy. Compartir el parche o archivos por chat no activa la integración Git de Vercel.

# Edición del momento actual: regresión acotada

Se agrega `tests/camera-current-moment.browser.cjs` para aislar la interacción
que quedó pendiente durante el smoke completo de proyección CSS/Three.
No se modifica el comportamiento del editor ni el puente de cámara.

La prueba carga `index.html`, el editor y el Director reales en Chrome con
Playwright. Los recursos externos se sustituyen por las copias locales de las
bibliotecas; las demás solicitudes HTTPS se bloquean. No requiere despliegue.

En una sola sesión comprueba selección inicial, movimiento y Undo, scrub sin
cambiar la selección, creación al 42%, arrastre físico del nuevo punto,
dos Undo, selección exacta al 50% sin duplicación ni historial adicional,
Redo después de seleccionar y restauración final. También comprueba que el
flujo no produce errores JavaScript.

Resultado local: aprobado con Chrome en Windows. El Director sigue siendo
el único origen del progreso. Las copias de bibliotecas usadas son las mismas
de los fixtures espaciales; no se incorpora una dependencia al producto.

## Ejecución

Requiere Node, Playwright y Chrome/Chromium. `NAGWEB_BROWSER` puede indicar el
ejecutable del navegador. `NAGWEB_TEST_VENDOR_DIR` indica el directorio con
Three r128 (`three.cjs`), `GLTFLoader.js`, `gsap.js`, `ScrollTrigger.js` y los
scripts de postprocesamiento de los fixtures espaciales; por defecto usa `work`.

```sh
node tests/camera-current-moment.browser.cjs
```

## Alcance del resultado

El fallo de selección del smoke completo no se reproduce con esta secuencia
acotada. Esto valida este recorrido concreto, pero no demuestra que aquel
fallo sea del test, ni que haya quedado resuelto: su contexto incluye muchas
interacciones anteriores. El smoke completo y la comparación que no pudo
ejecutarse por el límite de la revisión automática siguen pendientes.

No se vuelven a ejecutar las 14 suites espaciales: no hay cambios de producto.
No se despliega en Vercel ni se integra a main.

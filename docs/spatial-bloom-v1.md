# Bloom de escenas espaciales — v1

## Cambio comprobado

El bloom anterior procesaba solamente la cámara histórica. Los objetos anclados
con cámara espacial se dibujaban después, sin resplandor. Además, la copia final
del compositor podía volver opaco el fondo del canvas transparente.

`js/nagweb-spatial-bloom.js` crea una pasada con las clases reales de Three.js
0.128.0 que el generador ya carga cuando está activo el bloom. Cada stage visible
usa su propia cámara, luces y buffers; la salida conserva el viewport completo
de esa stage y el scissor de su intersección con la pantalla. El resplandor no
invade la stage vecina. La ruta histórica usa también esta composición.

La pasada guarda el color y alpha originales antes de `UnrealBloomPass`, toma
su textura de resplandor y compone ambos con alpha premultiplicado. Un canvas
sin geometría sigue siendo completamente transparente. Con objetos brillantes,
el desenfoque más amplio puede dejar un alpha muy tenue lejos de la silueta.

Se conserva el control global de bloom: intensidad, radio 0.4 y umbral 0.15.
La intensidad 0 ahora se conserva al generar el sitio, en vez de reemplazarse
por 1.2. Formas y GLB usan sus materiales existentes; el resplandor depende de
su luminancia, y no se agrega un control selectivo por objeto.

## Progreso y recursos

La pose sigue llegando por `bindThreeCamera` desde `nagweb:spatial-camera`.
El compositor recibe delta 0: no lee su Clock ni evalúa progreso. El Director de
Scroll sigue siendo su único dueño y la animación local anterior sigue en su
ruta existente.

Los buffers espaciales se crean cuando una stage entra en pantalla, se liberan
cuando sale o se desconecta y se recrean si vuelve. Cambian de tamaño y densidad
con el viewport y DPR; la resolución mínima de 32 px evita mips de tamaño cero.
Reconectar el adaptador y el pagehide definitivo liberan los buffers, materiales
y geometría propios. Un pagehide persistido conserva los recursos para bfcache.
No se disponen materiales/geometrías de los modelos ni la geometría compartida
por las clases de postprocesamiento de Three.js.

Si falta una dependencia o falla una pasada, el objeto continúa en renderizado
directo. Una stage que falló no reintenta el bloom en cada cuadro; vuelve a estar
habilitada al reconectar el adaptador. Viewport, scissor, target, color de limpieza
y autoClear se restituyen aun ante excepciones.

## Validación reproducible

Usar las dependencias y variables descriptas en `scroll-camera-v1.md`:

```sh
node tests/spatial-bloom.integration.cjs
node tests/spatial-bloom.browser.cjs
node tests/spatial-renderer.integration.cjs
node tests/spatial-renderer.browser.cjs
node tests/spatial-lights.integration.cjs
node tests/spatial-lights.browser.cjs
node --check js/nagweb-spatial-bloom.js
node --check js/nagweb-spatial-renderer.js
```

La integración acepta un build UMD r128 como primer argumento. Con
`NAGWEB_TEST_VENDOR_DIR`, agregar a los cuatro archivos anteriores:
`CopyShader.js`, `LuminosityHighPassShader.js`, `EffectComposer.js`, `RenderPass.js`,
`ShaderPass.js` y `UnrealBloomPass.js` de `examples/js` de Three.js r128.
Son fixtures locales: no se versionan ni agregan dependencias al sitio exportado.

La integración ejecuta los pases reales, con un renderer instrumentado, y
verifica tamaños/DPR, restitución ante errores, disposición, creación diferida,
salida de pantalla y ausencia de lecturas del Clock. Chrome/WebGL con SwiftShader
prueba el HTML real generado en diseño y exportación, con bloom apagado, en 0 y
en 1.2, incluyendo la ruta de cámara histórica. Lee píxeles de una forma y un
GLB mínimo emisivo: sin bloom, alpha del halo
0; con bloom, alpha 166 y 48 respectivamente en las muestras. Un material gris
sin saturación conserva su color con intensidad 0. La pasada vacía mantiene
RGBA [0,0,0,0]. También verifica movimiento de cámara por el Director, posición
estable del objeto, resize, DPR 2, reduced-motion, recorte entre dos stages,
liberación/recreación fuera de pantalla, pagehide y fallos de dependencias/pases.

Las capturas y HTML quedan en `work/`, sin versionarse. Las pruebas anteriores
de geometrías, GLB, iluminación y edición de luces siguen siendo regresiones;
la prueba del renderizador comprueba la sintaxis de scripts inline de `index.html`.

## Límites vigentes

- Participan objetos `anchor:true` en stages con cámara espacial habilitada.
  Los objetos sin ancla y escenas sin cámara mantienen su cámara histórica.
- Se conserva Three.js r128 y su algoritmo de bloom. No se agregan sombras,
  oclusión DOM/WebGL, timing individual ni objetivos 3D para «Mirar hacia».
- Cada stage visible necesita buffers y pases adicionales. No se midió el
  rendimiento con escenas grandes, modelos externos o hardware móvil.
- Se verificaron Chrome con SwiftShader y un GLB mínimo. No se probaron todos
  los materiales, navegadores, animaciones GLB, transiciones e inercia combinadas.
- No se despliega en Vercel ni se hace merge a main. `feat/scroll-camera-v1`
  conserva su despliegue por Git deshabilitado en `vercel.json`.

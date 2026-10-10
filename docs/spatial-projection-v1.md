# Proyección compartida CSS / Three — v1

## Cambio comprobado

La cámara CSS rotaba el mundo alrededor del centro del contenido en Z = 0.
Three rotaba desde el ojo de la cámara. Además, las combinaciones de pitch/yaw
usaban órdenes distintos. En el fixture de contenedores anidados, el centro
DOM era aproximadamente (707, 295) y el de Three (796, 257) px.

Ahora el origen de transformación CSS se ubica en el ojo: centro de la stage,
una distancia de perspectiva por delante del plano del contenido. Se calcula
respecto del layout de `.inner`, aunque ese contenedor sea menor que la stage
o esté desplazado. Se actualiza con el tamaño, posición de layout y factor
adaptable. Las traslaciones conservan su convención anterior.

La cámara usa yaw → pitch → roll. Su vista CSS inversa es
`Rz(-roll) Rx(-pitch) Ry(-yaw) T(-x,-y,+z)`. Three usa los mismos ángulos,
con inversión de Y y Euler `YXZ`: `(-pitch, yaw, -roll)`. El estado del puente
añade `rotationRadians`; `applyThreeCamera` aplica la orientación explícita,
evitando que `lookAt` cambie el eje vertical al pasar por ±90° o 180°.
El target informativo del estado mantiene la dirección sin recortarse en el
límite ±4000 de las coordenadas de edición. Los estados anteriores que no
incluyen `rotationRadians` siguen aceptándose por la ruta `lookAt`.

Se corrigen también dos casos del puente:

- Un giro de horizonte sin traslación/pitch/yaw conserva su efecto CSS. Antes
  se trataba como una cámara neutral y la animación se cancelaba.
- El Director ya entrega una pose escalada para CSS. Al convertirla al estado
  Three, el factor adaptable ahora se aplica una sola vez; antes reducía otra
  vez los desplazamientos X/Y/Z en pantallas angostas.

`nagweb:spatial-camera`, replay inicial y liberación del binding mantienen su
contrato. El Director sigue siendo el único dueño del progreso. No se editan
proyectos guardados, encuadres, porcentajes ni animaciones de los elementos.

## Efecto sobre proyectos existentes

Las escenas con cámara rotada cambian su encuadre CSS: giran desde el ojo y
componen pitch/yaw en el orden corregido. Este es un cambio visual deliberado
para que HTML y objetos Three compartan la vista. Las escenas sin giro conservan
su proyección; los encuadres guardados se mantienen y pueden reajustarse desde
el panel. Three conserva la dirección habitual y también respeta poses invertidas
y vueltas completas. La cámara espacial continúa siendo opcional.

## Validación reproducible

Usar las dependencias y variables de entorno de `scroll-camera-v1.md`:

```sh
node tests/spatial-projection.integration.cjs
node tests/spatial-projection.browser.cjs
node tests/spatial-hierarchy.browser.cjs
node .github/nagweb-camera-model-test.mjs
node .github/nagweb-camera-runtime-test.mjs
node tests/spatial-focus-map.integration.cjs
node --check js/nagweb-scroll-camera.js
node --check .github/nagweb-camera-browser-smoke.mjs
```

La integración admite Three.js r128 UMD como primer argumento. Usa cámaras y
quaternions reales para orientación completa, poses invertidas y polos, límites
de coordenadas, giro exclusivo de horizonte, origen del ojo, actualización por
layout/resize, escala adaptable única, replay, retorno neutral y teardown.

Chrome/WebGL con SwiftShader compara centros DOM con puntos Three y comprueba
que sus posiciones proyectadas contengan píxeles WebGL reales. Los tres puntos
tienen distintas profundidades. Cubre once casos: neutral, desplazamiento,
roll exclusivo, pitch, yaw, giros combinados, mirada a un punto, `.inner`
desplazado, modo adaptable, resize y retorno neutral. Las 66 comparaciones X/Y
pasan con tolerancia 0.05 px; el error máximo observado fue 0.000045 px. El
objetivo enfocado queda en el centro real de cámara. El puente anterior falla la misma
prueba independiente en el caso de roll exclusivo.

La prueba de herencia ahora exige paridad también en su modo de cámara rotada,
con forma y GLB reales en diseño/exportación/bloom. Esa comparación sigue
aislando filtros, overflow y will-change del fixture; no altera esos estilos
en el producto. En el caso que antes difería casi 90 px, ambos centros quedan
aproximadamente en (796, 257), con error inferior a 0.001 px.

Las seis parejas espaciales anteriores también pasan, incluyendo gestos reales
de mover, redimensionar y girar formas/GLB; luces, bloom, alpha, reduced-motion,
resize, aislamiento y limpieza. Los scripts inline del editor pasan la revisión
de sintaxis. Los fixtures, capturas y paquetes de prueba quedan en `work/`.

## Límites vigentes

Actualización posterior: el recorrido acotado de crear/arrastrar/Undo/seleccionar/
Redo pasó en el editor real. Ver [regresión del momento actual](camera-current-moment-v1.md).
No reproduce el fallo del smoke completo ni lo da por resuelto.

- El smoke completo del editor no quedó aprobado: avanzó por controles del mapa
  y arrastre de un nuevo keyframe, pero se detuvo en la selección del keyframe
  existente después de Undo. Se corrigieron consultas de conteo y visibilidad
  del propio test; no se determinó la causa de ese fallo de selección. La
  comparación adicional contra la cámara publicada no se ejecutó porque la
  revisión automática de permisos alcanzó su límite de uso. Esto no invalida
  las 14 suites espaciales aprobadas, pero deja pendiente esa validación del editor.

- Se corrige la vista compartida; no se reproduce aplanamiento, clipping, bordes,
  filtros, blur ni oclusión DOM/WebGL. Continúan los límites documentados en
  [Herencia de contenedores 3D](spatial-hierarchy-v1.md).
- La comparación visual cubre los tamaños y perspectivas del fixture. El FOV
  Three conserva el límite de 1–175° del puente; proporciones extremas que
  alcancen ese límite no tienen paridad garantizada con CSS. El layout usa
  offsets DOM redondeados y no garantiza igualdad subpíxel en toda composición.
- No se amplía el soporte de contenedores especiales, transiciones de escena,
  deformaciones skeleton/morph, hardware móvil ni rendimiento con muchos modelos.
- No se despliega en Vercel ni se integra a main. Se conserva la prohibición de
  despliegue Git de `feat/scroll-camera-v1` en `vercel.json`.

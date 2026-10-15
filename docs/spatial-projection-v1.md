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


## Cruce conservador de planos HTML inclinados (14/10/2026)

El Director continúa evaluando el tiempo y las poses. La utilidad compartida `parallelPlaneBehindEye` ahora admite la huella de píxeles de un plano raíz HTML y calcula cuánto se acercan sus cuatro esquinas al ojo de perspectiva cuando hay rotaciones X/Y. Solo oculta el plano una vez que **toda** su superficie queda detrás del observador. Mientras parte del plano siga adelante, el navegador conserva su recorte CSS. Se restablecen la visibilidad y la interacción al retroceder. No se altera el contenido guardado, su rotación ni la cámara.

**Conservadurismo intencional:** cámaras con pitch/yaw, dimensiones desconocidas o planos inclinados con giro Z adicional no se ocultan por este cálculo parcial: sigue actuando el recorte del navegador. Tampoco se promete oclusión parcial entre DOM y mallas WebGL ni corrección de anclas dentro de jerarquías transformadas. El cálculo utiliza el `offsetWidth/offsetHeight` de la vista y el tamaño de pose, sin aproximar la visibilidad a partir del centro del plano.

**QA:** nuevos casos aislados de rotación X/Y combinada, tamaño, escala adaptable y fallbacks; el fixture Chromium de proyección compartida también verifica un botón HTML real atravesando la profundidad, hit testing y recuperación al volver. Verificar los resultados de GitHub Actions del commit antes de declararlos aprobados.


## Primera integración de oclusión HTML → WebGL (14/10/2026)

Se incorpora al adaptador espacial de Three una **pasada de profundidad sin color** para superficies raíz HTML totalmente opacas, sin transformaciones propias ni clipping complejo. En el mismo render y usando la cámara ya sincronizada con el Director, una malla proxy invisible para el color representa cada rectángulo HTML compatible. El depth buffer impide dibujar detrás las partes de un modelo WebGL cubiertas por ese plano. El DOM real continúa siendo texto/imágenes/enlaces accesibles: no se rasteriza ni se reemplaza. No hay lectores nuevos de scroll.

Se consideran solo superficies cuyo fondo CSS es completamente opaco o imágenes JPEG nativas completas sin transformaciones complejas. Se omiten elementos transparentes, con bordes redondeados, máscaras, clips, filtros, composiciones especiales, jerarquías o layout ambiguos; no se representa un texto con un rectángulo falso. Se actualizan posición, profundidad, escala y giro de los proxies desde la pose ya evaluada, sin keyframes duplicados. Conexión y liberación eliminan geometrías/materiales temporales.

La primera implementación **no es todavía la oclusión total del objetivo final**: falta composición precisa de imágenes con alpha y mapas UV, geometría parcialmente translúcida, contenedores anidados y algunas combinaciones de bloom/transparencias; los bordes y transformaciones CSS complejas se excluyen antes que falsear profundidad. Se agregan pruebas de estado del adaptador y de profundidad GPU real en Chromium para evitar regresiones, además de conservar la suite espacial existente. Consultar CI del commit antes de declararla aprobada.


### Oclusión por canal alfa de imágenes (14/10/2026)

El mismo adaptador GPU admite imágenes integradas **PNG, WebP y SVG** con transparencia cuando son un `IMG` raíz o el único hijo visual de un contenedor sin fondo, y ocupan la caja completa sin `object-fit: cover`, bordes redondeados, clipping ni transformaciones adicionales. Usa `THREE.Texture` del elemento nativo y `alphaTest` en una malla de profundidad sin color, para recortar **por píxel** el objeto WebGL detrás de la figura opaca sin cubrir sus huecos transparentes. El HTML original permanece real y accesible. Un JPEG incrustado sigue siendo una superficie sólida. Se excluyen orígenes remotos, imágenes con recorte visual, mezclas CSS y agrupaciones complejas para no falsear profundidad.

La textura aparece cuando la imagen termina de cargarse, se reemplaza al cambiar `src` y se dispone al reconectar o destruir el adaptador. Pruebas: cambio de fuente, exclusión remota y liberación de recursos, además de un caso real Chromium/WebGL que exige transparencia en una mitad y oclusión en la otra. **Pendiente:** radios/clips, anidamientos, fuentes remotas CORS explícitas, texturas de video y paridad con bloom/múltiples capas. Comprobar la CI de cada commit antes de declararlo aprobado.


### Máscaras geométricas CSS e imágenes recortadas (15/10/2026)

Las superficies simples del adaptador de profundidad incorporan una **máscara alfa única** generada en Canvas cuando lo exigen los bordes redondeados, los recortes CSS o el ajuste de imágenes. Se admiten radios CSS por esquina (incluidos radios elípticos y porcentajes), `clip-path: inset(...)` con `round` simple, `circle(... at ...)`, `ellipse(... at ...)` y `object-fit: fill|cover|contain` con posiciones sencillas. El canvas se emplea **solo para la silueta del búfer de profundidad**; el DOM original sigue dibujando su texto, imagen e interacciones. La textura y geometría se reutilizan hasta cambiar fuente, medidas o estilo, y se liberan al reemplazarlas y destruir la escena. Resolución de máscara acotada a 1024 píxeles de lado para contener memoria.

**Exclusiones por seguridad visual:** `clip-path` con polígonos/rutas arbitrarias, efectos de máscara CSS, filtros no neutros, contenidos DOM compuestos, ubicaciones de imagen no expresables con porcentajes y algunos anidamientos de contenedores siguen sin proxy; no se aproxima su recorte con un rectángulo falso. Es oclusión HTML → WebGL, **no** oclusión recíproca WebGL → texto HTML. Pruebas Chromium comprueban esquinas redondeadas, recorte circular, inset redondeado, transparencia original de PNG y reconstrucción al cambiar object-fit, además de conservar la suite existente.


### Profundidad HTML en contenedores 3D compatibles (15/10/2026)

Los proxies de profundidad ya no están limitados a hijos directos del lienzo. Los elementos HTML opacos o con máscara alfa dentro de un contenedor `container-box` pueden compartir el cálculo de jerarquía que usa Three.js para posicionar los modelos GLB. Los desplazamientos y las transformaciones 2D/3D del contenedor se componen con la profundidad y rotación evaluadas por el Director, **sin implementar otro parser ni otro reloj**. Se mantienen imágenes, textos y enlaces como HTML real.

La compatibilidad es conservadora: todos los padres de la cadena deben ser contenedores con `transform-style: preserve-3d`, visibilidad plena, opacidad 1, sin clipping/máscara/filtros complejos ni desbordamiento oculto. Si durante la ejecución un padre deja de cumplir esas condiciones, se desactiva la malla de profundidad y se conserva la vista HTML normal; no se aplica una máscara incorrecta. El tamaño, posición y máscaras del elemento siguen la actualización común. El adaptador libera las mallas al cambiar de escena. Se añadieron pruebas de matrices y exclusión en Three, y una verificación espacial en Chromium con un contenedor HTML rotado. **Aún pendiente:** oclusión inversa de modelos WebGL delante de HTML y compatibilidad con contenedores que aplanan o recortan.

# Interacción de objetos con cámara espacial — v1

## Cambio comprobado

El giro usaba una esfera proyectada, pero no comprobaba si el puntero estaba
dentro del recorte de la stage. Un objeto con centro cerca del borde podía
tomarse desde la parte que no se dibujaba. En diseño, mover o redimensionar el
ancla convertía el desplazamiento del mouse usando solamente el rectángulo DOM,
sin invertir la perspectiva y rotación de la cámara.

El renderizador ahora expone dos operaciones, usando la cámara que recibe de
`bindThreeCamera`:

- `pick(candidates, x, y, legacyCamera)` comprueba los mismos límites de pantalla
  y stage que el scissor, y usa intersecciones reales de Raycaster. Dentro de
  una stage prioriza la superficie visible más cercana; entre stages sigue
  el orden de las pasadas de renderizado. Ignora Groups/ancestros ocultos,
  materiales invisibles o con opacity 0 y geometría fuera de near/far.
- Si no se intersecta una superficie, conserva la esfera aproximada anterior
  como área de agarre. Esto permite tomar anillos desde su hueco y nubes de
  puntos. La esfera se arma con la geometría visible y también respeta el recorte.
- `anchorPoint(g, x, y)` intersecta el rayo de la cámara con el plano Z del
  holder anclado. Diseño convierte la diferencia en porcentajes del ancho/alto
  local de la stage; mover y cambiar ancho usan la misma conversión inversa.
  Los datos guardados siguen siendo `x/y/w`, con el snapping existente.

En diseño, las anclas espaciales usan ahora un marco flotante proyectado desde
los ocho vértices de sus bounds 3D, recortado a la stage y la pantalla. El marco
DOM anterior se oculta sin alterar su tamaño ni posición de layout. Si deja de
participar en la cámara espacial, recupera su visibilidad anterior. El cuerpo
del marco usa el mismo picking para resolver objetos superpuestos; los handles
mantienen el objeto seleccionado. Mover/redimensionar acepta sólo su puntero
inicial y termina también ante cancelación o pérdida de foco.
El menú contextual usa la identidad del objeto desde el marco proyectado y el
mismo picking para resolver superposiciones.

El runtime exportado delega el picking a este adaptador. Mantiene los ejes,
sensibilidad e inercia del giro anterior. Acepta sólo el botón principal y el
puntero que inició el gesto, y respeta enlaces, botones y controles de formulario.
Cancelar el puntero o perder foco detiene el gesto y sus velocidades. Un pagehide
persistido conserva los listeners, con el gesto detenido; el definitivo los
retira y desactiva el paso de giro.

El Director de Scroll sigue siendo el único dueño del progreso. No se añaden
lectores de scroll ni evaluadores de cámara; el reloj de giro local existente
sigue separado del progreso del Director.

## Validación reproducible

Usar las dependencias y variables de entorno de `scroll-camera-v1.md`:

```sh
node tests/spatial-interaction.integration.cjs
node tests/spatial-interaction.browser.cjs
node tests/spatial-renderer.integration.cjs
node tests/spatial-renderer.browser.cjs
node tests/spatial-lights.integration.cjs
node tests/spatial-lights.browser.cjs
node tests/spatial-bloom.integration.cjs
node tests/spatial-bloom.browser.cjs
node --check js/nagweb-spatial-renderer.js
```

La integración acepta un build UMD r128 de Three.js como primer argumento.
La prueba de navegador usa los mismos cuatro fixtures opcionales de
`NAGWEB_TEST_VENDOR_DIR` que la prueba del renderizador. Los fixtures, HTML
generados y capturas quedan en `work/`, sin versionarse.

La integración usa geometrías, cámaras y Raycaster reales de Three.js r128:
superficie más cercana, recorte/orden de stages, visibilidad, clipping, inversión
del plano con cámara rotada, anillos, puntos, cámara histórica y resize.

Chrome/WebGL con SwiftShader ejecuta el sitio generado. Gestos reales del mouse
giran la forma y el GLB mínimo cargado por GLTFLoader, respetando el eje configurado,
la posición estable del holder y el progreso manual del Director. El área
recortada no inicia un giro, mientras que el borde visible sí. Clic derecho y un
botón superpuesto no lo inician. Prueba resize, reduced-motion, propiedad del
puntero, cancelación, blur y ambos tipos de pagehide, incluyendo la eliminación
de los seis listeners del giro. En diseño, gestos reales seleccionan y mueven
forma/GLB, comprueban los porcentajes guardados con cámara rotada y redimensionan
el GLB por el mismo plano. Los marcos proyectados contienen la posición visible
de cada objeto y el marco original queda oculto. También verifica su recorte,
cancelación del puntero y restitución del marco original al desconectar.
Un clic derecho real sobre el GLB envía su identidad al menú contextual.

## Límites vigentes

- La selección no es una máscara de píxeles: el área aproximada sigue habilitada
  cuando no hay intersección. Bloom, huecos, transparencias y puntos pueden
  requerir decisiones de interacción distintas en etapas futuras.
- Los marcos flotantes de edición siguen siendo DOM y usan bounds aproximados.
  No son un gizmo volumétrico ni incorporan oclusión DOM/WebGL.
- Se verifican modelos estáticos y un GLB mínimo. No se probaron todos los
  materiales, deformaciones de skeleton/morph, modelos grandes o hardware móvil.
  El costo de raycasting sobre modelos complejos queda pendiente de medir.
- Las rutas de escenas sin cámara espacial y objetos sin ancla conservan su
  cámara histórica. No se integra timing individual ni objetivos 3D de «Mirar hacia».
- No se despliega en Vercel ni se hace merge a main. La rama sigue siendo
  `feat/scroll-camera-v1`, con despliegue por Git deshabilitado.

## Actualización posterior

El timing propio de objetos anclados ahora se integra como se documenta en
[Timing individual de objetos espaciales v1](spatial-timing-v1.md).
El picking y los marcos proyectados respetan esa visibilidad. Un giro activo
se cancela si el Director oculta el objeto, y su inercia se detiene.

Las anclas dentro de contenedores libres admitidos usan ahora el plano local
heredado y porcentajes del padre real, como se documenta en
[Herencia de contenedores 3D v1](spatial-hierarchy-v1.md). La opacidad de los
padres también bloquea el picking y oculta sus marcos proyectados.

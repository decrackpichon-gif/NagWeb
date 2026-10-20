# Luces de escenas espaciales — v1

## Cambio comprobado

Las formas y GLB anclados se dibujan en unidades CSS px. Las luces originales
estaban en unidades Three.js históricas, por lo que una luz puntual con alcance
22 no alcanzaba un objeto situado a cientos de píxeles.

`createSpatialRenderer` recibe ahora las luces originales del renderizador real.
Crea un Group de iluminación para cada stage que tenga objetos anclados:

- Copia los presets globales y sólo las luces `light3d` de esa sección.
- Sitúa el origen en `z = -cssPerspective` y usa la misma conversión de unidades
  de los offsets de los objetos: `stageHeight / (12 * tan(25°))` px por unidad.
- Convierte también `distance` de puntuales y focos; mantiene 0 como alcance
  ilimitado. Intensidad, color, ángulo, penumbra y decay siguen la fuente original.
- Agrega al Group los targets clonados de focos y direccionales. Así el objetivo
  pasa al plano local de la escena y no queda apuntando al origen global anterior.
- Quita el desplazamiento histórico entre secciones de las luces personalizadas,
  sin escribir posiciones, targets ni alcance sobre las fuentes originales.

Cada pasada espacial activa exclusivamente su Group. Las fuentes originales
siguen atendiendo el renderizado histórico; se restauran visibilidad y estado del
renderer incluso ante excepciones. Los marcadores de luces espaciales se omiten
sólo en la pasada histórica para evitar duplicarlos. Al reconectar o destruir el
adaptador, sus Groups y listeners se retiran, sin disponer materiales/geometrías
compartidos con las fuentes.

El Director conserva toda la evaluación del progreso. Esta etapa no añade
listeners de scroll, interpoladores ni clocks al adaptador.

## Edición

Los controles de las luces se proyectan con la cámara y el viewport de su escena.
El arrastre intersecta el rayo del puntero con el plano Z de la luz y convierte el
resultado a coordenadas locales; continúa guardando `offX/offY` en las unidades
históricas del proyecto. Si no existe intersección, el gesto no se inicia.
Mover una luz cambia también su posición Y durante el gesto. Los controles se
actualizan después de renderizar, usando la pose del mismo cuadro.

## Validación local

Con las dependencias/variables de entorno descriptas en `scroll-camera-v1.md`:

```sh
node tests/spatial-lights.integration.cjs
node tests/spatial-lights.browser.cjs
node tests/spatial-renderer.integration.cjs
node tests/spatial-renderer.browser.cjs
```

La integración usa cámaras y luces reales de Three.js r128 y verifica conversión,
objetivos, alcance, aislamiento, resize, restitución ante errores, reconexión y
teardown. También verifica la conversión inversa del picking con cámara rotada.

Chrome/WebGL con SwiftShader prueba el HTML generado en diseño y exportación.
Lee píxeles de un material sin reflejos de entorno, con los presets apagados:
las luces puntual/foco/direccional cambian un píxel negro a un gris visible;
un alcance corto lo devuelve a negro. Una luz roja intensa de otra sección no
altera la muestra, que se verifica sin saturación. Además, prueba el control
proyectado, un arrastre real del mouse, el mensaje con coordenadas guardadas,
resize, reduced-motion y ambos tipos de pagehide.

Pasaron también las pruebas anteriores de formas y GLB, y las verificaciones de
sintaxis de los scripts modificados y los scripts inline del generador.

## Límites vigentes

Esto integra la iluminación de objetos `anchor:true` con cámara espacial. Los
objetos sin ancla conservan su ruta anterior. No añade bloom a las pasadas
espaciales, sombras nuevas, oclusión DOM/WebGL ni timing individual de luces.
La conversión se validó con la iluminación no física que ya usa Three.js r128;
no se garantiza paridad radiométrica al activar physicallyCorrectLights.
Los GLB siguen usando sus materiales existentes; no se probaron todos los
materiales/modelos ni hardware móvil. Tampoco se verificaron aquí transiciones
de escena e inercia combinadas con este cambio.

No se despliega en Vercel ni se hace merge a main. La rama sigue siendo
`feat/scroll-camera-v1` y mantiene deshabilitado su despliegue por Git.

## Actualización posterior

El límite de bloom queda reemplazado por la etapa documentada en
[Bloom de escenas espaciales v1](spatial-bloom-v1.md). Los demás límites de
iluminación y modelos de esta etapa continúan vigentes.

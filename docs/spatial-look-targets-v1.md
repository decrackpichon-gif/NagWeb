# Objetivos de mirada para modelos 3D anclados

## Alcance

La cámara del Director de Scroll puede seleccionar objetos `shape3d` con anclaje activo (`anchor !== false`) como objetivos en **Mirar hacia** y en el inspector del mapa. Incluye formas nativas y modelos GLB que comparten ese tipo. El botón «Apuntar cámara a este objeto acá» usa la lógica existente: enlaza el objetivo en el instante actual; si ese instante ya tiene un keyframe, lo actualiza; si falta, crea uno. Las acciones siguen siendo reversibles con Deshacer.

En el mapa, los objetos 3D se identifican con la marca ⬡. El contorno dibujado representa el tamaño del **ancla**, no los vértices, la oclusión ni la silueta real del GLB. El objetivo apunta al **pivote del ancla**, no a la parte más visible de la malla.

## Conversión espacial

La cámara CSS y el adaptador Three.js usan convenciones Z opuestas:

- El adaptador coloca el holder WebGL en `z3 = -perspective + offZ × (height/(12 tan 25°)) + directorZ`, en unidades equivalentes a CSS px. En la dirección vertical, Y de Three invierte el signo de Y del diseño.
- El punto de mirada del Director usa `cameraZ = perspective - offZ × (height/(12 tan 25°)) - directorZ`; X/Y proceden del ancla en porcentaje, alrededor del centro de la stage, más el movimiento de los keyframes del Director.
- La conversión depende del tamaño de referencia calculado por el runtime. Los cambios de escala responsive continúan siendo responsabilidad del puente de cámara existente.
- El tipo `shape3d` **no** entra en `layers` ni en el contenedor CSS de cámara. Sólo se hace elegible como objetivo, evitando una segunda transformación.

Las coordenadas se evalúan con `NAGWEB_STORY_MODEL` en el mismo porcentaje del Director, sin crear otro reloj.

## Casos protegidos

Se excluyen los 3D sin ancla, anidados, fijos, modales, instancias MotionLab y escenas fuera del Lienzo libre; `light3d` sigue excluido. Los objetivos tradicionales de HTML mantienen su profundidad y animación anteriores. Si el modelo deja de existir, la trayectoria vuelve al XYZ guardado en el objetivo.

## Verificación y límites

Se agregaron casos para elegibilidad y exclusión CSS, Z real del renderizador (con offZ), XYZ animados, conversión a coordenadas Three.js, interpolación de mirada y recuperación de XYZ. El smoke de navegador comprueba que un 3D se vea en el mapa, pueda elegirse, vinculase en un keyframe y deshacerse.

Esta etapa **no** agrega detección del centro geométrico real o dinámico del GLB, seguimiento de huesos o morphs, oclusión HTML/WebGL ni selección de puntos dentro de una malla. La distancia del inspector hasta el 3D se refiere al pivote del ancla. Las pruebas nuevas están añadidas al repositorio, pero requieren correr la suite Chromium en un entorno con dependencias y fixture real para dar por validada la experiencia de punta a punta.

No se despliega en Vercel ni se integra a `main`.

## Punto de enfoque ajustable en un objetivo 3D

El modelo puede tener un pivote técnico que no coincida con el lugar al que conviene mirar (por ejemplo, el torso de un personaje en vez del rostro).

Con **Mirar hacia** y un objetivo `shape3d` anclado seleccionado, el panel de cámara ofrece **Enfoque X/Y/Z (px)**. Son desplazamientos del punto de mirada relativos al pivote del modelo, sin trasladar ni modificar su geometría:

- X positivo: mirar más a la derecha.
- Y negativo: mirar más arriba.
- Z positivo: aumenta la coordenada Z del enfoque; no significa necesariamente acercarse a la cámara.

Cada keyframe de mirada puede conservar un desplazamiento distinto, con interpolación a través de la trayectoria de mirada existente. El punto ajustado sigue el movimiento de los keyframes del modelo y se refleja en el mapa. Los tres valores están limitados a ±4000 px, se normalizan y forman parte del mismo historial de Deshacer. Los proyectos antiguos sin desplazamientos no cambian.

Al editar el enfoque, su posición absoluta actual también queda guardada como respaldo XYZ si el modelo desaparece. Al elegir otro objetivo se restablecen los desplazamientos a cero para evitar arrastrar el ajuste de un modelo ajeno. Al pasar de un modelo a **Punto XYZ**, el sistema guarda el punto ajustado efectivo del instante seleccionado y elimina el vínculo: no salta otra vez al pivote.

Se agregaron pruebas de modelo y smoke de navegador para offsets XYZ, interpolación, conservación de proyectos antiguos, cambio de mirada, edición sin tocar el GLB, desvinculación sin salto y Deshacer. El código y los tests fueron revisados sintácticamente; el smoke completo en Chromium queda pendiente de ejecución.

El ajuste desplaza el **punto de mirada** en el sistema de coordenadas de la escena, no rota ese offset según los huesos o la orientación local de una malla animada. Para seguir la cara de un personaje con animaciones esqueléticas habría que añadir un ancla por hueso o por nodo GLB.

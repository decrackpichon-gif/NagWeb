# NAGWEB 03 | Cámara 3D

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

## Identidad inmutable y ramas

- Proyecto: **NAGWEB 03 | Cámara 3D**.
- Producto general: **NagWeb**, repositorio [https://github.com/decrackpichon-gif/NagWeb](https://github.com/decrackpichon-gif/NagWeb).
- Rama propia de desarrollo: [`feat/scroll-camera-v1`](https://github.com/decrackpichon-gif/NagWeb/tree/feat/scroll-camera-v1).
- HEAD de referencia (10/10/2026): [`78d0328250a44fd4b334a767ddf9df141b25858c`](https://github.com/decrackpichon-gif/NagWeb/commit/78d0328250a44fd4b334a767ddf9df141b25858c). **Puede cambiar** mientras otros chats trabajan.
- Existen ramas auxiliares de curvas y mapas (`feat/scroll-camera-*`). No sustituir la rama principal sin revisar diferencias y autorización.

## Documentación técnica ya existente en GitHub

- [`docs/scroll-camera-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/scroll-camera-v1.md)
- [`docs/research-wishlist-scroll-camera.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/research-wishlist-scroll-camera.md)
- [`docs/camera-current-moment-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/camera-current-moment-v1.md)
- [`docs/spatial-projection-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-projection-v1.md)
- [`docs/spatial-interaction-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-interaction-v1.md)
- [`docs/spatial-timing-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-timing-v1.md)
- [`docs/spatial-hierarchy-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-hierarchy-v1.md)
- [`docs/spatial-layout-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-layout-v1.md)
- [`docs/spatial-lights-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-lights-v1.md)
- [`docs/spatial-bloom-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/spatial-bloom-v1.md)

Esos documentos **ya existen** en sus ramas y suelen tener muchos más detalles de implementación. Consultarlos antes de planificar. Esta ficha agrega el contexto de producto, las referencias y la política de continuidad que faltaban.

## Objetivo final

Cámara espacial narrativa de NagWeb para desplazamientos y encuadres XYZ, orientación, lookAt, puntos, curvas, tangentes, edición desde mapa superior/frontal y uso de objetos WebGL anclados en escenas DOM. **Director de Scroll 0→1 sigue siendo el único dueño del progreso**. No introducir Lenis, GSAP ScrollTrigger ni Theatre.js como motor alternativo.

## Trabajo y decisiones conocidos

- Mapa X/Z y X/Y, edición visual de recorridos, cámara/objetivo independientes, ajustes de trayectoria, keyframes y vista previa.
- Comparaciones A/B, análisis de cobertura **proyectada 2D**, no visibilidad volumétrica real 3D.
- Integración espacial con Three/WebGL, anclajes de objetos 3D, interacción, timing, jerarquías de contenedores y proyección CSS/Three documentadas en la rama.
- Último commit verificado (`78d0328...`): liberación correcta de renderer y prevención de cargas tardías al terminar la página. Revisión de CI de cámara y espacial registrada como exitosa en la recuperación anterior.
- Continuidad 11/10/2026: se incorporó la elección de un punto real de superficie en modelos GLB desde la vista previa, enlazado al enfoque del Director. En Ángulos manuales se añadió orientación visual con mouse en la vista previa, actualización CSS/Three durante el arrastre, Shift para bloquear eje, Escape para cancelar y una sola operación de Deshacer al soltar. No reemplaza la manipulación XYZ volumétrica pendiente; Mirar hacia conserva su editor de objetivos propio. Documentación: `docs/spatial-look-targets-v1.md` y `docs/scroll-camera-v1.md`. Las pruebas aisladas del editor pasaron; confirmar CI integrada por separado.
- Continuidad 11/10/2026 (siguiente avance): controles de traslación visual **X/Y/Z + plano XY** sobre la vista previa, disponibles también en modo **Mirar hacia**. Previsualizan CSS y Three.js, soportan sensibilidad reducida con Shift, Escape para cancelar, teclado con flechas y guardado de un solo keyframe/snapshot al soltar. El Director sigue dueño del progreso. Prueba aislada del editor: 97 comprobaciones aprobadas en evaluación JS de la suite `tests/spatial-focus-map.integration.cjs`; CI completa y prueba manual de navegador aún no confirmadas. Siguiente objetivo: probar la UX visual y evolucionar a manipulación espacial de objetos 3D sin interferir con el Editor principal.

## Próximas prioridades (revisar con HEAD actual)

- Leer las limitaciones documentadas en `docs/scroll-camera-v1.md` y los subdocumentos espaciales para decidir una mejora útil; algunos antiguos pendientes ya fueron resueltos.
- Priorizar calidad de edición/encuadre, pruebas de modelo GLB real, sincronía de perspectiva CSS-WebGL, rendimiento y objetos animados, evitando repetir trabajo hecho.
- Evaluar curvas más naturales y suavizados **secundarios** sin perder determinismo del Director. No aplicar sin revisión el parche histórico de hardening.

### Repositorios y referencias EXACTAS enviadas por el usuario
- **Dollycurve:** https://github.com/jtydhr88/dollycurve  
  Propósito: Editor visual de curvas de cámara y manipulación espacial; usar ideas UX, no reemplazar el Director de Scroll
- **Theatre.js:** https://github.com/theatre-js/theatre  
  Propósito: Herramientas de timeline y animación visual como referencia de interfaz, no usar como motor alternativo
- **Three-CurveEditor:** https://github.com/felixmariotto/three-CurveEditor  
  Propósito: Edición de curvas, puntos y handles 3D
- **Three.js Journey / Scroll based animation:** https://threejs-journey.com/lessons/scroll-based-animation  
  Propósito: Arquitectura de escena WebGL ligada al scroll
- **Codrops / scroll reactive gallery:** https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/  
  Propósito: Respuesta visual a velocidad, damping posterior a la pose, estado target/current
- **ThreeJS_Animation_Scroll:** https://github.com/SRCarlo/ThreeJS_Animation_Scroll  
  Propósito: Estados/poses espaciales ligados al recorrido
- **CodeSandbox scroll controls camera paths 1:** https://codesandbox.io/s/scrollcontrols-gltf-scroll-range-camera-paths-04h1c  
  Propósito: Prueba de caminos de cámara y CatmullRomCurve3
- **CodeSandbox scroll controls camera paths 2:** https://codesandbox.io/s/scrollcontrols-gltf-scroll-range-j836i  
  Propósito: Prueba de recorrido por scroll y CatmullRomCurve3

### Archivos históricos de cámara recuperados
- `materiales_recuperados/nagweb-camera-hardening.patch`, copia original accesible; **no aplicarlo ciegamente** porque puede estar ya integrado, superado o parcialmente incorporado.
- Biblioteca de esta cuenta: `Texto pegado(3).txt` (documento técnico de cámara completo, incluido en `fuentes_originales`), `Informe_visual_camara_3D_NagWeb_2026-10-08.pdf`, `Recreaciones_visuales_NagWeb_Camara_3D.zip`.
- Todas las referencias sirven de investigación de UI/matemática. **NO introducir un segundo progreso de scroll:** Director de Scroll 0→1 es dueño de la animación. Damping/reacciones secundarias solo después de la pose determinista. Diferenciar objetos 3D reales de overlays CSS. No suponer que los enlaces de sandboxes siguen activos sin verificarlos.

## Reglas para continuar sin pérdida ni duplicación

- **Fuente de verdad del código:** el HEAD de la rama propia en GitHub, no este documento, ni el título de un chat, ni un ZIP histórico. Comprobar HEAD, últimos cambios y CI antes de editar.
- **Fuente de verdad del contexto de producto:** este archivo y las referencias originales; registrar cambios de requisitos y enlaces nuevos aquí al cerrar una etapa, sin inventar información histórica.
- No renombrar los cinco frentes ni cruzar desarrollos. No escribir en `main`, fusionar ramas, desplegar en Vercel ni cambiar a Work por iniciativa propia. Antes de un push, tener en cuenta CI y cualquier autodeploy.
- No hacer auditorías repetidas e infinitas ni microetapas artificiales. Tras la primera comprobación, elegir trabajo de mayor impacto; implementar, verificar con pruebas relevantes y entregar un resultado concreto con el commit SHA o explicar qué lo bloqueó.
- No declarar exitosas pruebas no ejecutadas ni inferir completitud de porcentajes o cantidad de commits.
- Si hace falta un original (video, HAR, captura, ZIP, imagen), buscarlo por el nombre exacto en la Biblioteca de archivos o pedir solo ese archivo. **El enlace o el nombre del archivo no equivale a tener su contenido visual.**
- Mantener cambios técnicos separados, preferentemente sin sobrescribir archivos compartidos en paralelo. La integración entre frentes se planificará y aprobará aparte.
- Al recibir `Avanza`, continuar el desarrollo **de este único proyecto**, no responder solo con otro plan. Entregar: resultado, prueba, commit, pendiente más importante, y si el usuario tiene que hacer algo.


## Actualización y trazabilidad

- Este documento se debe **actualizar cuando cambien objetivos, decisiones, enlaces o bloqueos importantes**. Mantener URLs completas, fecha y, si se conoce, procedencia de cada referencia.
- El README/commit de la rama conserva detalles técnicos. Este documento conserva el **por qué, qué y con qué referencias**.
- No agregar aquí capturas o HAR con tokens; los originales se mantienen en archivos privados con nombre, nunca como copia indiscriminada al repositorio público.
- Documento versionado en esta rama. Actualizarlo con decisiones relevantes y nuevos enlaces, sin disparar despliegues manuales innecesarios.
- Para comenzar un nuevo chat: indicar el identificador del proyecto, esta rama y la ruta de esta ficha en GitHub; pedir lectura del HEAD y documentación técnica. Adjuntar originales solo si son necesarios. El inventario global es opcional.
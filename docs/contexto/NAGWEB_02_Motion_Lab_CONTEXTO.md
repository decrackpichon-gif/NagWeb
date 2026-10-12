# NAGWEB 02 | Motion Lab

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

## Identidad inmutable y ramas

- Proyecto: **NAGWEB 02 | Motion Lab**.
- Producto general: **NagWeb**, repositorio [https://github.com/decrackpichon-gif/NagWeb](https://github.com/decrackpichon-gif/NagWeb).
- Rama propia de desarrollo: [`internal-motion-lab`](https://github.com/decrackpichon-gif/NagWeb/tree/internal-motion-lab).
- HEAD de referencia (09/10/2026): [`b857f1f700dc4286b6ec96a4aa39140041f6a083`](https://github.com/decrackpichon-gif/NagWeb/commit/b857f1f700dc4286b6ec96a4aa39140041f6a083). **Puede cambiar** mientras otros chats trabajan.
- Rama auxiliar histórica `internal-motion-lab-film-totem`. **No usarla como rama principal** ni fusionarla automáticamente.

## Documentación técnica ya existente en GitHub

- [`docs/storytelling-engine-v2.md`](https://github.com/decrackpichon-gif/NagWeb/blob/internal-motion-lab/docs/storytelling-engine-v2.md) (documentación heredada compartida, no manual exclusivo de esta rama)

Esos documentos **ya existen** en sus ramas y suelen tener muchos más detalles de implementación. Consultarlos antes de planificar. Esta ficha agrega el contexto de producto, las referencias y la política de continuidad que faltaban.

## Objetivo final

Una herramienta para elegir, **previsualizar y editar animaciones antes de insertarlas** en NagWeb, tomando [Animos](https://animos.app/editor) como referencia funcional, no como licencia para copiar su código. Debe permitir personalizar presets, cambiar imágenes/textos/fondo, posicionar elementos con mouse, guardar una composición editable, insertarla en NagWeb y mantenerla funcional en la exportación. Debe servir también **fuera del Director de Scroll** con reproducción loop, cuando corresponda.

## Trabajo y decisiones conocidos

- En la rama se trabajaron composiciones de imagen y movimiento como Showcase Stream, Iso Orbit, Film Strip, Card Totem, Feed Scroll, Fan Shuffle y Scatter Dial.
- La última confirmación identificada aborda redimensionar waypoints de Scatter Dial directamente en el lienzo (`b857f1f...`). La CI asociada había terminado exitosamente.
- UX importante: vista sin fondo, tamaño de imágenes generoso, controles legibles, escala y rotación directas con mouse, controlar scroll/loop y no detener la animación al guardar cambios.

## Próximas prioridades (revisar con HEAD actual)

- Auditar las últimas funciones realmente terminadas en `internal-motion-lab` antes de retomar una plantilla: no reconstruir Scatter Dial, Showcase Stream o Iso Orbit por desconocimiento.
- Mejorar consistencia entre todas las animaciones, un solo inspector razonable y flujo previsualizar→editar→insertar→reeditar→exportar.
- Usar el HAR y los videos **como referencias** y no afirmar que un comportamiento coincide con Animos sin comparación visual real. Revisar permisos/licencias antes de cualquier reutilización literal.

### Fuentes originales y materiales del Motion Lab
- **URL original del usuario:** https://animos.app/editor . Referencia de UX, catálogo, vista previa y edición. No sustituye la necesidad de analizar el material capturado.
- **HAR original recuperado:** `materiales_recuperados/animos har.har` del 2/10/2026, **incluido en el paquete de recuperación**. Contiene 24 solicitudes de red y copias capturadas de bundles JavaScript y CSS que incorporan cadenas como Iso Focus, Showcase Stream, Iso Orbit, Orbit Bloom, Scatter Dial, Card Tunnel y Grid Reveal. El número 64 plantillas figura en informes previos, pero no equipares las 24 solicitudes a cantidad de animaciones.
- **Índice de recursos públicos del HAR:** `referencias/ANIMOS_INDICE_HAR_PUBLICO.json` (sin cabeceras ni parámetros). El HAR debe tratarse como material de referencia, NO copiar código de terceros automáticamente ni reproducir restricciones/licencias sin revisión.
- **Videos originales localizados en Biblioteca, no incluidos por tamaño:** `Grabación de pantalla 2026-10-04 122158.mp4`, `Grabación de pantalla 2026-10-04 122504.mp4`, `animo-showcase-stream-720p.webm`.
- Hay otros videos/capturas en conversaciones previas cuyo contenido y disponibilidad no han podido verificarse íntegramente.
- **Rama de Motion Lab:** https://github.com/decrackpichon-gif/NagWeb/tree/internal-motion-lab . Si hace falta observar el diseño exacto de Animos o vídeos originales, buscar estos archivos por nombre en la Biblioteca, pedir al usuario adjuntarlos o usar los que haya adjuntado. Nunca afirmar que los viste sin abrirlos.

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

## Decisión de prioridades confirmada por el usuario (11/10/2026)

1. **Primero** incorporar las animaciones existentes del catálogo de Animos que falten en Motion Lab. Para cada una, implementar en **un avance sustancial** los controles originales que hayan podido verificarse, edición, preview, inserción y exportación, sin multiplicar pasos innecesariamente.
2. **Después** sumar controles propios de NagWeb cuando agreguen valor real y estén explícitamente identificados como adicionales. No extender indefinidamente un preset existente.
3. **Finalmente** diseñar e incorporar animaciones inéditas, pensadas específicamente para NagWeb.

**Hito:** se incorporó la composición **Grid Dive** en `internal-motion-lab`, commit [749f986](https://github.com/decrackpichon-gif/NagWeb/commit/749f986f9eca53a6715fc38ff395b0d4cda40bc4). El nombre fue corroborado en el catálogo de Animos, pero no se contó con la referencia visual ni con sus controles originales. La animación de NagWeb es provisional e interpretativa y **no debe presentarse como reproducción fiel de Animos**. Sus parámetros específicos son propios. Incluye motor, editor, integración de preview/exportación y pruebas de modelo; smoke de navegador en la ejecución [38188030828](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38188030828), aún sin resultado al documentarlo.

**Próxima animación del catálogo que falta:** Pop Parade; obtener antes su movimiento y controles mediante la fuente original. No mezclar esto con NAGWEB 01, 03, 04 ni 05.

### Pop Parade: implementación de keyframes (11/10/2026)

- Referencia pública: https://animos.app/editor?scrollTo=multiscene incluye «Pop Parade», pero no fue posible comprobar sus movimientos ni los controles internos con las fuentes públicas disponibles. **No afirmar fidelidad visual ni presentar controles propios como originales**.
- Para no inventar un nuevo motor, se preparó una composición basada en los keyframes del Director existente: 12 carteles reemplazables, entradas por turnos, profundidad y cambios de escala, edición directa y flujo genérico de insertar/guardar/exportar. Se considera una **interpretación provisional** hasta obtener video o inspector real.
- Mantener como prioridad la incorporación de plantillas verificables de Animos por lotes completos, seguida por personalizaciones propias y animaciones inéditas. No realizar despliegues Vercel ni fusionar ramas automáticamente.

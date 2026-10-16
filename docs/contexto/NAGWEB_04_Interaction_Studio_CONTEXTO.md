# NAGWEB 04 | Interaction Studio (contexto para rama experimental)

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

**ATENCIÓN: copia de continuidad para la rama experimental.** Esta rama de trabajo es `feat/interaction-engine-experimental-v1`, no la rama estable de esta ficha. Primero leer `docs/interaction-engine-experimental-v1.md` y comprobar su HEAD y pruebas. No fusionar la experimental con la estable ni con main. Las referencias al HEAD estable que aparecen abajo son antecedentes, no el estado de la rama experimental.

## Identidad inmutable y ramas

- Proyecto: **NAGWEB 04 | Interaction Studio**.
- Producto general: **NagWeb**, repositorio [https://github.com/decrackpichon-gif/NagWeb](https://github.com/decrackpichon-gif/NagWeb).
- Rama propia de desarrollo: [`feat/interaction-engine-v1`](https://github.com/decrackpichon-gif/NagWeb/tree/feat/interaction-engine-v1).
- HEAD de referencia (05/10/2026): [`b20695f9a7756931683b7bd39d248bae41a45e0e`](https://github.com/decrackpichon-gif/NagWeb/commit/b20695f9a7756931683b7bd39d248bae41a45e0e). **Puede cambiar** mientras otros chats trabajan.
- Rama experimental **separada** `feat/interaction-engine-experimental-v1` (HEAD conocido `1cc2ed602620705c1bb0fff3f812a83316dec18a`), contiene V4-C.1 y Scene Composer. No mezclar con estable por defecto.

## Documentación técnica ya existente en GitHub

- [`docs/interaction-engine-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/interaction-engine-v1/docs/interaction-engine-v1.md)
- [`docs/interaction-engine-experimental-v1.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/interaction-engine-experimental-v1/docs/interaction-engine-experimental-v1.md) (leer en rama experimental)

Esos documentos **ya existen** en sus ramas y suelen tener muchos más detalles de implementación. Consultarlos antes de planificar. Esta ficha agrega el contexto de producto, las referencias y la política de continuidad que faltaban.

## Objetivo final

Herramienta para **animación de personajes 2.5D e interacción orgánica con mouse**, con deformaciones fluidas, ojos/seguimiento, influencia física sobre elementos cercanos, y composición completa de escena: fondo, imágenes, textos, botones, formas y controles por elemento. Poder exportar/importar sesión y preparar futura integración con NagWeb sin contaminar el editor principal.

## Trabajo y decisiones conocidos

- Motor follower e interacción orgánica (Mesh V3 como baseline validado), presets, targets personalizados, animación y preparación de imágenes. El test de la rama estable había terminado exitosamente en `b20695f...`.
- Rama experimental contiene V4-C.1 y Scene Composer V1 con capas, posición, escala, z-index, opacidad y ajuste de influencia por elemento.
- Feedback humano importante: evitar líneas en V, cruce de cabeza sobre cuello, pixelado interno, roturas en curvas fuertes y cambios que resten fluidez. Algunos problemas fueron corregidos en prototipos pero comprobar **la versión que corresponda**.
- Archivo de prueba `ponjita.png` y varios ZIP V3/V4 históricos, no confundir con HEAD de GitHub.

## Próximas prioridades (revisar con HEAD actual)

- Comparar experimental V4-C.1 con V3 estable de manera reproducible y visual; no fusionar o sustituir sin decisión explícita del usuario.
- Completar flujo del constructor de escena, editar texto y elementos, selección de objetivos y explicación clara de «restaurar ajustes».
- Mantener calidad de deformación orgánica con límites geométricos y buen rendimiento; preparar contrato de integración futuro.

### Repositorios y referencias EXACTAS enviadas por el usuario
- **Creature_WebGL:** https://github.com/kestrelm/Creature_WebGL  
  Propósito: Skeletal animation/deformación orgánica en WebGL
- **pixi-live2d-display-webgal:** https://github.com/OpenWebGAL/pixi-live2d-display-webgal  
  Propósito: Integración de Live2D en un renderer Pixi
- **PixiJS:** https://github.com/pixijs/pixijs  
  Propósito: Mallas, SimplePlane/Rope y rendering interactivo
- **ghost-arcade:** https://github.com/riskcapital/ghost-arcade  
  Propósito: Referencia experimental compartida por usuario; revisar aplicación precisa
- **MeshWarp-Aseprite:** https://github.com/csmct99/MeshWarp-Aseprite  
  Propósito: Deformación de mallas/warp sobre imagen
- **threejs-path-flow:** https://github.com/zz85/threejs-path-flow  
  Propósito: Deformación/posicionamiento siguiendo trayectorias
- **DQS gist:** https://gist.github.com/benanil/796858458123db44d5266e595eef3009  
  Propósito: Referencia de dual quaternion skinning
- **dualQuaternionSkinning:** https://github.com/ishmeetkohli/dualQuaternionSkinning  
  Propósito: Skinning y articulaciones con rotaciones mejoradas
- **webgl-skinning-gpu-instancing:** https://github.com/takumifukasawa/webgl-skinning-gpu-instancing  
  Propósito: GPU skinning y rendimiento
- **stretchystudio:** https://github.com/MangoLion/stretchystudio  
  Propósito: Elasticidad/deformaciones editables de personajes
- **Surface-Heat-Diffuse-Skinning:** https://github.com/meshonline/Surface-Heat-Diffuse-Skinning  
  Propósito: Pesos/propagación de skinning

### Materiales y decisiones recuperados
- Archivo de referencia del usuario `ponjita.png` (imagen vertical de prueba) está localizable por nombre en la Biblioteca, **no incluido dentro del paquete**.
- Archivos originales incluidos aquí: `materiales_recuperados/NagWeb_Interaction_Studio_Checkpoint.zip` y `materiales_recuperados/NagWeb_V4C1_ThicknessGuard.zip` (prototipos históricos; no confundir con versión más reciente ni fusionar por defecto).
- Otros originales de la Biblioteca: `NagWeb_Interaction_Studio_V3.zip`, `NagWeb_V3_RealContent.zip`, `NagWeb_V4_AB.zip`, `NagWeb_V3_vs_V4B_WeightedCurve.zip`, `NagWeb_V3_vs_V4C_AdaptiveCurve.zip`, `NagWeb_V4C_Adaptive.zip`, `interaction-studio-test-kit.zip`, `nagweb_cursor_fish_demo.html`.
- Archivo de arquitectura integral recuperado `fuentes_originales/Markdown pegado.md` documenta motor orgánico, objetivos, grupos, Scene Composer, exportación e integración futura.
- Referencias conceptuales adicionales (nombres, no URL original recuperable): Live2D ArtMesh/Warp/Rotation Deformer; PixiJS Mesh/SimplePlane/Rope; Three.js PlaneGeometry/SkinnedMesh; FFD/lattice y mesh skinning. Estudiar lo necesario para deformaciones naturales sin romper siluetas.
- **Requisito original:** escena con fondos, imágenes, textos, botones y selección de objetivos personalizables por influencia. Separar experimental de estable y trabajar aislado hasta decidir integración.

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
- Documento versionado en esta rama experimental. Actualizarlo con decisiones relevantes sin alterar la estable.
- Para chat nuevo que trabaje experimental: indicar la rama experimental y leer este contexto más `docs/interaction-engine-experimental-v1.md`. Adjuntar originales solo cuando sea necesario.
## Avance 11/10/2026 · continuidad experimental

El laboratorio A/B conserva V3 y V4-C.1 separados e incorpora recorridos repetibles y mediciones exportables. Se fortalece la carga de imágenes para descartar preparaciones obsoletas al alternar personajes. La comparación humana con `ponjita.png` sigue pendiente. Para ahorrar compilaciones de Vercel en las dos ramas de Interaction Studio se configuró en el proyecto Vercel `nag_web` un Ignored Build Step por `VERCEL_GIT_COMMIT_REF`, sin desactivar las otras ramas; verificar efectividad tras el push.

### Protección transversal V4-C.1 y validación (11/10/2026)

En la rama experimental se añadió una protección de deformación transversal de la malla, activada en V4-C.1 cuando `thicknessGuard` está activo. Usa el perfil alpha para limitar el desplazamiento del borde interior en curvas pronunciadas; no modifica la spine ni las UV. La opción `meshFoldGuard` queda desactivada por defecto en V4-B y no toca V3. El laboratorio A/B exporta `meshLimitedColumns` y `meshMinScale`. Este guard reduce riesgos locales, pero no garantiza ausencia global de solapamiento de triángulos: resta evaluar visualmente con `ponjita.png` y otros assets reales.

El primer test de navegador de carga/cancelación tenía dos falsos fallos: evaluaba sólo el desplazamiento final de un recorrido y retenía accidentalmente el análisis del canvas interno al simular preparaciones asíncronas. Ambas pruebas se corrigieron con seguimiento del recorrido completo y un stub limitado a imágenes seleccionadas. GitHub Actions terminó **success** en https://github.com/decrackpichon-gif/NagWeb/actions/runs/38193935552 (commit `a505de9a18f9bb2d402837a67172545348497233`), incluyendo modelos, navegador Chromium y kit de pruebas. Vercel registró la compilación de la rama experimental como `CANCELED` por la configuración de Ignored Build Step, sin despliegue de preview finalizado.

### Hito: diagnóstico de geometría real V4-C.1

El laboratorio A/B expone inversión de triángulos, casi colapsos y área mínima de la malla por muestra, y GitHub Actions archiva capturas de tres momentos del recorrido más el informe JSON. El diagnóstico es opt-in únicamente en el laboratorio; no sustituye evaluación humana ni toca V3 estable. El paquete de prueba humano ahora incluye el script A/B. La imagen original `ponjita.png` sigue pendiente de acceso y no debe añadirse al repositorio público.

### Scene Composer V1.2 · manipulación directa en lienzo

El constructor experimental admite redimensionamiento y rotación con tiradores de mouse sin depender de campos numéricos; el inspector conserva la sincronización. `Shift` permite mantener proporción en resize y ángulos de 15° en rotación. La casilla de bloqueo impide arrastrar/transformar accidentalmente un objeto. Estas transformaciones continúan guardándose en el JSON existente, sin cambiar su esquema ni tocar la rama estable. Siguiente criterio: validar la ergonomía en una escena real y estudiar controles de zoom para lienzos grandes.

### Scene Composer V1.3 · navegación y separación de coordenadas

Se agregó navegación visual al constructor experimental: zoom 25–250 %, encajar, volver a 100 %, zoom con Ctrl/Cmd+rueda y paneo Espacio+drag o mouse central. El stage conserva las unidades del JSON, mientras una capa de medición inversa evita descoordinar puntero, renderer y alcance de influencia. Se comprueba automáticamente zoom sin mutación del documento, gestos a escala y estabilidad de instancia. La prioridad de validación humana será calidad del zoom/paneo y reacción del personaje con `ponjita.png`; pedir esa prueba sólo cuando se disponga de un kit probado.

## Política permanente de despliegues (12/10/2026)

**Vercel se usa solo si el usuario solicita expresamente una publicación.** Esta rama tiene `vercel.json` con `git.deploymentEnabled: false` para evitar que commits, pruebas, documentación y actualizaciones de datos consuman Deployment Storage. Ejecutar QA local o en GitHub Actions, sin llamar a Vercel como parte de un avance normal. No quitar ni cambiar esa configuración, tampoco en ramas derivadas, salvo autorización explícita. `[skip ci]` no bloquea Vercel. No eliminar despliegues existentes ni modificar el proyecto de Vélez Data. Mantener esta decisión cuando se actualice el contexto.

## NAGWEB 04 · Alcance cerrado V1.0 (15/10/2026)

**Prioridad sobre planes anteriores:** terminar la primera versión usable y estable. No proponer nuevos motores, herramientas, presets, diagnósticos o retoques opcionales antes de cumplir esta definición. Conservar V3 estable y los prototipos V4-C.1, sin merges ni despliegues manuales.

**Producto V1.0:** constructor de escenas interactivo local y portable. Cargar un personaje, verlo seguir el mouse con movimiento orgánico, crear una escena con fondo, texto, botón, imagen y forma, seleccionar qué elementos reaccionan, editar su posición/tamaño/rotación y guardar/reabrir el proyecto completo.

**Ya implementado en código y probado:** motor follower, preparación de imágenes y V3 de referencia; V4-C.1 experimental; Composer con capas, edición en lienzo, controles de influencia, zoom y exportación/importación JSON de elementos. La última batería automatizada de funcionalidad es https://github.com/decrackpichon-gif/NagWeb/actions/runs/38265721797 y terminó exitosa. Esa batería **no** valida la persistencia del personaje ni sustituye la evaluación visual con PNG real.

**Bloqueante real confirmado:** el Composer carga el personaje mediante URL temporal, pero no guarda la imagen en scene.character.source. Al importar el JSON se restaura el modelo y los controles de UI pero no se reconstruye la imagen ni se sincronizan por completo los parámetros del renderer. La exportación actual no garantiza reabrir el mismo proyecto. Resolver restauración íntegra del personaje y opciones de escena en un bloque. Proteger la carga asíncrona contra resultados antiguos si es relevante al corregir el flujo.

**Criterios de aceptación finitos:**
1. Cargar personaje propio, preferentemente PNG transparente, y obtener seguimiento orgánico y reacción de elementos sin defectos graves.
2. Crear y editar escena con fondo, imagen, texto, botón y forma; seleccionar objetivos de influencia y conservar drag, resize, rotate, bloqueo y zoom existentes.
3. Exportar e importar **todo el proyecto**, incluida la imagen de personaje y sus opciones, sin depender de URLs temporales que se pierdan al reiniciar.
4. Validar una única secuencia de punta a punta: abrir, cargar imagen, componer, interactuar, exportar, volver a abrir e importar; comprobar integridad, errores de archivo y el riesgo de cargas rápidas.
5. Generar ZIP portable con instrucciones correctas y enlace de descarga comprobado; pedir una sola prueba humana del candidato completo con personaje real, y declarar V1.0 terminada si cumple lo anterior.

**Fuera del alcance V1.0, para V1.1+:** más motores orgánicos, perfeccionamiento indefinido de curvas, nuevos presets, nuevos controles, zoom más elaborado, efectos, variantes de estética, más formatos de exportación e integración con NAGWEB 01. No borrar nada existente: simplemente no convertir esas mejoras en requisitos para el cierre.

**Camino mínimo:** siguiente «Avanza» corrige persistencia de personaje y rehidratación real; una pasada integral de QA y kit final; única evaluación humana visual si hace falta, luego cierre. No generar nuevas microetapas ni porcentajes de avance inventados.

**Descarga:** el enlace anterior al artefacto GitHub no abrió para el usuario. La run 38265721797 conserva su artefacto ZIP sin expirar, recuperado y comprobado. Entregar archivos mediante enlace de descarga verificado en el chat, no únicamente URLs directas a artefactos sujetos a permisos/vencimiento.

### Avance V1.0 · Corrección de persistencia del personaje

Implementado guardado de fuente embebida y restauración del renderer al importar la escena. El modelo mantiene el esquema V1. Se eliminó dependencia de blob URL para personaje y se añadieron guardas generacionales para evitar reemplazos por cargas antiguas; una carga/importación inválida conserva el proyecto existente. La prueba de navegador debe incluir recarga real y comparación del JSON íntegro, opciones de motor e influencia. Siguiente objetivo **único**: comprobar GitHub Actions y entregar kit V1.0 portable; solicitar test humano del candidato sin ampliar funcionalidades.


### Candidato V1.0 · persistencia integral comprobada (16/10/2026)

Commit funcional `4be94dd1cbfeebcba09a74af1930a465fe3527c3`: los recursos del personaje se guardan en `scene.character.source` como data URI portable. Aplicar proyecto desde JSON rehidrata análisis, textura y renderer, tamaño, preset, objetos y opciones de influencia. Una fuente inválida conserva la escena existente; se descartan cargas asíncronas obsoletas.

GitHub Actions https://github.com/decrackpichon-gif/NagWeb/actions/runs/38905031406: SUCCESS, modelo, navegador Chromium (incluye cambio de imagen, exportación, recarga de página, reimportación y comprobación de identidad del JSON), y kit de prueba. El artefacto `interaction-studio-test-kit` ID `12048555244` se descargó como ZIP y pasó verificación de integridad (22 archivos). Para entrega del chat se expuso `NAGWEB_04_Interaction_Studio_V1_Candidato.zip`.

**Estado:** candidata V1.0 lista para aceptación manual, NO declarar final todavía. Única validación pendiente: usuario carga su propio personaje (p. ej. `ponjita.png`), mueve el mouse, crea/modifica una escena, exporta el JSON a archivo local y vuelve a abrir el Composer importándolo. Confirmar movimiento fluido, ausencia de defectos graves y persistencia de imagen. Si pasa, se puede cerrar V1.0 sin nuevas funciones ni mejoras opcionales. No merge con estable ni despliegue Vercel salvo autorización.

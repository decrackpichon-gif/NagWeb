# NAGWEB 04 | Interaction Studio

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

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
- Documento versionado en esta rama. Actualizarlo con decisiones relevantes y nuevos enlaces, sin disparar despliegues manuales innecesarios.
- Para comenzar un nuevo chat: indicar el identificador del proyecto, esta rama y la ruta de esta ficha en GitHub; pedir lectura del HEAD y documentación técnica. Adjuntar originales solo si son necesarios. El inventario global es opcional.
## Política permanente de despliegues (12/10/2026)

**Vercel se usa solo si el usuario solicita expresamente una publicación.** Esta rama tiene `vercel.json` con `git.deploymentEnabled: false` para evitar que commits, pruebas, documentación y actualizaciones de datos consuman Deployment Storage. Ejecutar QA local o en GitHub Actions, sin llamar a Vercel como parte de un avance normal. No quitar ni cambiar esa configuración, tampoco en ramas derivadas, salvo autorización explícita. `[skip ci]` no bloquea Vercel. No eliminar despliegues existentes ni modificar el proyecto de Vélez Data. Mantener esta decisión cuando se actualice el contexto.

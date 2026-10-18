# NAGWEB 05 | Biblioteca de recursos

## Criterio universal de aceptación real (16/10/2026)

**Decisión posterior a todos los estados históricos de V1.0:** seguir la [política de recuperación y aceptación](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md). Para **NAGWEB 05 | Biblioteca de recursos**, preservar avances reales de esta rama; cualquier fallo reportado del flujo principal deja el frente *no aceptado*, incluso con CI verde o una entrega técnica histórica. Validar el mismo mecanismo de apertura y artefacto que recibe el usuario y el ciclo de interacción, edición, recarga y exportación antes de declarar *V1.0 aceptada* tras confirmación real. No reconstruir ni mezclar ramas ni fabricar tareas opcionales. **Este cambio documental no constituye una auditoría funcional ni aceptación manual.**


> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

## Directiva máxima de producción: versión 1.0 primero (15/10/2026)

**Decisión general del usuario, prioritaria también para este frente:** terminar una V1.0 **estable, funcional y entregable**, en el menor tiempo y con la menor cantidad de trabajo innecesario. Congelar el alcance en el recorrido esencial, resolver bloqueantes reales de manera transversal, ejecutar la comprobación final pertinente y **cerrar la versión**. No proponer nuevas funciones, recursos, efectos, opciones, controles ni tareas de pulido no bloqueantes antes del cierre; registrarlas como V1.1+.

Esta regla **prevalece sobre prioridades antiguas de expansión** de esta ficha, sin derogar funcionalidades comprometidas que resulten imprescindibles para una V1.0 útil. Consultar la [política universal de desarrollo](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md). No mezclar ramas ni adelantar merges o despliegues sin autorización.

## Alcance cerrado de NAGWEB 05 para V1.0 (15/10/2026)

**Decisión operativa vinculante:** usar `tools/resource-etl/CRITERIOS_CIERRE_V1.md` como contrato finito de aceptación. Priorizar el recorrido completo de la Biblioteca con los adaptadores YA implementados; no añadir recursos, familias, controles ni mejoras no bloqueantes. Los 721 ítems de consulta/código no requieren un adaptador nativo para cerrar V1.0; conservarlos identificados y accesibles. Las capacidades ampliadas siguen pendientes de V1.1+, no descartadas.

**Bloqueante comprobado:** la ejecución `38749872518` aprobó Chromium Linux, Self test y Windows smoke, pero falló Chromium Windows cuando un evento sintético de doble clic SVG no abrió la personalización. Comprobar si falla el producto o la simulación; después CI completa, una aceptación manual representativa y entrega. No declarar lista la V1.0 antes de esas evidencias.

**Esta sección prevalece sobre las listas antiguas de «próximas etapas» de más abajo.** No reconstruir capacidades, no abrir un nuevo plan, no confundir registros de catálogo con componentes plenamente editables.

## Identidad inmutable y ramas

- Proyecto: **NAGWEB 05 | Biblioteca de recursos**.
- Producto general: **NagWeb**, repositorio [https://github.com/decrackpichon-gif/NagWeb](https://github.com/decrackpichon-gif/NagWeb).
- Rama propia de desarrollo: [`feat/resource-etl-v1`](https://github.com/decrackpichon-gif/NagWeb/tree/feat/resource-etl-v1).
- HEAD de referencia (11/10/2026): [`620535886697dddbedf98cf2addf164fe250ce1f`](https://github.com/decrackpichon-gif/NagWeb/commit/620535886697dddbedf98cf2addf164fe250ce1f). **Puede cambiar** mientras otros chats trabajan.
- Rama de datos independiente `resource-vault-data` con historia Git separada; no compararla ni mergearla ciegamente con `main`.

## Documentación técnica ya existente en GitHub

- [`tools/resource-etl/README.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/resource-etl-v1/tools/resource-etl/README.md)

Esos documentos **ya existen** en sus ramas y suelen tener muchos más detalles de implementación. Consultarlos antes de planificar. Esta ficha agrega el contexto de producto, las referencias y la política de continuidad que faltaban.

## Objetivo final

Biblioteca offline-first de **recursos abiertos/licenciados** para diseñadores. Flujo completo **Buscar → Previsualizar → Personalizar → Insertar → Editar en el lienzo → Guardar → Exportar**, con recursos reales, seguridad, rendimiento y compatibilidad. Los recursos deben conservar identidad y configuraciones editables; no coleccionar plantillas que no puedan utilizarse.

## Trabajo y decisiones conocidos

- ETL (extracción, transformación, validación, carga), Vault persistente, metadatos de licencias/dependencias, categorías, búsqueda y previsualización.
- Controles funcionales de SVG y HTML/CSS Uiverse, adaptación de recursos y aislamiento seguro de embeds; pruebas de browser con Chromium y CI.
- Progreso posterior a los textos históricos de etapa 75 y al paquete V2 de etapa 79: el README de la rama incorpora **etapa 83**: inserción nativa de HTML/SVG dentro de contenedores seleccionados. HEAD verificado 11/10/2026 `6205358...`.
- El README documenta también etapas 80-82 y panel de anchura personalizada. Leerlo para no repetir implementaciones.

## Próximas prioridades (revisar con HEAD actual)

- Verificar el estado actual después de la etapa 83, incluyendo tests y CI del HEAD; no afirmar que pasó CI para este último commit sin comprobarlo.
- Priorizar integración completa del recurso editable en el editor, contenedores, responsive, persistencia/exportación, accesibilidad y seguridad.
- Licencias: restricciones documentadas sobre Animate.css, Hover.css, Aceternity y scraping masivo de LottieFiles Community; no alterar la política legal sin revisar fuente/licencia.
- Tratar familias React/Three/GLSL/Lottie según capacidades reales; no anunciarlas compatibles sin preview, inserción y pruebas.

### Referencias de origen y licencias recuperadas
- **Repositorio propio:** https://github.com/decrackpichon-gif/NagWeb (código de ETL en rama `feat/resource-etl-v1`; snapshots en rama independiente `resource-vault-data`).
- **Fuentes citadas en los textos históricos:** Poly Haven, ambientCG, PMNDRS Market, Kenney, Shadcn, Lucide, Magic UI, Motion Primitives, AnimXYZ, HyperUI, CSSShake, GLSL Noise, Uiverse, SpinKit, Magic CSS y Lottie local. **No se pudieron extraer de los mensajes originales los enlaces individuales para cada una.** No adjudicarles falsamente enlaces supuestamente pasados por usuario.
- **Fuente Uiverse documentada:** identificador `uiverse-io/galaxy` en textos históricos, revisar manifest/condiciones/licencia por recurso antes de redistribuir.
- **Prohibiciones de licencia documentadas:** NO reactivar en espejo automático Animate.css, Hover.css, Aceternity ni scraping masivo de LottieFiles Community sin nuevo análisis de licencias/derechos.
- **Fuente de verdad documental recuperada:** `fuentes_originales/Texto pegado(4).txt` (plan original detallado), `fuentes_originales/Texto pegado(7).txt` y `Texto pegado(8).txt` (documentos de continuidad con etapa 75). **Obsoletos en cuanto a HEAD y etapa:** revisar README en GitHub, que documenta al menos etapa 79.
- Hay que seguir código real en el repo y documentos históricos sin inventar fuentes que nunca fueron confirmadas.

## Materiales todavía no recuperados aquí
- Parte de los enlaces y mensajes contenidos en chats que la interfaz no abre.
- Adjuntos adicionales y capturas de chats no indexados; no asumir que todos están localizados.
- Los archivos y modificaciones mantenidos únicamente dentro de un Work sin commit/push o sin archivos descargables.
- Envíos originales de videos o HAR posteriores al primero de Animos, si existieron.

## Qué debe hacer el próximo chat
- Trabajar sobre **solo** su rama y leer el anexo integrado en su prompt.
- Antes de repetir una investigación, abrir referencias existentes y cruzar con código/commits actuales.
- Cuando necesite examinar recursos originales accesibles por nombre, buscar archivos en Biblioteca; distinguir encontrar un archivo de haber leído sus bytes.
- Registrar cada referencia nueva (URL exacta, fecha, proyecto y uso) en un archivo `REFERENCIAS_NAGWEB_0X.md` versionado dentro de la rama adecuada, sin tocar otros módulos. No afirmar que completó esa persistencia hasta hacer un commit real.

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
## Bloqueo de continuidad del 12/10/2026: etapa 84 no incorporada

- Se ensayó personalizar HTML/CSS Uiverse mediante un control contextual en el lienzo.
- Fallaron los recorridos integrales de Chromium Linux/Windows durante el intento; se detectó también una regresión de la edición SVG por doble clic.
- **Decisión:** restaurar el puente editor y las pruebas de navegador del último estado funcional aprobado (etapa 83, commit `620535886697dddbedf98cf2addf164fe250ce1f`). El intento de etapa 84 queda documentado, **no se considera completado**. No reaplicar los parches de los commits experimentales sin rediseño.
- Para HTML/CSS se mantiene la edición segura mediante el botón Personalizar de NagWeb. Para SVG permanece el doble clic y `Alt+Enter`.
- `vercel.json` define `git.deploymentEnabled["feat/resource-etl-v1"]=false` para evitar nuevas vistas previas de esta rama. Verificar periódicamente solo cuando cambie la configuración, sin desplegar manualmente.
- Próxima mejora: escoger otro mecanismo contextual estable que viva completamente en el editor anfitrión y se compruebe por pruebas realistas, sin afectar la captura de eventos del lienzo; o priorizar una mejora independiente de uso real antes de reintentar.

## Etapa 85: incorporar Heroicons (12/10/2026)

- Origen verificado: https://github.com/tailwindlabs/heroicons .
- Licencia: MIT, texto original https://github.com/tailwindlabs/heroicons/blob/master/LICENSE ,
  copyright © Tailwind Labs, Inc.; conservar texto completo por recurso.
- En la consulta había 324 SVG de `optimized/24/outline`. Únicamente la
  familia de contornos de 24 px puede incorporarse como vector nativo
  editable; excluir sólido/mini de este flujo.
- El importador se incorpora en la rama ETL sin tocar la historia independiente
  de snapshots `resource-vault-data`; materializar ese catálogo es un trabajo
  posterior. No desplegar Vercel.

## Etapa 86: materialización incremental Heroicons (12/10/2026)

- Se incorporó un generador para un paquete persistente Heroicons con SHA-256,
  licencia MIT y un límite mínimo de íconos válidos. Los contornos que no
  cumplan el adaptador SVG nativo se registran, no se insertan a la fuerza.
- Se agregó un workflow de publicación **incremental** en
  `.github/workflows/resource-heroicons-append.yml`: toma la historia propia
  de `resource-vault-data`, agrega exclusivamente el nuevo proveedor,
  recompone índice y biblioteca consolidados, comprueba integridad y hace
  push normal (sin force, sin merge). El trabajo de código continúa exclusivamente
  en `feat/resource-etl-v1`.
- Verificar resultado real del workflow, conteo final de recursos y manifest
  en GitHub antes de informar que el catálogo persistente se actualizó.
- Riesgo pendiente: el workflow anterior de reconstrucción completa,
  `resource-vault-snapshot.yml`, no incluye aún el nuevo proveedor. No
  ejecutarlo hasta adaptarlo para preservar Heroicons.

### Estado comprobado tras la publicación

- Workflow incremental de Heroicons: **success** (12/10/2026).
- HEAD publicado en `resource-vault-data`:
  `ed7104385f27982cb72959160e830c9b4ee65caf`.
- Catálogo persistente: **6762 recursos**, cinco paquetes; 323 Heroicons.
  Exclusión registrada: `bold`, contorno incompatible.
- El builder de manifiestos preserva ahora los Heroicons existentes durante
  futuras reconstrucciones completas, verificando su suma SHA-256 y
  deteniendo la operación ante errores. No se hizo despliegue Vercel.

## Etapa 88: vista visual liviana para Heroicons (12/10/2026)

- Decisión de UX: los íconos deben poder verse directamente en la grilla,
  no solo aparecer como nombres; usar sus trazos originales y no imágenes
  de un servidor externo, ni descargar los 6762 recursos al abrir la página.
- Implementación: `snapshot/browse-icon-paths.mjs` extrae únicamente
  coordenadas válidas de SVG normalizados. El índice consolidado guarda
  `previewPaths` para Heroicons, y la UI las dibuja como miniaturas
  inline con `stroke=currentColor` y ancho de 1,5.
- Pruebas: sanitización unitaria, Chromium con Heroicon en tarjeta,
  integración persistente y control de checksum de la publicación.
- La publicación incremental en `resource-vault-data` debe verificarse
  en GitHub; no asumir que el catálogo cambió solo por actualizar el código.

### Publicación comprobada de miniaturas (12/10/2026)

- La ejecución `Resource Vault Heroicons Append` concluyó `success`:
  https://github.com/decrackpichon-gif/NagWeb/actions/runs/38271989318
- HEAD de `resource-vault-data`:
  `2bdc6ecd62992065a2a7535973e3b0cf52fe8c90`.
- Total: **6762 recursos**, incluidos 323 Heroicons. Hash SHA-256 del
  índice ligero: `d58f2acb8f5525726458a02cf16556020dc93dfe28b2f5508039178e16902fca`.
- Las instantáneas originales de Uiverse, Lucide, Three.js y Core Code
  conservaron sus cantidades y checksums. Sólo cambiaron los índices
  consolidados y el paquete de Heroicons. No se desplegó Vercel.

## Etapa 89: Lucide con miniaturas visuales ligeras (12/10/2026)

- La Biblioteca extiende la visualización de formas reales desde Heroicons
  a los íconos Lucide del paquete persistente (1870 en el manifiesto).
- Sólo se incorporan geometrías permitidas y datos validados al índice
  comprimido; no se inyecta marcado arbitrario en el navegador. Las formas
  que usen construcciones SVG no soportadas permanecen listadas con su
  ficha original, pero sin miniatura.
- Política: **no reconstruir ni descargar de nuevo los paquetes fuente**
  para agregar miniaturas. El workflow
  `.github/workflows/resource-lucide-thumbnails.yml` recomputa los
  índices desde cinco snapshots verificados y comprueba hashes, conteos,
  unicidad, cobertura de miniaturas y preservación de Heroicons.
- Pruebas de navegador: dibujar Cámara con path + circle, conservando
  filtros/búsqueda de proveedor e inserción editable preexistente.
- Confirmar la ejecución y el nuevo commit de `resource-vault-data` antes
  de dar por publicada la miniatura; no ejecutar Vercel ni hacer merge.

### Publicación Lucide verificada (12/10/2026)

- Workflow de índice: **success** en
  https://github.com/decrackpichon-gif/NagWeb/actions/runs/38279036340 .
- HEAD de datos:
  `30199f6f5dd29931dfd082c62984aae07f5a751e`.
- Cobertura real: **1860/1870 Lucide** con miniatura visual segura;
  los 10 restantes preservan su ficha. Continúan los **323 Heroicons**
  y **6762 recursos** consolidados sin cambios en los archivos originales.
- Diagnóstico de Chromium: el test intentaba abrir la personalización
  inmediatamente después de `refresh()`, pero la vista previa se
  regenera con 480 ms de debounce. El test se sincroniza con el evento
  de carga del iframe para no introducir falsos errores intermitentes.

## Política permanente de despliegues (12/10/2026)

**Vercel se usa solo si el usuario solicita expresamente una publicación.** Esta rama tiene `vercel.json` con `git.deploymentEnabled: false` para evitar que commits, pruebas, documentación y actualizaciones de datos consuman Deployment Storage. Ejecutar QA local o en GitHub Actions, sin llamar a Vercel como parte de un avance normal. No quitar ni cambiar esa configuración, tampoco en ramas derivadas, salvo autorización explícita. `[skip ci]` no bloquea Vercel. No eliminar despliegues existentes ni modificar el proyecto de Vélez Data. Mantener esta decisión cuando se actualice el contexto.

## Etapa 90: carga bajo demanda del paquete de origen (12/10/2026)

- Problema comprobado: abrir la ficha de un único recurso ejecutaba
  `loadFullLibrary()` y descargaba el archivo combinado de 4,7 MB, aunque
  la búsqueda utilizaba un índice liviano.
- Decisión: guardar `snapshotId` en cada ficha compacta; cargar sólo el
  archivo del proveedor de origen con verificación SHA-256. Core Code reúne
  varios proveedores públicos y no debe resolverse por `source.provider`.
- Caché por hash/ruta/ID de snapshot, promesas compartidas y fallback seguro
  para índices antiguos. Una actualización de catálogo debe invalidar
  sólo los archivos que realmente cambiaron. Mantener el método completo
  `loadFullLibrary()` para restauración y consumidores históricos.
- Prueba del navegador offline sin el archivo consolidado disponible:
  buscar, personalizar, insertar y exportar recursos deben funcionar desde
  snapshots independientes.
- Publicación con workflow
  `.github/workflows/resource-provider-index.yml` en la rama aislada
  `resource-vault-data`; conservar todos los paquetes y miniaturas.
- Verificar CI y commit de datos antes de dar esta etapa por publicada.

### Publicación del índice bajo demanda comprobada (13/10/2026 UTC)

- Workflow específico aprobado: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38330281711
- HEAD publicado en la historia independiente `resource-vault-data`:
  `920d48eaebf9a540cee105fdab84d5b5d41e2967`.
- El índice asigna **6762/6762 recursos** a su paquete físico correcto;
  permanecen cinco archivos de origen con los mismos checksums. También
  se preservaron las 1860 miniaturas Lucide y las 323 Heroicons.
- Se añadió un test de navegador que deja deliberadamente inaccesible
  el archivo combinado `all/library.json.gz`. El acceso normal a recursos
  ahora debe utilizar únicamente snapshots individuales verificados.
- La publicación del índice y el CI del código son procesos independientes;
  verificar el resultado de Chromium Windows del último commit antes de
  afirmar que la etapa completa pasó.

## Etapa 91: acelerar Uiverse y definir cierre v1 (13/10/2026)

- Decisión de producto: **evitar una secuencia interminable de
  microetapas**. Se creó `tools/resource-etl/CRITERIOS_CIERRE_V1.md`
  con definición comprobable de la v1, límites de compatibilidad,
  condiciones de aceptación y 3-5 bloques estimativos de cierre.
- Rendimiento: Uiverse (3761 HTML/CSS, ~2,9 MB gzip) se subdivide en
  ocho paquetes individuales verificados. El índice conserva el
  `snapshotId` original y agrega `detailShard`; el navegador carga
  sólo la parte pertinente de cada recurso. No modificar el paquete
  Uiverse canónico ni forzar descargas de nuevos orígenes.
- Publicación: `.github/workflows/resource-uiverse-shards.yml`,
  incrementando sólo ocho partes e índices en la rama de datos
  independiente; verificar la ejecución antes de declarar publicada.
- Próximos bloques, sin más controles marginales: claridad de
  compatibilidad insertable/código-only, QA integrado de escritorio y
  móvil, cierre v1 y lista de limitaciones. React/Three/GLSL/Lottie
  totalmente editables quedan fuera del primer cierre mientras no
  existan adaptadores reales probados.

## Confirmación de continuidad del plan (13/10/2026)

El usuario aclaró expresamente que su pregunta por cuánto faltaba
para terminar no era una orden de recortar o cambiar el plan.
**Mantener la estrategia de desarrollo original**, con mejoras
significativas y las fuentes abiertas/licenciadas previstas, sin
convertir el documento `CRITERIOS_CIERRE_V1.md` ni la estimación
"3 a 5 bloques" en un límite obligatorio. No imponer un cierre
forzado ni dejar de explorar recursos útiles por esa estimación.
Evitar microetapas artificiales y controles de poco valor, pero
seguir expandiendo capacidades cuando aporte al objetivo global.

## Etapa 92: estado utilizable visible en las tarjetas

- El índice incorpora `editorUse` para cada recurso: `svg`,
  `uiverse-html` o `code`, derivados del renderizador,
  artefacto real de entrada y licencia, no sólo del proveedor.
- La grilla muestra el estado y filtra por inserción compatible
  con el editor conectado o exploración/copia de código.
- Mantener como capa final de seguridad el validador y
  `prepareUiverseSandboxHtml` al intentar insertar.
- Reindexar sólo metadatos; preservar todos los hashes fuente,
  el catálogo completo, las ocho divisiones Uiverse y los
  bocetos de Lucide/Heroicons.
- Pruebas: clasificador unitario y Chromium en Linux/Windows,
  incluyendo búsqueda/filtro sin descargar las bibliotecas completas.

## Etapa 93: muestra instantánea real de Uiverse (13/10/2026)

- Nueva acción en tarjeta `Ver muestra en la tarjeta`, únicamente
  para componentes Uiverse que el índice clasifica como
  `uiverse-html`. Se usa el **documento HTML/CSS real**, no una
  imagen de catálogo ficticia.
- El detalle se descarga **sólo al hacer clic**, del shard verificado,
  y usa la misma caché del cliente persistente. No bajar los 3761
  Uiverse durante una búsqueda.
- `iframe sandbox=""` y meta CSP `default-src 'none'` para bloquear
  JS, red externa, iframes y formularios. Permitir estilos inline
  para que el componente y su CSS se vean correctamente.
- Cerrar/desmontar la muestra al elegir otra tarjeta, actualizar
  resultados o cambiar filtros. Ignorar respuestas tardías.
- Pruebas de Chromium en ancho desktop/celular, política CSP,
  reutilización de datos, aislamiento y ausencia de dependencias
  externas. El generador de versión pública debe incluir
  `src/runtime/quick-preview.mjs`.
- No alterar el plan original ni considerar la definición alternativa
  de v1 como una restricción de alcance. No Vercel, no merges.

## Caché offline segura y común para todo el catálogo (14/10/2026)

- Decisión: no introducir descargas o servicios aislados por familia.
  `src/runtime/offline-vault-cache.mjs` implementa almacenamiento
  opcional mediante Cache Storage para las fuentes verificadas del
  cliente existente. Sirve a todos los paquetes, sin crear un nuevo
  sistema para cada icono/componente.
- Prioridad: al fallar la red, buscar la misma ruta **y SHA-256**
  previamente guardada; revalidar los bytes antes de usarlos.
  Nunca sustituir respuestas corruptas de red por contenido de
  otra versión; persistir el manifiesto sólo tras validar su índice.
- Guardar únicamente el índice y recursos abiertos. Limitar
  crecimiento del conjunto cacheado y soportar navegadores sin
  acceso a Cache Storage.
- UI: mensaje explícito del modo offline parcial al recuperar
  índice; actualización manual sigue siendo remota y atómica.
- Pruebas: Node con Cache Storage de prueba y Chromium en modo
  red externa desconectada después de recargar.
- Limitación conocida: no descarga anticipadamente todo el
  catálogo ni proporciona por sí misma una app-shell instalable
  completamente offline. No se cambia el plan original de NAGWEB 05.

## Referencias de origen auditadas (14/10/2026)

Se recuperaron de los **importadores reales** las direcciones de 17 proveedores y sus enlaces legales, separados expresamente de las URLs que el usuario pudo haber pegado en conversaciones antiguas. Ver el nuevo archivo [`NAGWEB_05_REFERENCIAS_FUENTES_VERIFICADAS.md`](NAGWEB_05_REFERENCIAS_FUENTES_VERIFICADAS.md). El informe preserva links de repositorios, endpoints, módulos exactos, restricciones del Vault y protocolo para no bloquear el proyecto por URLs históricas no recuperadas. No confundir procedencia desde código con procedencia desde un chat original, ni afirmar compatibilidad de inserción sin pruebas.

## Etapa 94: SpinKit utilizable como HTML/CSS nativo (14/10/2026)

- Se amplía el adaptador HTML seguro existente a los 12 loaders autónomos de
  SpinKit ya preservados en el paquete verificado `core-code`, sin descargarlos
  de nuevo ni modificar el original. Los demás proveedores HTML/React no se
  habilitan automáticamente.
- SpinKit usa el mismo iframe opaco sin scripts/red externa que Uiverse, validación
  estricta de proveedor/ID/licencia/markup, persistencia y exportación del elemento
  nativo `embed`. Conserva un identificador de tipo `spinkit-html` para su
  edición posterior. Tamaño y color se aplican con variables CSS acotadas sobre
  el contenedor, respetando la hoja de estilo fuente.
- Las tarjetas identifican qué SpinKit es insertable y permiten muestra rápida.
  Un reindexado de metadata existente agrega `editorUse: spinkit-html` sin
  modificar los cinco paquetes fuente ni las miniaturas existentes.
- Pruebas: validador y clasificador unitarios, DOM/aislamiento vía Chromium
  Windows/Linux, inserción, edición, persistencia, exportación y recarga.
- La CI y la publicación del índice se verifican por ejecución/commit real.
  No se despliega Vercel, no se fusionan las otras ramas. La extensión futura
  a otros HTML/CSS será por validación de contenido y proveedor, no por
  habilitar todo recurso con renderer HTML.

## Etapa 95: Magic.css sobre elementos existentes (14/10/2026)

- Se habilitan los **65 efectos CSS autónomos de Magic.css ya guardados** para
  textos, títulos, párrafos y botones que estén seleccionados en NagWeb.
  A diferencia de insertar HTML, se aplica el efecto al objeto existente y se
  conserva su identidad, geometría y selección. Los demás objetos siguen sin
  declararse compatibles hasta contar con una solución que no rompa layout/3D.
- Los CSS validados se guardan junto al elemento, no requieren CDN ni código
  descargado durante reproducción/exportación. La animación ocurre en un
  `span` interno para preservar la posición y la transformación del lienzo.
  Solo se integra código de los registros Magic.css verificados, con clase,
  keyframes y valores acotados. Se rechazan importaciones/URL CSS externas.
- El navegador ofrece los controles reales de duración, demora, curva y
  repeticiones. El efecto se puede reabrir para editar en su mismo elemento.
  Se respeta `prefers-reduced-motion` y se conserva la exportación offline.
- El índice compacto de la rama separada `resource-vault-data` pasa a
  clasificar Magic.css como `magic-css`, sin alterar ni volver a descargar
  ningún paquete fuente (6.762 recursos); prueba de permisos, metadatos y
  recuentos. Las pruebas de navegador deben cubrir aplicar, editar, recargar
  y exportar; sin mezcla de ramas ni Vercel.

## Etapa 96: Magic.css para imágenes e íconos vectoriales (14/10/2026)

- Ampliación reutilizable del adaptador Magic.css a imágenes y vectores del lienzo.
- Las animaciones se aplican a un wrapper interno y conservan posición y rotación.
- Chromium verifica inserción del efecto, geometría, exportación y recarga.
- Sin Vercel, cambios en Vault ni merges.

## Etapa 97: Magic.css en SVG dibujados y vídeos (15/10/2026)

- Reutiliza el motor Magic.css verificado para `svgdraw` y `video`, con animación del contenido visual interior y geometría externa estable.
- Se conserva exportación sin dependencias nuevas y modo de movimiento reducido. No afecta objetos 3D, ni otras ramas.

## Etapa 98: quitar animaciones y compatibilidad anterior de videos (15/10/2026)

- Botón contextual `Quitar animación`, activo solo en elementos seleccionados con Magic.css.
- Elimina la animación sin eliminar el elemento, registrando historial y guardando el proyecto.
- Los vídeos sin efecto mantienen exactamente la salida nativa anterior, sin wrappers innecesarios.
- Prueba integrada de eliminación, recarga, estado del botón e historial.

## Etapa 99: Magic.css para selecciones múltiples (15/10/2026)

- La Biblioteca admite aplicar un único efecto Magic.css a una selección de 1 a 48 elementos **todos compatibles**, incluyendo combinaciones de texto, botones, imágenes, vectores, SVG dibujados y vídeos. No altera los elementos no seleccionados ni habilita tipos incompatibles.
- Al abrir el diálogo captura los IDs, la página, la escena y la huella de cada elemento. Antes de aplicar, comprueba la selección completa y evita modificaciones parciales si un elemento cambia, desaparece o cambia la selección.
- La aplicación y el botón «Quitar animación» modifican todos los elementos elegidos en **una sola operación de historial**, conservando IDs, posición, geometría y los restantes atributos. La eliminación funciona para cualquier subconjunto animado dentro de una selección compatible.
- La personalización posterior de una animación sigue siendo por elemento individual. No se cambia el protocolo de mensajes ni se amplían las licencias o proveedores.
- Se incorporó un recorrido Chromium con elementos heterogéneos, exportación, persistencia, deshacer/rehacer y ausencia de efectos sobre un tercer objeto. **No declarar la CI aprobada hasta comprobar el workflow del commit final.**
- Vercel permanece desactivado para publicaciones automáticas. No mezclar esta rama con `main` ni con `resource-vault-data`.

## Etapa 100: interfaz de la Biblioteca reutilizable sin conexión (15/10/2026)

- Se añadió un **service worker opcional y limitado al navegador independiente** de la Biblioteca, sin instalarlo desde el iframe que abre NagWeb dentro del editor. Después de una instalación completa, conserva únicamente el HTML, CSS, JavaScript, motor de vistas previas y dependencias locales necesarios para reabrir el panel offline.
- El worker sólo intercepta las rutas propias y conocidas de la interfaz, no el editor principal ni el dominio remoto del Vault. Los datos y paquetes mantienen exclusivamente el mecanismo SHA-256 del cliente `offline-vault-cache.mjs` ya existente. No se almacenan todos los 6762 recursos anticipadamente.
- `src/preview/public-browser-assets.mjs` centraliza los módulos incluidos tanto en la vista de GitHub Pages como en la instalación offline, evitando listas divergentes. `build-public-site.mjs` continúa sin publicar ni desplegar: sólo copia archivos necesarios.
- Degradación progresiva: no debe bloquear navegadores sin Service Worker, sitios sin contexto seguro, iframes ni primera visita sin red. Cambios de versión de la app requieren incrementar la versión del caché del worker.
- Test nuevo: inventario completo de archivos, restricciones del worker y empaquetado público en directorio temporal. La disponibilidad offline efectiva en Chromium debe comprobarse en CI/prueba manual antes de anunciar el cierre de esta capacidad. Vercel sigue desactivado.

## Etapa 101: estabilización de la interfaz offline y controles FX (15/10/2026)

- Los jobs Chromium de la etapa 100 fallaron por una prueba de desconexión que seguía respondiendo con fixtures de red incluso en `context.setOffline(true)`; se corrigió con un bloqueo explícito de solicitudes remotas durante la fase offline (commit `5b9c419`). No interpretar el antiguo mensaje «Índice verificado» como pérdida del caché.
- Una segunda ejecución alcanzó los tests de selección múltiple de Magic.css. En Windows la prueba cambiaba la selección internamente sin actualizar el lienzo; en Linux el botón «Quitar animación» quedaba interceptado por el título central de la barra superior. El commit `aab4eb6` sincroniza la prueba mediante `refresh()`, hace más compactas las acciones FX y prioriza el contenedor izquierdo de la barra para la interacción.
- Los selftests de Node y el smoke de Windows pasaron en la ejecución `38728837470`, pero **los Chromium de ese commit fallaron**; no considerarlo cierre de QA. Nueva ejecución vinculada a `aab4eb6`: revisar sus cuatro jobs antes de ampliar el catálogo o declarar resueltos los defectos.
- Mantener intacta la integración de Magic.css, sin desplegar Vercel ni fusionar ramas. Siguiente familia prevista: CSSShake sobre elementos existentes, utilizando el motor compartido, con pruebas de reproducción, edición, selección, exportación y modo movimiento reducido.
- Auditoría adicional: la recolección de CSS para el HTML exportado omitía los tipos `svgdraw` y `video` aunque `magicInner()` ya los animaba. El commit `2e77b8d` alinea la recopilación de estilos con los ocho tipos admitidos y exige comprobar que `@keyframes` viaje en la exportación de imagen, vector, SVG dibujado y video. La verificación de navegador debe aprobarse antes de declarar resuelta la regresión.

### Selección contextual sincronizada (15/10/2026)

- La nueva CI confirmó que, incluso con barra compacta, el botón de quitar efectos podía seguir deshabilitado porque la Biblioteca solo observaba mutaciones dentro de `main`. El panel `#pane`, donde el editor vuelve a dibujar la selección, requiere observación propia.
- El commit `b9a6420` añade un `MutationObserver` de `#pane` para actualizar estado de personalización/eliminación sin sondeo temporal. Es una corrección transversal para la selección de recursos, no una excepción de prueba.
- CI de ese commit: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38730450545 . Confirmar éxito de Chromium Windows y Linux antes de continuar con CSSShake.

## Etapa 102: CSSShake nativo (15/10/2026)

- Los diez efectos CSSShake MIT se integran con el motor FX existente, sin duplicar el sistema de selección, historial, guardado ni exportación. Los ocho tipos de destino admitidos siguen siendo los de Magic.css; no se crean objetos nuevos.
- Activación Hover/Siempre editable desde la Biblioteca. `csshake:runtime` se descarga bajo demanda desde el Vault con verificación de licencia y archivos, y queda guardado en cada efecto para exportar offline.
- El host valida origen, identidad, dependencia única, clase permitida, CSS sin recursos externos, y licencia; persistencia compartida en `nwMagicCss`. Se agregaron pruebas unitarias y Chromium de aplicación, edición, exportación, persistencia y deshacer.
- Corregida la prueba que exigía mantener una selección activa tras `undo()` cuando el editor explícitamente la limpia. Se debe confirmar la ejecución de CI y la actualización del índice derivado (6041 nativos y 721 código, 6762 totales).
- Sin deploy de Vercel ni merge a main.

## QA de integración, teclado y cobertura de CSSShake (15/10/2026)

- La CI del commit `7068681` pasó Linux, selftests y Windows smoke, pero falló **Chromium Windows** al usar `Alt+Enter` sobre el botón de personalización. Ese atajo puede ser capturado por el navegador o el sistema operativo Windows.
- El test separa la verificación del manejador `Alt+Enter` (evento de teclado sobre el botón en Windows, atajo físico en Linux) de la activación accesible estándar con `Enter` que funciona sin ese atajo. El botón anuncia `aria-keyshortcuts="Alt+Enter"`.
- CSSShake recibe una comprobación visual de `animation-name` en Hover/Siempre, y los diez nombres upstream se prueban como variantes nativas tanto en Hover como en Siempre. Las nuevas variantes no auditadas siguen siendo «Solo código».
- La guía `NAGWEB_05_GUIA_PRUEBA_Y_ALCANCE.md` documenta prueba manual y la diferencia entre el hito estable y el objetivo completo. No declarar Windows aprobado hasta revisar la CI del commit final. Sin deploy Vercel ni merges.

## Cierre técnico comprobado (16/10/2026)

- **Código estable de referencia:** `dfcd35edf072b6f4f6362374db0c94691137aec9` (rama exclusiva `feat/resource-etl-v1`).
- **CI integral:** https://github.com/decrackpichon-gif/NagWeb/actions/runs/38777181423 — `success`. Aprobados los cuatro trabajos: Self test, Chromium Linux, Chromium Windows y Windows smoke. Las capturas/informes están adjuntos a esa ejecución. El doble clic SVG, selección sin alterar ancho/historial, menú contextual y recorridos reales ya superan ambos Chromium.
- **Catálogo:** `Resource Vault Verified Browse Index` success https://github.com/decrackpichon-gif/NagWeb/actions/runs/38749871198 . Índice publicado con 6762 recursos, 6041 clasificados como nativos por sus adaptadores y 721 de consulta/código; no se recompilaron ni cambiaron sus cinco snapshots.
- **Resultado:** **V1.0 técnicamente validada y candidata de entrega.** No hay bloqueantes automáticos conocidos. La revisión manual breve en Windows por el usuario, según la guía, sigue pendiente: sin ella no afirmar «aceptación manual completada» ni publicar tag/merge/despliegue como definitivo.
- **Instrucciones y límites de la candidata:** `docs/contexto/NAGWEB_05_ENTREGA_V1.0.md`. No añadir funcionalidades mientras se realiza aceptación; si se confirma, declarar V1.0 entregada en la misma rama y, si se pide, crear etiqueta específica `NAGWEB-05-v1.0` sin mezclar proyectos.

## Aceptación Windows simplificada (16/10/2026)

- Se preparó el iniciador de doble clic `PROBAR_NAGWEB_05_WINDOWS.bat` y un servidor HTTP local sin npm (`tools/resource-etl/src/editor-acceptance-server.mjs`) para que la prueba manual del editor integrado no requiera comandos, Live Server ni Vercel. Requiere Node 20+ y el ZIP completo de la rama.
- El selftest de HTTP se integra en `npm test` para Linux y Windows CI. Esta herramienta no modifica el código del editor ni el Vault persistente; la CI anterior validó el editor en `dfcd35e`. Revisar la CI de este nuevo commit antes de confirmar también el iniciador.
- **Sigue pendiente exclusivamente la aceptación manual representativa del usuario**, descrita en `NAGWEB_05_ENTREGA_V1.0.md`. No declarar cierre final ni publicar tag hasta recibirla; no añadir recursos nuevos como requisito.

## Bloqueo real de apertura local y corrección (16/10/2026)

- **Fallo reportado por el usuario con captura:** al pulsar «Biblioteca» en el editor servido con el iniciador de Windows, el iframe mostraba «Archivo no encontrado». La V1.0 **no está aceptada**, aunque la CI anterior estaba verde.
- **Causa comprobada en código:** `editor-acceptance-server.mjs` atendía `/tools/resource-etl/resource-browser/` como directorio en vez de `resource-browser/index.html`; el smoke original sólo comprobaba la raíz y módulos sueltos, no la ruta real del botón.
- **Corrección puntual:** resolver URLs de directorio terminadas en `/` a `index.html`, sin modificar editor, catálogo ni adaptadores; ampliación de `editor-acceptance-server-selftest.mjs` para pedir exactamente la URL del iframe y sus recursos CSS/JS. El resultado de CI de este cambio debe verificarse por commit, y todavía requiere aceptación manual del usuario.
- **Regla de QA para el cierre:** no tratar el éxito de pruebas con servidores/fixtures alternativos como prueba de que el iniciador real abre la Biblioteca; comprobar la ruta con el servidor que se entrega.

## Estado de aceptación tras el error de apertura (16/10/2026)

**Estado actual: V1.0 NO ACEPTADA todavía.** El usuario intentó la entrega de Windows y el botón «Biblioteca» devolvió «Archivo no encontrado». Se confirmó que el iniciador local introducido en `ef63cb9` servía la URL de carpeta como archivo y provocaba HTTP 404; **no fue pérdida de los recursos ni razón para reconstruir el editor**. La ruta se corrigió en `bd43e68`; se reparó la sintaxis del nuevo test en `4ab8e7c`.

- **QA real verificada del código corregido:** [Resource ETL CI 38988545920](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38988545920) = **success**, 4/4 jobs (Self test, Chromium Linux, Chromium Windows, Windows smoke). El selftest del iniciador consulta exactamente `/tools/resource-etl/resource-browser/?hostOrigin=...`, verifica el HTML de Biblioteca y archivos CSS/JS. No confundir este smoke HTTP y los Chromium con aceptación humana en el mismo equipo.
- **Única comprobación de usuario requerida antes de cualquier nueva declaración de «listo»:** actualizar la rama `feat/resource-etl-v1` (GitHub Desktop Pull o ZIP actual completo, evitando una copia antigua); abrir `PROBAR_NAGWEB_05_WINDOWS.bat`, entrar a una escena y pulsar «Biblioteca». Confirmar que carga la interfaz real, no «Archivo no encontrado». **No exigir repetir el resto del recorrido** si este paso aún falla.
- Si abre, continuar con los pasos mínimos de aceptación ya documentados en esta guía, sin inventar nuevas funcionalidades. Si no abre, registrar el error exacto y corregirlo antes de otro ZIP.
- No crear tag, merge, deploy ni declarar V1.0 aceptada antes de confirmación del usuario. Rige la [política universal](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md).


## Vista visual por defecto para todo el catálogo (17/10/2026)

- Pedido de aceptación real del usuario: las fichas solo-texto no permiten reconocer los recursos; las tarjetas deben mostrar una representación visual sin botón y los ajustes de recursos reproducibles deben verse en el detalle.
- Solución: SVG inline real cuando el índice ya aporta geometría; HTML/CSS Uiverse y SpinKit, Magic.css y CSSShake, más presets AnimXYZ, se muestran automáticamente **solo al entrar al área visible**, con máximo dos lecturas de detalle concurrentes y iframe sin permisos de red ni scripts de origen. No se precargan 6762 ítems.
- Para tipos que necesitan React, Three.js, GLSL u otro renderer aún no implementado se muestra **esquema de categoría rotulado como tal**, nunca una falsa ejecución del recurso. AnimXYZ presets nativos usan sus tracks JSON reales para una mini animación CSS y vista de detalle personalizable en duración, demora y curva. El catálogo fuente, licencias, posibilidad de inserción y ramas ajenas no cambian.
- La prueba de navegador verifica muestra real sin clic y esquema claramente separado de recurso no insertable. Revisar la CI de este commit; el usuario todavía debe confirmar visualmente la experiencia real, no llamar V1.0 aceptada por el código.

## AnimXYZ aplicable en el lienzo (17/10/2026)

- Pedido y prueba del usuario: la vista previa AnimXYZ era correcta, pero «Aplicar» permanecía inutilizable, y el diseño del elemento original tenía que seguir siendo editable. Se incorporó un puente del preset `nagweb-motion-preset/0.1` hacia la ruta compartida `nwMagicCss`, **sin insertar un rectángulo de demostración**.
- Se verifican origen AnimXYZ, licencia, identidad, esquema de tracks y parámetros; CSS autónomo solo para transformaciones numéricas conocidas u opacidad. Las pistas se convierten a `@keyframes` y se ejecutan en la envoltura interna, sin cambiar la geometría exterior. Se admiten selecciones existentes compatibles con FX: heading, label, paragraph, button, image, vector, svgdraw y video. Las propiedades originales de tipografía, texto, color y ubicación se siguen editando en el editor, mientras el panel Biblioteca edita duración/demora/curva de la animación. Los cambios usan historial, guardado y exportación FX existentes.
- Reutiliza validación de edición y persistencia; `resource-browser-smoke.mjs` ahora prueba AnimXYZ aplicado a un heading real, edición del texto, reentrada a personalización y exportación/reload.
- El índice derivado publicado por el workflow `Resource Vault Verified Browse Index` agregó **21 presets nativos verificables** sin alterar los cinco snapshots originales ni el total 6.762: **6.062 nativos y 700 solo código**. Workflow exitoso: https://github.com/decrackpichon-gif/NagWeb/actions/runs/39004490682 . El push a la rama independiente de datos fue `93c5d54` (solo índice derivado).
- Sigue pendiente comprobar la **CI integral del código final** y aceptación manual real en Windows. React/Three.js/GLSL/HyperUI no tienen aún vista auténtica general; no volver a presentar sus esquemas de familia como preview del recurso. Sin Vercel ni merge.

## HyperUI con vista auténtica (17/10/2026)

- Los 4.021 recursos HyperUI de HTML/Tailwind ya no necesitan quedarse en un esquema de categoría: se prepara una vista con el **HTML original almacenado** y el CSS compilado **`hyperui:runtime` del Vault verificado**, cargados de forma diferida por recurso visible (tarjeta) o abierto (detalle). El visor implementado vive en `src/preview/hyperui-browser-preview.mjs`; solo funciona si runtime + licencia y HTML original son válidos. De otro modo se declara la ausencia de visor, no una muestra ficticia.
- El HTML se parsea sin ejecutar scripts y se retiran `script`, `iframe`, `object`, `embed`, handlers inline y URLs `src` no `data:image`; CSS de origen quita el `@import` de Google Fonts y el iframe queda aislado. El resultado preserva las clases Tailwind reales, temas claro/oscuro y la estructura HTML original, aunque **las interacciones que dependen de JavaScript no se simulan**.
- La prueba Chromium incorpora un botón de HyperUI con CSS real verificable tanto en tarjeta como en detalle, sin recursos externos. Se actualizó el inventario de módulos públicos y la caché de interfaz para cubrir las dependencias nuevas (`nagweb-magic-css-effect.mjs` y el visor HyperUI).
- **No se añadió inserción de HyperUI como HTML completamente editable**: sigue como código/consulta mientras falte adaptar y validar sus dependencias y slots. La edición nativa de React, Three.js, shaders y Code Helper sigue pendiente. No declarar la V1.0 aceptada hasta la CI del commit de código y la prueba real del usuario. Esta documentación no implica pruebas humanas completadas.

## Previews WebGL auténticas para glsl-noise (17/10/2026)

- `tools/resource-etl/src/preview/glsl-noise-browser-preview.mjs` genera una visualización **real** de las funciones GLSL del proveedor `glsl-noise`, a partir de la fuente original licenciada/verificada. Admite las nueve combinaciones classic/periodic/simplex × 2D/3D/4D que publica el proveedor.
- Las funciones de ruido NO son shaders de pantalla completos. El visor incorpora su código real como función `cnoise`, `pnoise` o `snoise` en un fragment shader WebGL de NagWeb, muestra una representación cromática de sus valores y, en el detalle, avanza coordenadas con el tiempo. La muestra es el resultado de la función, **no un material ni escena 3D lista para insertar**.
- Validación estricta de proveedor, licencia, identificador, dimensión, símbolo y artefacto del Vault. Solo se ejecuta JavaScript fijo de NagWeb dentro de `iframe sandbox="allow-scripts"` **sin allow-same-origin**, con política CSP que bloquea peticiones externas. La fuente GLSL llega como cadena JSON escapada, no como JS. El thumbnail calcula una imagen con WebGL, luego toma `data:image/png` y libera el contexto gráfico, para no dejar decenas de canvases WebGL abiertos. Si WebGL no está disponible, el mensaje lo indica y no se sustituye por una imagen falsa.
- Se añadió soporte de vista real en tarjetas y detalle; se incluyó el módulo en el manifiesto público/offline y se actualizó la versión de caché. Las pruebas `quick-preview-selftest.mjs` y `resource-browser-smoke.mjs` ejercitan validación, sandbox, datos de origen, render y fallback.
- **Pendiente**: aceptación manual de esta familia en Windows tras CI completa; integrar shaders como efectos aplicables requerirá contrato de material, no debe confundirse con tener preview. Three.js/React y otros code-only siguen requiriendo renderizadores auténticos en algunos casos. Mantener V1.0 no aceptada hasta la prueba del usuario. Sin merge ni Vercel.

## Galería React compilada y previews auténticas (18/10/2026)

- La rama exclusiva `feat/resource-etl-v1` incorpora `react-previews/manifest.json` y lectura opcional en `resource-browser/app.mjs`. Cada entrada sólo acepta IDs de `shadcn`, `magicui` o `motion-primitives` y rutas relativas estrictamente validadas. **Sin manifiesto compilado o sin miniatura, ningún recurso se presenta como preview real.**
- `src/preview/publish-react-gallery.mjs` reaprovecha **el compilador React original auditado** (`react-compiler.mjs`) y publica solo componentes que primero compilan y luego **renderizan de verdad** en Chromium con un iframe `sandbox="allow-scripts"`, sin `allow-same-origin`. Cada tarjeta usa una captura PNG auténtica de la demo y su detalle ejecuta el HTML React aislado.
- Las fuentes React y sus dependencias se compilan en GitHub Actions (`.github/workflows/resource-react-gallery.yml`); el resultado es autónomo y se guarda en la misma rama. El usuario **no debe instalar esbuild, npm, React ni Playwright en Windows**. Los scripts de runtime Tailwind y bundle compilado se embeben dentro del HTML auditado para no romper el origen opaco del iframe. Se prohíben fetches externos en la toma de capturas. Se usa un límite inicial de componentes renderizados correctamente por proveedor, **no se afirma que los 155 componentes Magic UI estén listos**.
- Workflow de publicación: corre sólo ante cambios relevantes del compilador/publicador o manualmente, y guarda *únicamente* archivos `react-previews/` en la rama NAGWEB 05; no hace merges ni Vercel. Se deben comprobar el manifiesto efectivamente publicado y la CI final, **no dar por terminada la tarea por el mero hecho de lanzar la acción**.
- Limitación: estas previews permiten **ver el componente real**; no implican todavía insertar o editar código React nativamente dentro del lienzo. El paso siguiente es integrar edición con contrato de props y persistencia, sin presentar un botón `Aplicar` activo mientras no funcione.
- Estado de V1.0: **NO ACEPTADA** hasta confirmación del usuario de las demos y de un caso real de uso del editor. Las familias de escenas Three.js siguen pendientes de visor real propio.

## Corrección de alcance: React con miniaturas auténticas, NO reproductor interactivo todavía (18/10/2026)

- La ejecución de React en un `iframe` de origen opaco con los scripts originales compilados no fue aceptada porque Chromium no montó los componentes. **No se debe llamar «preview interactiva»** a ese resultado, y no se debe agregar `allow-same-origin` para forzarla.
- Se conservó la compilación verificada existente. El publicador ejecuta cada componente compilado desde un servidor **local temporal de CI** (sin permitir solicitudes externas), comprueba que React haya montado contenido visible y saca una **captura real** de la etapa. Solo las capturas aprobadas se incorporan al catálogo de NagWeb 05. La tarjeta y el detalle muestran esas capturas bajo iframe sin scripts.
- Una miniatura React publicada es **fiel pero estática**. No ofrece todavía animación, interacción ni personalización en vivo, y tampoco implica inserción. La limitación debe ser visible en la ficha del recurso. Los componentes que no generen captura válida mantienen el estado no disponible, en lugar de mostrar una preview fingida.
- Falta comprobar que el workflow de publicación efectivamente incorpore las imágenes al repositorio, la CI completa y la prueba manual. Nunca considerar V1.0 aceptada automáticamente.

## Galería React liviana y mayor cobertura (18/10/2026)

- La primera galería generada por CI y subida en el commit `7409b54` tiene **16 miniaturas PNG auténticas**; la publicación React y las cuatro pruebas del código base fueron exitosas. Estas capturas corresponden a una demostración React compilada y ejecutada en CI, no a iconos ni esquemas ficticios.
- Hallazgo de rendimiento: esas 16 miniaturas PNG pesan ~201 KiB, pero la publicación también incorporó ~29 MiB de bundles JavaScript de React que **la Biblioteca ya no utiliza**, pues el visor React es deliberadamente estático por seguridad. La nueva etapa elimina los directorios públicos de `react/` y `runtime/` tras generar las miniaturas, publica solamente `manifest.json` + `thumbnails/*.png`, y usa `git add -A` para eliminar esos binarios también del checkout de Windows. No borrar los recursos originales del Vault.
- Se incrementó la selección inicial auditada del publicador de 6+6+4 a **hasta 20 componentes por proveedor**: Magic UI, Shadcn y Motion Primitives. La cifra final debe leerse del manifiesto generado después de que termine GitHub Actions, ya que demos que fallen se excluyen. No declarar 60 disponibles antes de verificar el resultado.
- Se agregó prueba Chromium de que el PNG de `magicui:android` aparece con dimensiones no nulas en la tarjeta y en el detalle dentro de su iframe sin permiso de scripts. La UI continúa marcando React como **explorar código**, no como recurso insertable; la captura es fiel pero estática y no reemplaza la animación real ni la edición en el lienzo.
- Queda pendiente aceptación manual con GitHub Desktop, y visores/interacción nativa de las familias de código todavía no soportadas. No marcar V1.0 aceptada sin uso real.

## Corrección de reapertura SVG durante refresco (18/10/2026)

- Tras publicar 53 capturas React verificadas en el commit `70f2ce7`, la CI con navegador Windows alcanzó un fallo de reapertura de personalización de SVG: botón «Editar» habilitado, pero el modal no abrió tras el clic, mientras Chromium Linux, Self test y Windows smoke pasaron.
- Se detectó una posible carrera de medidas entre el iframe `#preview` y `measureVector(element)`. En `js/nagweb-resource-library.mjs`, el control `Editar` **espera hasta 1800 ms** únicamente por la condición recuperable «lienzo se está actualizando», comprobando en cada ciclo que la escena, selección y objeto originales sigan siendo los mismos. No espera si el vector es ilegítimo ni edita otro recurso.
- `resource-browser-smoke.mjs` incorpora un escenario que desajusta temporalmente el ancho de un vector y lo restablece tras 170 ms. Exige que un **único clic real** abra la Biblioteca una vez que las medidas son correctas, sin historial extra.
- El último commit de código/test es `5278bab`. La CI completa del último commit debe consultarse antes de la entrega manual. Mantener V1.0 no aceptada hasta la prueba del usuario en Windows.

## Aclaración de QA tras la reapertura SVG (18/10/2026)

- La solución experimental de reintento asíncrono de `Editar` (3067764) **se revirtió** en `0e41ea4` porque produjo un fallo en Chromium Linux. No atribuir ese cambio a la versión final ni decir que el clic asíncrono quedó implementado.
- Se restauró exactamente el manejador original del editor, que era estable en Chromium Linux. El test del segundo gesto de edición ahora **espera a que el nuevo documento del lienzo tenga el mismo objeto seleccionado y las medidas actuales** antes de efectuar un clic real. Esto evita simular interacción durante una transición de iframe sin relajar las comprobaciones.
- La galería React ligera publicada con 53 PNG y sin JavaScript compilado sigue conservada. Último ciclo de CI del parche `0e41ea4`: verificar en GitHub antes de afirmar 4/4.

## Capturas oficiales verificadas de las 281 escenas Three.js (18/10/2026)
- Se confirmó `Resource ETL CI` anterior de SVG + React: https://github.com/decrackpichon-gif/NagWeb/actions/runs/39132641059 = 4/4 `success`. No equivale a aceptación de V1.0.
- La fuente de datos **original** está en `resource-vault-data/threejs-code` y fija la revisión `e9a8a1264c58150907230122ac17f5760a1ebab1` de `mrdoob/three.js`. Tiene 281 recursos code-only. El directorio público de ese mismo commit de Three.js contiene **281 capturas JPEG correspondientes exactamente a los 281 IDs** del catálogo, comprobadas con firmas JPEG, hashes SHA-256 y nombre de ejemplo. No se hicieron ilustraciones genéricas ni se utilizaron fotos arbitrarias. Archivo publicado por el job exitoso: https://github.com/decrackpichon-gif/NagWeb/actions/runs/39144515726 .
- `tools/resource-etl/src/preview/publish-threejs-gallery.mjs` y `.github/workflows/resource-three-gallery.yml` generan y verifican los originales sin instalar nada en Windows. Se publicaron 281 capturas JPG, manifiesto con revisión de origen y SHA-256 en `tools/resource-etl/resource-browser/three-previews/` dentro de la rama exclusiva `feat/resource-etl-v1`. **Tamaño adicional 8,63 MiB** (no ejecutar código remoto en las tarjetas).
- `resource-browser/app.mjs` carga miniaturas y detalle desde imágenes locales del mismo repositorio, con validación estricta `threejs:example:<slug>` y relación exacta de rutas. Se muestran sin scripts, en `iframe sandbox`, y se indica explícitamente `Captura oficial del ejemplo Three.js` + carácter **estático**. El código fuente permanece en el Vault sin alteración; **no confundir esta mejora visual con inserción / edición de escenas 3D ni ejecución interactiva**.
- `resource-browser-smoke.mjs` ahora exige las 281 imágenes, revisión correcta, hashes JPEG y una vista real en tarjeta y detalle. El estado de CI se debe verificar en el último commit de pruebas y su uso real en Windows todavía requiere aceptación del usuario.
- Pendientes importantes de V1.0: experiencia real de aplicar/editar Code Scene y React, visores interactivos de esas familias, aceptación de animaciones, guardado y exportación. No declarar V1.0 cerrada solo por previews estáticas.

## Primer objeto Three.js fuente-verificado insertable como 3D nativo (18/10/2026)
- El catálogo `threejs-code` contiene **281 ejemplos**, de los cuales solo **`threejs:example:webgl_geometry_colors`** habilita `three-native` tras verificar licencia, proveedor, ruta, commit fijo `e9a8a1264c58150907230122ac17f5760a1ebab1`, artefacto HTML y constructor original `THREE.IcosahedronGeometry`. Los otros 280 siguen siendo exploración de código y capturas.
- `src/runtime/nagweb-three-native.mjs` valida estrictamente el mensaje recibido por el editor (identidad/commit/licencia/tipo/parámetros; velocidad 0–4) y lo convierte en **`shape3d` nativo de NagWeb, geometría `icosa`**. El objeto utiliza el renderizado 3D, transformaciones, inspector de materiales, girar con mouse, historial, guardado y exportación **existentes**, sin otra librería o iframe arbitrario.
- La ficha tiene el botón **«Insertar geometría 3D editable»** y un slider «Velocidad del giro». La captura en tarjetas y ficha continúa representando la escena original; el objeto insertado es una **adaptación simplificada de su geometría**, no la escena Three.js original con todos los objetos, luces y vertex colors. La UI lo declara explícitamente.
- El botón solo se activa con el editor conectado y capacidad `three-native`; el índice verificado se recalcula de archivos originales sin mutarlos. Se comprobó con workflow de índices que exactamente **uno** de los 281 ejemplos pasa a insertable.
- Test unitario: licencia, versión, fuente, velocidad válida/inválida y adaptación. Test Chromium: abrir ficha, cambiar velocidad, insertar, comprobar `shape3d`, editar color/material y velocidad, guardar, recargar y exportar HTML 3D. **No confundir trabajo implementado con aprobación de CI final**: consultar último job y luego aceptación manual del usuario. No merge ni Vercel.

## Tres geometrías 3D nativas verificadas (18/10/2026)
- Se extendió el adaptador original de un solo icosaedro a **tres** primitivas del motor 3D existente, exclusivamente por coincidencia entre ID/camino de fuente/commit/constructor del código HTML original: `webgl_geometry_colors` → `icosa`, `webgl_interactive_cubes` → `box`, `webgl_materials_envmaps_fasthdr` → `sphere`. Estos ejemplos tienen respectivamente los constructores `THREE.IcosahedronGeometry`, `THREE.BoxGeometry` y `THREE.SphereGeometry` en la revisión fijada `e9a8a1264c58150907230122ac17f5760a1ebab1`.
- Todos crean un objeto **shape3d real de NagWeb**, con giro ajustable desde la Biblioteca, color/material/movimiento/tamaño posteriores mediante inspector, y se benefician del guardado/exportación y del historial existentes. Son adaptaciones simplificadas, **no la escena completa original**: se conservan las capturas oficiales de la escena original y se aclara en el texto que «Insertar» trae solo la geometría. Los otros 278 ejemplos Three.js siguen siendo solo lectura/capturas.
- El adaptador `nagweb-three-native.mjs` ahora usa un mapa cerrado de geometrías permitidas, con validaciones en código y mensajes de aplicación sin afirmar siempre «Icosaedro»; los descriptores usan la forma coincidente. Se ampliaron tests unitarios para los tres casos y Chromium para insertar/exportar un cubo real.
- Se cambió el contrato del índice verificado a exactamente **3** adaptaciones nativas Three.js. El workflow de índice derivado aprobó `39160680587`; no se alteraron los archivos originales del Vault ni su recuento total.
- La CI completa de código de este avance corre como `39160680598`, pendiente de revisión antes de afirmar que la funcionalidad está aprobada. Ningún merge, ni Vercel. **V1.0 sigue pendiente de aceptación manual real en Windows**.

## Vista real del objeto 3D insertable (18/10/2026)

- La aceptación visual descubrió un problema: las 3 adaptaciones nativas insertables (icosaedro, cubo, esfera) mostraban en el detalle la **captura de la escena original**, que NO es lo que se inserta. Para no confundir al usuario, `resource-browser/app.mjs` ahora prioriza una **vista WebGL interactiva de la geometría nativa que efectivamente se insertará**, utilizando `src/preview/native-three-browser-preview.mjs`. La captura original queda en la tarjeta como referencia del ejemplo fuente.
- La vista usa las formas cerradas del adaptador original: `icosa`, `box` y `sphere`, color verificado, velocidad 0–4. Se puede arrastrar con el mouse o el dedo para girar y la velocidad responde al slider existente. Todo el código WebGL es propio de NagWeb y se ejecuta en un iframe `sandbox="allow-scripts"`, **sin** `allow-same-origin`, URLs externas, loaders externos ni código JS del ejemplo Three.js. Si no hay WebGL se muestra «WebGL no disponible», nunca un esquema que simule la forma.
- Los tres elementos son objetos `shape3d` del motor real del editor y se siguen editando, guardando y exportando desde ese motor. **No se afirma reproducir la demo completa de Three.js.**
- El módulo se agregó al manifiesto de archivos públicos/offline; cambió versión del caché de shell `v5` a `v6`. Los tests unitarios comprueban fuente/commit/licencia/forma/velocidad/CSP; el Chromium smoke exige abrir la ficha, obtener lienzo WebGL o aviso real de falta de soporte, cambiar velocidad y luego **insertar, editar, guardar, exportar y recargar** un objeto 3D.
- Pendiente: verificar la **CI completa del commit final** y la aceptación manual en Windows. No mezclar con otros proyectos ni desplegar Vercel.

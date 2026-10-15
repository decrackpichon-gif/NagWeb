# NAGWEB 05 | Biblioteca de recursos

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

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

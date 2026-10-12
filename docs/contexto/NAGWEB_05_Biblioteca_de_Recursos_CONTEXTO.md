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

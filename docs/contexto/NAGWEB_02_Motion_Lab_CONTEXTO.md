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


### 11/10/2026: cobertura nominal completa y keyframes de parámetros

- Se comparó el catálogo público disponible de Animos en https://animos.app/editor?scrollTo=multiscene con `motionTemplates` en `js/nagweb-story-editor.js`. Animos publica **66 nombres** y Motion Lab ya incluye los 66, más 3 escenas iniciales propias. **Esto verifica nombres, no fidelidad de comportamiento**. Grid Dive y Pop Parade todavía se consideran interpretaciones provisionales hasta obtener el vídeo/panel original.
- El editor de Animos tiene diamantes ◇ junto a deslizadores y colores para animarlos por fotogramas clave. Motion Lab amplía el motor procedural existente para ofrecer ese control compartido a los deslizadores numéricos y colores de fondo, con interpolación normalizada del Director, guardado/exportación sin un reloj alternativo y pruebas de modelo/browser.
- A partir de aquí, no fingir que se están incorporando «nuevas animaciones de Animos» si ya figuran por nombre. **Siguiente paso sustancial:** auditoría visual de fidelidad a la referencia, corregir diferencias grandes en lotes; luego controles propios y, después, animaciones originales según el orden del usuario.
- Es importante poder inspeccionar videos/HAR originales; si no están accesibles desde este chat, declarar la limitación sin presentar una recreación propia como idéntica a Animos.

### Avance del 12/10/2026: pistas visuales y desbloqueo de CI

- El editor de Animos muestra «Keyframes», pistas con marcas temporales y botón ◇ junto a deslizadores/colores. La implementación inicial de diamantes se completó con **pistas visuales** de parámetros, rombos clicables para ir al momento, señal de posición y contador de pistas. Es un único módulo compartido, no un control por animación.
- Corrección de test: las 55 suites del commit `01fc317` fallaron en la misma aserción por medir el efecto de `diveZoom` en una pose neutra de Grid Dive; el test se trasladó a un instante de acercamiento real y pasó completo con las demás verificaciones del modelo. La prueba de navegador se amplió para navegación por las pistas. Registrar por separado resultados de GitHub Actions cuando estén disponibles.
- Mantener prioridades del usuario: primero fidelidad a Animos documentada, después mejoras propias, finalmente nuevas composiciones originales. **Coincidencia de nombres del catálogo no es validación de fidelidad.** No desplegar en Vercel ni tocar otras ramas.

### 12/10/2026: paridad verificada con Showcase Stream y tiempo de Animos

- Página pública original: https://animos.app/editor?scrollTo=multiscene . En **Showcase Stream** se observan 12 slots, 16s, ring tilt −28°, ring opening 55%, ring size 80%, card size 21%, back fade 70%, perspectiva 18%, padding 6%, radio 3%, ratio de imagen Auto. El código ya respetaba los números excepto **tilt 0°** y **ratio 16:9**. Se corrigieron **solo los defaults del preset Showcase Stream**, sin migrar proyectos guardados.
- Controles originales de tiempo disponibles: presets 5, 10, 15, 20 y 30 segundos, incorporados de una vez a las plantillas procedurales; regla y fotogramas clave expresados en segundos durante reproducción por tiempo. En Scroll siguen como porcentajes. Todo funciona sobre el progreso previo, sin motor adicional.
- CI previa #38259124120: 53 de 55 suites pasaron. Fallaron `editor` por expectativa de catálogo vieja y `grid-dive` por uso incorrecto de `page.$eval` al contar botones. Se corrigieron las pruebas y se agregaron verificaciones de fidelidad. No dar por aprobada la nueva CI hasta consultar el resultado.
- Priorizar diferencias reales y documentables, no dedicar avances a controles secundarios inventados. Grid Dive y Pop Parade siguen provisionales hasta consultar movimiento/panel auténtico.

### 12/10/2026: formatos del lienzo y restauración del inspector

- Referencia directa [Animos](https://animos.app/editor): seis botones de relación del marco (16:9, 4:3, 1:1, 4:5, 3:4, 9:16) y «Reset settings».
- Los **seis formatos** se incorporan como botones que actualizan el selector `frameRatio` existente, sin bifurcar la configuración ni la exportación.
- «Restaurar ajustes de animación» restablece **de una vez** la configuración visual y los keyframes de parámetros a los defaults reales de la fábrica de cada preset; **no borra** imágenes, textos, orden, encuadres, duración ni modo Tiempo/Scroll. Los cambios continúan siendo borrador hasta insertar/guardar.
- Una comprobación JavaScript con Showcase Stream confirmó que el reset vuelve a `ringTilt:-28` y `cardRatio:'auto'`, borra keyframes, deja duración 20s y conserva elementos. Hay prueba de navegador añadida a suite `showcase` para formato, restauración, inserción/reapertura y otro preset (Grid Dive), pendiente de GitHub Actions.
- Prioridad principal intacta: fidelidad real al catálogo de Animos basada en referencias originales, no nuevas ideas secundarias ni nuevos nombres duplicados. Sin merges ni despliegues.

### 12/10/2026: controles de medios verificados y compartidos

- El editor original [Animos](https://animos.app/editor?scrollTo=multiscene) muestra «Clear images» en «Media · 12 slots» y formatos de **tarjeta** Auto, 1:1, 4:3, 3:4, 4:5, 16:9, 9:16. Se implementaron ambos en una sola etapa para composiciones procedurales.
- Vaciar mantiene todas las posiciones animadas con un solo SVG transparente local de 8×8, marca persistente `nwStreamEmpty`, encuadres, orden, superposiciones, duración, edición e inserción/exportación. Los archivos nuevos sustituyen solo sus posiciones y vuelven a activar su miniatura.
- Atajos de proporción de **imagen** reutilizan `cardRatio`; no duplican el renderer ni el modelo. Ya existían atajos de proporción del lienzo.
- CI del commit previo `237352db`: **55/55 pruebas pasadas**, run [38267707174](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38267707174). Nuevo browser smoke para vaciar, cargar dos de 12, reabrir e insertar pendiente de la nueva CI. Las referencias visuales originales de Grid Dive y Pop Parade todavía no están accesibles; evitar afirmar fidelidad.

## Política permanente de despliegues (12/10/2026)

**Vercel se usa solo si el usuario solicita expresamente una publicación.** Esta rama tiene `vercel.json` con `git.deploymentEnabled: false` para evitar que commits, pruebas, documentación y actualizaciones de datos consuman Deployment Storage. Ejecutar QA local o en GitHub Actions, sin llamar a Vercel como parte de un avance normal. No quitar ni cambiar esa configuración, tampoco en ramas derivadas, salvo autorización explícita. `[skip ci]` no bloquea Vercel. No eliminar despliegues existentes ni modificar el proyecto de Vélez Data. Mantener esta decisión cuando se actualice el contexto.


### 12/10/2026: estabilización de imágenes vacías y carga en cada slot
- CI anterior [#38280176050](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38280176050): **54 de 55 jobs exitosos**; el único fallo de `showcase` era la línea 36 del test `nagweb-motion-clear-media-smoke.mjs` que todavía utilizaba `page.$eval` al mapear una lista, pese a haberse publicado un parche anterior. El nuevo lote cambia expresamente la línea a `page.$$eval`.
- Los slots con `nwStreamEmpty` conservan su geometría en preview e instancia/exportación, pero el renderer no rasteriza su textura ni sombra; el canvas queda invisible y se limpia para evitar imágenes fantasma.
- Carga de imagen individual mediante arrastrar y soltar directamente sobre el slot del panel de capas o su ficha, reutilizando la ruta actual `labLoadImage`, con bloqueo durante otra carga. Referencia de interfaz: «Drop or click to add» de https://animos.app/editor .
- La nueva prueba cubre vaciar los 12 slots, activar sombra, subir dos SVG por lote y un tercero por drop, dejar nueve vacíos, insertar y reabrir. Solo dar por superada la prueba browser cuando GitHub Actions lo confirme. Grid Dive y Pop Parade continúan sin validación visual de fidelidad al original.
- **Respetar la política de Vercel manual solamente** documentada en esta ficha y el `vercel.json` actualizado por otro frente; no revertirla ni disparar despliegues.

## Informe de originales verificadas (14/10/2026)

Se inspeccionó directamente el HAR original de Animos (24 solicitudes y 64 presets identificados), dos grabaciones de pantalla y el WebM de Showcase Stream, todos recuperados de la Biblioteca personal. Se verificaron metadatos, controles del inspector y diferencias entre videos de interfaz y exportación. **Detalle de fuentes, observaciones, los 64 identificadores y el procedimiento de consulta de commits/CI:** [NAGWEB_02_REFERENCIAS_ORIGINALES_VERIFICADAS.md](NAGWEB_02_REFERENCIAS_ORIGINALES_VERIFICADAS.md). No se subió el HAR ni los videos al repositorio público. Para versiones nuevas revisar siempre la rama GitHub y no pedir todos los originales indiscriminadamente.

### Ajuste geométrico de Showcase Stream y caché de envolvente (15/10/2026)

- Las tarjetas curvas de Showcase Stream ahora se mantienen dentro de la zona segura definida por el formato del lienzo y `padding`, incluso con perspectivas altas y tarjetas grandes. La envolvente considera una vuelta completa para que el anillo no cambie de escala simplemente por girar; las configuraciones habituales mantienen su tamaño anterior.
- La envolvente de perspectiva se calcula solo cuando cambian los parámetros geométricos relevantes y se reutiliza durante la reproducción. La caché tiene un límite de 32 configuraciones, para evitar crecimiento indefinido con keyframes.
- Regresión añadida al test `.github/nagweb-motion-showcase-geometry.mjs`: 162 combinaciones de formatos, tamaños, perspectiva y progreso, además de la cobertura de radios, loop y scroll preexistente. El smoke incluye este test exclusivamente en la suite `showcase`/`all`; no correrlo 55 veces por ejecución.
- Validación ejecutada en JavaScript sobre el código real: 162 casos sin desbordes y 162 resultados geométricos idénticos antes y después de añadir la caché. Medición orientativa en este entorno para 240 evaluaciones: 71 ms sin caché y 53 ms con caché; no equivale a benchmark de navegador. Los resultados del navegador/CI deben leerse en GitHub Actions, no inferirse de estas comprobaciones.
- Los videos originales de Animos ya tienen informe verificado; estos cambios estabilizan la geometría y no certifican fidelidad visual exacta con el original. Próximo trabajo central: comparación visual de Showcase Stream y después corrección de grupos de composiciones.


### 15/10/2026: corrección porcentual de Showcase y regresión geométrica ejecutable

- **Fidelidad de radio de esquina:** el control `cornerRadius` se expresa en porcentaje en la referencia de Animos (3 % de fábrica). Se corrigió su cálculo, que anteriormente podía representar más de 30 % del lado menor de la tarjeta, para aplicarlo al lado corto real: `min(cardW,cardH) * cornerRadius / 100`. Esta corrección es de geometría compartida de la composición, no un cambio de datos guardados. [Commit](https://github.com/decrackpichon-gif/NagWeb/commit/4c75956398e35fe9f7e81c05fbaa2f2f65c3e049).
- **Malla y profundidad:** la cantidad de subdivisiones se adapta a la perspectiva máxima de la tarjeta y el desempate del orden de superficies por `slot` es determinista. Respetar el trabajo posterior que se encuentre en el HEAD sobre encuadre y rendimiento; no revertirlo por documentación antigua.
- **Prueba reparada:** el primer borrador de `.github/nagweb-motion-showcase-geometry.mjs` recortaba el archivo justo en su comentario inicial, por lo que nunca ejecutaba el modelo. Se corrigió cargando el archivo completo; cubre proporciones, radios, mallas, opacidad, continuidad del loop y límites Scroll. [Commit](https://github.com/decrackpichon-gif/NagWeb/commit/99b7c34ff3477cd308637808664b722370965db7).
- **Integración de QA sin multiplicar jobs:** esta prueba se importa solamente en la suite `showcase` (o `all`) de `.github/nagweb-smoke.mjs`, utilizando la CI existente. [Commit](https://github.com/decrackpichon-gif/NagWeb/commit/ee2f9b11c5c369f9184fc53e78775adafcf10fdf). El smoke real del navegador incluye edición del radio y restauración del 3 % original. [Commit](https://github.com/decrackpichon-gif/NagWeb/commit/0680dd9ffc6065a918192b662690c1de8c6eb899).
- **Validación efectiva:** el modelo cargado desde la rama actual se ejecutó directamente en un entorno JavaScript aislado con la batería de aserciones del nuevo archivo: se recorrieron 648 superficies y 162 combinaciones adicionales registradas en el test vigente, sin fallos. Esto **no equivale** a una ejecución de GitHub Actions ni a una comparación visual con el video de Animos. Comprobar siempre la CI vigente antes de declararla aprobada.
- **Próxima prioridad:** QA visual en navegador del render con esquinas y perspectiva modificadas y contraste con el vídeo original de Showcase Stream; luego agrupar diferencias funcionales demostrables de otros presets. No sumar controles propios antes de terminar esa fidelidad, ni tocar Vercel.

### 15/10/2026: oclusión por segmentos curvos en Showcase Stream

- Se corrigió la superposición de tarjetas de Showcase Stream: el modelo proporciona profundidad individual para los segmentos curvos (`stripDepth`) y el renderer los compone ordenados utilizando el compositor compartido de NagWeb. Los 12 slots siguen siendo independientes para selección y edición, pero su dibujo se concentra en un lienzo global. Se reutilizan las texturas, sombras y sistemas existentes, sin motor de animación alternativo.
- Se amplió la prueba geométrica de Showcase para verificar los segmentos y sus profundidades; también se añadieron aserciones al smoke de navegador existente que verifican el compositor tanto en la previsualización como en el HTML exportado. La regresión del modelo se ejecutó y pasó; el smoke real de navegador queda pendiente de ejecución/estado de GitHub Actions. Nunca declarar la paridad exacta con Animos sin comprobar la referencia visual.
- Este cambio modifica renderización y orden de profundidad, no defaults ni archivos de proyecto. Próximo foco: comprobar visualmente la calidad de la composición, las uniones de tiras translúcidas y el comportamiento con tarjetas que se cruzan, antes de extender el mecanismo a más presets.

### 15/10/2026: atenuación por profundidad individual en Showcase Stream

- La atenuación `Back fade` de Showcase Stream conserva el control y su valor predeterminado, pero ahora se calcula por segmento de superficie curva (`stripAlpha`) a partir de la misma profundidad `stripDepth`. Esto corrige la discrepancia entre ordenar por segmento y aplicar opacidad única según el centro de la tarjeta. El compositor común utiliza esos valores solo cuando el modelo los proporciona; los demás presets mantienen su ruta anterior.
- La selección directa ignora segmentos con opacidad igual o inferior a 0,05, de forma consistente con las superficies prácticamente invisibles. No cambia los elementos, archivos guardados ni el funcionamiento independiente de las composiciones fuera del Director.
- Se verificaron con el modelo real 14.256 muestras de atenuación, 648 superficies de geometría y 162 situaciones extremas de encuadre. Se amplió el smoke de navegador para comprobar que las 12 tarjetas contienen datos válidos de opacidad por segmento, tanto en el editor como en el HTML exportado; GitHub Actions debe confirmar esa integración visual.
- El HAR y los tres videos de Animos ya están documentados en `NAGWEB_02_REFERENCIAS_ORIGINALES_VERIFICADAS.md`. La modificación es coherente con la atenuación de tarjetas posteriores observada, pero **no demuestra paridad visual exacta**. Evitar repetir investigación histórica. Próximo paso: examinar calidad de transparencia entre segmentos y contraste visual real en navegador antes de extender efectos a más presets.

### 15/10/2026: unión de segmentos translúcidos y resolución del compositor

- El renderizado curvo global de Showcase Stream ya aplica alfa por segmento y orden de profundidad. Para evitar la acumulación de opacidad en las uniones, se agregó un recorte por segmento únicamente en Showcase Stream, preservando el modo de solapamiento del compositor para otros presets. **Verificación visual pendiente:** comprobar que el recorte no introduzca líneas antialias en las uniones, usando capturas de GitHub Actions y los videos originales ya documentados.
- La resolución interna de los lienzos compartidos se limita a 4096 píxeles en su lado más largo, ajustando la densidad efectiva sin cambiar las dimensiones CSS ni el tamaño de los elementos. Evita multiplicaciones de memoria de lienzo en 4K/8K y conserva la resolución normal a 960x540/DPR2.
- Se amplió el smoke de Showcase Stream para detectar lienzos totalmente transparentes y buffers excesivos, tanto en previsualización como en exportación. Se ejecutaron localmente las regresiones puras de modelo, que pasaron 14.256 muestras de alfa, 648 superficies geométricas y 162 escenas de encuadre. La sintaxis del renderer y del smoke también se verificó. **No se ejecutó el smoke real en navegador localmente**, y las corridas existentes de GitHub Actions deben comprobarse antes de informar aprobación.
- Próximo objetivo de mayor impacto: comprobar visualmente la composición curvada y avanzar con fidelidad documentada de otros presets, sin sumar más controles de importación ni volver a investigar el HAR/video.

### 15/10/2026: radio de esquinas por tarjeta, familias normalizadas y CI incremental

- Se corrigió un criterio transversal de los presets Animos: el control **radio de esquinas (%)** debe calcularse respecto del lado más corto del contenido/tarjeta y no respecto del lienzo, que cambiaba el resultado según formato o tamaño de escena. Se normalizaron 35 presets de 5 familias: anillos/carruseles/espirales/foco; globos/paredes/vórtices; transiciones por máscaras y paneles; trayectorias narrativas; grillas, mosaicos, collages y reels. Las correcciones se aplican al renderer del modelo, sin cambiar la estructura de los archivos guardados. Pueden variar los radios visibles en proyectos anteriores porque antes el porcentaje se interpretaba incorrectamente.
- Se compararon programáticamente 480 poses de anillos y carruseles, 140 de globos, 75 de transiciones, 105 narrativas, y 90 de grillas, preservando cantidad de slots, posiciones, tamaños, profundidades y opacidades de tarjeta. Los nuevos controles transversales ejercitan otras 210 combinaciones sobre 35 presets, en ambos formatos de lienzo; todas esas comprobaciones locales pasaron.
- Prueba agregada `.github/nagweb-motion-corner-percent-model-test.mjs` e integrada para ejecutarse **una sola vez** en la suite `procedural` o `all`, no en cada uno de los 55 jobs. Se ejecutaron comprobaciones equivalentes con el modelo JavaScript real; no implica ejecución del nuevo `.mjs` con Node ni validación visual en navegador.
- La matriz de 55 suites del workflow `.github/workflows/nagweb-smoke.yml` conserva su cobertura, pero ahora usa `concurrency` por rama con `cancel-in-progress: true` para abandonar ejecuciones antiguas cuando hay nuevos commits. Comprobar resultado del HEAD en GitHub Actions; es normal que corridas previas figuren canceladas. No modificar configuración de Vercel ni otras ramas.
- Próximo foco: validar los smoke de las nuevas familias y comparar visualmente con los originales verificados, especialmente escala de esquinas en las tarjetas y ausencia de artefactos en máscaras, antes de incorporar nuevos presets.

### 15/10/2026: corrección de referencia HAR y diagnóstico real de CI

- **Corrección a la entrada anterior sobre radios:** la generalización de «radio de esquinas (%) = porcentaje del lado corto de cada tarjeta» a 35 presets no estaba justificada por las referencias. El oráculo original de `.github/fixtures/animos-grid-strip-reference.mjs`, procedente del HAR, calcula `Math.min(width,height)/100 * cornerRadius` como unidad base de escena (con límites geométricos particulares según preset), por lo que la supuesta normalización cambió la fidelidad original. **Se restauró la geometría anterior** de esos 35 presets tomando la fuente de la rama previa a los cambios y preservando el nuevo identificador de Showcase Stream. Se compararon 420 poses contra el modelo de referencia previo; sin diferencias geométricas.
- **Runtime Showcase Stream corregido:** `createStreamModel().config({kind:'showcase-stream'})` descartaba `kind`. El compositor global por segmentos no podía reconocer la plantilla y fallaba la prueba de previsualización. Se conserva explícitamente ese identificador para proyectos que lo suministran; la geometría de loop/scroll anterior se mantiene.
- **CI diagnosticada a partir de logs reales:** ejecuciones recientes de 55 jobs fallaban todas por un único test de Vortex con expectativa fija `7.2` que se había vuelto obsoleta durante la modificación del modelo. La validación del oráculo original y el cálculo esperado fueron restaurados. Otro run anterior tuvo una falla de expectativa en Grid Zoom Strip, también relacionada con la geometría de esquina desviada del HAR; el modelo original fue restaurado, sin falsear el fixture.
- La prueba transversal de 35 presets ahora comprueba que cambiar el radio no altera posiciones ni animaciones, **sin imponer una fórmula uniforme falsa**. Se verificaron 210 configuraciones; el test completo de Vortex también pasó en ejecución JavaScript.
- El runner `.github/nagweb-smoke.mjs` importaba **64 pruebas de modelo en cada una de sus 55 suites**. Ahora los oráculos de modelo corren una vez en `procedural` (o `all`), y las suites de navegador permanecen independientes. Evita 55 falsos fallos por una única expectativa compartida. Comprobar el resultado final de la CI de GitHub Actions y no declarar verde por verificaciones parciales.
- El HAR original y sus fixtures verificables son la prioridad frente a una generalización estética inventada. Mantener los controles propios nuevos separados de los parámetros originales. No hacer merges ni despliegues Vercel.

### 15/10/2026: cierre funcional Motion Lab 1.0, sin expansión de alcance

- **Prioridad acordada:** dejar de introducir controles nuevos, nuevas animaciones originales y microetapas sin impacto. El objetivo inmediato es **terminar una versión 1.0 funcional**, no garantizar paridad visual absoluta de los 64 presets para los cuales no hay videos completos verificables. Paridad con originales solamente cuando existe referencia comprobable; documentar excepciones sin inventar capturas o funciones.
- **Criterio de cierre 1.0:** las plantillas incluidas deben poder elegirse, previsualizarse, personalizarse, insertarse en una escena, volver a editarse y seguir funcionando tras guardar/exportar, tanto en reproducción por tiempo como en modo scroll cuando corresponde; sin errores bloqueantes en las pruebas del HEAD. Mantener la prueba de referencia del HAR y la comparación del Showcase cuando estén disponibles, sin recrear una investigación histórica.
- **Bloqueador diagnosticado mediante GitHub Actions:** el run `38745985379` terminó con **54 de 55 jobs exitosos**. La única falla `browser-smoke (procedural)` fue la aserción `Depth-composited Showcase output exists`. Causa en el código: `streamData(s,c)` validaba el template, pero lo serializaba mediante una segunda enumeración incompleta que omitía `showcase-stream` (también `spread-columns`). Aunque la configuración del modelo ya preservaba `kind` si lo recibía, el editor había creado Showcase sin `kind` y el exportador no lo reconstruía. Corregido en el serializador: **una sola lista valida templates y todos se exportan con `kind:c.template`**. Conserva composiciones antiguas sin kind; los nuevos Showcase también lo guardan explícitamente.
- Se agregó regresión en `.github/nagweb-stream-model-test.mjs` para detectar pérdida del identificador en preview/export, recuperación de Showcase antiguo, persistencia de nuevas composiciones y conservación de controles. Las comprobaciones JavaScript de esa regresión pasaron, pero **GitHub Actions del HEAD nuevo debe terminar para certificar la integración en navegador**.
- **Regla de cierre:** si la CI del HEAD queda verde y los flujos esenciales siguen validados, cerrar 1.0 y registrar diferencias visuales no bloqueantes en una lista finita, sin prolongar indefinidamente Showcase ni cada preset. No desplegar ni fusionar ramas sin autorización.

# NAGWEB 01 | Editor principal

## Criterio universal de aceptación real (16/10/2026)

**Nueva decisión del usuario, posterior a cualquier declaración anterior de «V1.0 cerrada».** Consultar la [política universal de recuperación y aceptación](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md). Para **NAGWEB 01 | Editor principal**, preservar el código y las funciones que ya servían, corregir fallos reales del uso principal antes que agregar tareas y probar el **mismo acceso/paquete/servidor/navegador** que recibe el usuario junto al ciclo de edición, guardado/recarga y exportación relevante. Una CI verde significa a lo sumo *candidata técnica*; la V1.0 no está **aceptada** hasta que haya una aceptación de uso real confirmada. Toda falla observada posteriormente deja el estado *no aceptada* hasta corregir la causa; no repetir sin razón la validación íntegra ni rehacer trabajo. Esta política no cambia la identidad de la rama ni autoriza mezclas, Vercel o merges. **No se afirma por este cambio documental haber auditado o aceptado manualmente este frente.**


> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

## Directiva máxima de producción: versión 1.0 primero (15/10/2026)

**Decisión general del usuario, prioritaria también para este frente:** terminar una V1.0 **estable, funcional y entregable**, en el menor tiempo y con la menor cantidad de trabajo innecesario. Congelar el alcance en el recorrido esencial, resolver bloqueantes reales de manera transversal, ejecutar la comprobación final pertinente y **cerrar la versión**. No proponer nuevas funciones, recursos, efectos, opciones, controles ni tareas de pulido no bloqueantes antes del cierre; registrarlas como V1.1+.

Esta regla **prevalece sobre prioridades antiguas de expansión** de esta ficha, sin derogar funcionalidades comprometidas que resulten imprescindibles para una V1.0 útil. Consultar la [política universal de desarrollo](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md). No mezclar ramas ni adelantar merges o despliegues sin autorización.

## Identidad inmutable y ramas

- Proyecto: **NAGWEB 01 | Editor principal**.
- Producto general: **NagWeb**, repositorio [https://github.com/decrackpichon-gif/NagWeb](https://github.com/decrackpichon-gif/NagWeb).
- Rama propia de desarrollo: [`feat/storytelling-engine-v2`](https://github.com/decrackpichon-gif/NagWeb/tree/feat/storytelling-engine-v2).
- HEAD de referencia (04/10/2026): [`ed98713506b669bed1f0fedaf5731594880ff577`](https://github.com/decrackpichon-gif/NagWeb/commit/ed98713506b669bed1f0fedaf5731594880ff577). **Puede cambiar** mientras otros chats trabajan.
- Base histórica: `feature/creativos-v14` (HEAD 67dcf5f75c0f39540ae575643f60b1d7be605180). `main` conserva un V1.3 antiguo, no es el estado de las funciones actuales.

## Documentación técnica ya existente en GitHub

- [`docs/storytelling-engine-v2.md`](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/docs/storytelling-engine-v2.md)

Esos documentos **ya existen** en sus ramas y suelen tener muchos más detalles de implementación. Consultarlos antes de planificar. Esta ficha agrega el contexto de producto, las referencias y la política de continuidad que faltaban.

## Objetivo final

Editor **visual y profesional** para construir sitios y narrativas inmersivas con edición directa en lienzo. Mover, posicionar, rotar, escalar y editar textos, imágenes, botones, escenas y elementos internos sin programar. Unificar Creativos e Interactivos como recursos de calidad, personalizables y reutilizables. Mantener compatibilidad entre escenas, componentes, keyframes, responsive, vista previa, guardado y exportación.

## Prioridad de cierre acelerado (15/10/2026)

**Decisión explícita del usuario:** cerrar **NAGWEB 01 | Editor principal** lo más pronto posible. No continuar una expansión indefinida de recursos, mockups, variantes, controles ni efectos por iniciativa del asistente. Esta decisión de producto tiene prioridad sobre sugerencias históricas de «añadir más recursos» que figuran debajo; lo documentado previamente sigue implementado y no debe deshacerse.

**Alcance de cierre de esta rama:**
- Validar un flujo real y completo de autoría: crear o abrir un sitio, agregar y editar directamente elementos esenciales en el lienzo (texto, imagen, botón y partes ya implementadas), organizar escenas, vista responsive, guardado/reapertura e historial, previsualización, publicación mediante **exportación funcional del sitio**. Incluir Director de Scroll y contenedor universal **solo hasta confirmar su funcionamiento actual**, no ampliar sus catálogos.
- Corregir de forma **agrupada y transversal** únicamente defectos que impidan o deterioren significativamente ese flujo. Ejecutar una verificación de extremo a extremo y CI relevante. No introducir una tarea nueva por cada recurso ni verificar una y otra vez el mismo comportamiento.
- Después de ese pase, preparar entrega clara de **NAGWEB 01 como versión funcional cerrada**: cómo ejecutarlo/probarlo, funcionalidades verificadas, limitaciones reales y problemas no bloqueantes para un backlog posterior. No llamar «terminado» a un estado sin comprobar la experiencia completa.
- **Fuera de este cierre**: crear animaciones nuevas, añadir recursos de catálogo, mejorar estética de cada plantilla sin que bloquee el uso, nuevas opciones por recurso y fusionar/integrar NAGWEB 02/03/04/05. Son proyectos o mejoras independientes y no deben convertir el objetivo de NAGWEB 01 en infinito.
- No hacer merge a `main` ni desplegar en Vercel sin permiso; desarrollar y cerrar en `feat/storytelling-engine-v2`.

**Última verificación al fijar este criterio:** HEAD funcional `ec1bc0baaf58c684168c241f2b33ccacd0848732` superó el smoke de GitHub Actions (ejecución `38687596223`). La aprobación de regresiones no equivale por sí misma a una aceptación visual de extremo a extremo.

## Trabajo y decisiones conocidos

- Director de Scroll con progreso 0→1, timeline interactivo, keyframes de posición/escala/rotación/opacidad/desenfoque, easing, edición por momento, vista previa y exportación.
- Contenedor universal/slots, sistemas de creatividad, comportamientos de elementos, profundidad CSS 2.5D, anclaje DOM→Three.js.
- Motion Lab se investiga por separado aunque sus antecedentes puedan figurar en `docs/storytelling-engine-v2.md`. No confundir lo implementado históricamente en la rama 01 con el proyecto Motion Lab independiente 02.
- Feedback de UX original: selección y movimiento internos, Hero por capas, Historia sticky, Cinta cinética, paneles y ventanas flotantes, corrección de keyframes editables por momento.

## Decisión de producto: edición adaptable en el Hero (12/10/2026)

- **NAGWEB 01** usa el motor de transformación de partes ya existente; no introduce otra cámara, timeline ni motor de animaciones.
- En **Hero por capas**, las piezas reposicionadas a partir de este avance guardan `x/y` en píxeles junto con `refW/refH`, las dimensiones del Hero en el momento de edición. El HTML del sitio usa esas referencias para calcular coordenadas relativas al ancho y alto del Hero. La previsualización también recupera esa geometría durante las transformaciones.
- **Compatibilidad retroactiva:** `__parts` antiguos sin `refW/refH` siguen usando desplazamientos en píxeles. Los elementos de otros widgets no cambian su modelo de posición.
- **Disposición móvil independiente (12/10/2026):** cuando el Hero se edita a un ancho de **600 px o menos**, mover, girar o escalar una pieza guarda su pose en `__partsMobile[partName]`, con sus propias referencias `refW/refH`. La pose de escritorio sigue en `__parts[partName]`. El CSS del widget conmuta mediante `@container (max-width:600px)`, tanto en la vista previa como en la exportación, sin runtime adicional.
- **Herencia y restauración:** una pieza sin `__partsMobile[partName]` hereda el diseño de escritorio; «Restablecer móvil» elimina solo ese override, conservando escritorio y Deshacer/Rehacer. Las escenas anteriores no requieren migración. Para editar la variante móvil, usá la vista previa estrecha existente; el punto de corte lo determina el ancho real del Hero, no un segundo selector.
- **Validación:** GitHub Actions [ejecución 38271235646](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38271235646) aprobó la batería completa, incluyendo cambios independientes, CSS de exportación, guardado, restauración e historial.
- La raíz `.nw-lh` actúa como contenedor de tamaño para unidades `cqw`. Mantener este contrato en edición, guardado, responsive y exportación. El sistema de profundidad/parallax propio del Hero y el Director de Scroll siguen independientes.
- Los cambios funcionales se introdujeron en `js/nagweb-feedback-v16.js` y `js/nagweb-v14-direction.js`, con regresiones en `.github/nagweb-editor-parts-smoke.mjs`. Confirmar los resultados actuales de CI consultando el HEAD de la rama.

## Decisión de producto: recuperar y ordenar capas superpuestas (12/10/2026)

- En el **Hero por capas**, las fotografías tienen un orden base explícito; «Al frente» y «Al fondo» lo pueden cambiar y persistir mediante `z` en la entrada de `__parts` (escritorio) o `__partsMobile` (móvil). El CSS exportado conserva ambas variantes sin sumar un motor visual nuevo.
- Al terminar un cambio de orden, el modo de aislamiento de edición vuelve a «Todos» para mostrar el orden real y no la elevación temporal usada para manipular la pieza seleccionada.
- Si una pieza se desplazó completamente fuera del rectángulo visible del Hero, el Modo Editor ofrece **«Recuperar»** dentro del área visible y calcula el desplazamiento para centrarla. Conserva escala, giro y orden, respetando la variante de pantalla activa.
- No confundir esta recuperación con la opción **«Restablecer»**: la primera rescata la ubicación sin borrar la composición de la pieza, mientras que la segunda restaura sus transformaciones.
- Archivos: `js/nagweb-feedback-v16.js`, `js/nagweb-v14-direction.js` y `.github/nagweb-editor-parts-smoke.mjs`. Consultar el CI del HEAD para conocer el estado de validación, no presumir éxito por el commit.

## Decisión de producto: textos flotantes dentro del Hero (12/10/2026)

- **Modo Editor, Hero por capas:** una acción contextual **«Liberar texto»** desacopla antetítulo, título, descripción o texto extra de la columna automática y lo convierte en un elemento `position:absolute` hijo directo del Hero. Se preservan su contenido, estilo, transformación, edición directa y los demás textos de la columna.
- Para evitar saltos iniciales, la liberación captura el centro y el ancho real del elemento y registra `__parts[nombre].free`, `fx`, `fy`, `fw` y `refW/refH`. El HTML exportado utiliza `cqw` y `--h` sin runtime nuevo. Los desplazamientos `x/y` y el escalado siguen en el editor de partes existente.
- **«Volver a columna»** revierte solo el desacople y recupera el flujo editorial. La acción pasa por el historial de Deshacer/Rehacer. El control de liberación se ofrece en escritorio; el texto liberado conserva su posición proporcional en móvil y admite los desplazamientos móviles ya existentes.
- Los Heroes anteriores, sin `free`, conservan intacta su composición original; no hay conversión automática ni cambio de motor de scroll.
- Implementación en `js/nagweb-feedback-v16.js` y `js/nagweb-v14-direction.js`; regresión añadida a `.github/nagweb-editor-parts-smoke.mjs`. Verificar resultados de GitHub Actions antes de considerar validada la funcionalidad.

## Decisión de producto: ancho independiente de textos libres (13/10/2026)

- En el **Hero por capas**, un texto liberado puede ajustar **el ancho de su caja** arrastrando un tirador lateral (`.nw-wpart-h.width`), mientras que el tirador de esquina sigue escalando el bloque entero. El ancho no modifica `s` ni el contenido del texto.
- **Escritorio:** el ancho se conserva en `__parts[parte].fw` junto con `refW/refH`, y se exporta mediante la variable CSS proporcional `--nw-fw`.
- **Móvil (Hero ≤ 600 px):** el ajuste del tirador guarda solamente `__partsMobile[parte].fw`, sin alterar el ancho de escritorio; en la exportación, `--nw-mfw` tiene prioridad solo bajo el container query. Si no existe, hereda `--nw-fw`.
- El botón existente «Restablecer móvil» elimina el override de ancho móvil junto con el resto de sus variaciones, preservando la composición desktop. Deshacer/Rehacer siguen a cargo del historial de partes existente, sin motor paralelo.
- La geometría de textos libres se lee del ancho visible actual y se adapta al tamaño del Hero; los textos no liberados y composiciones antiguas no incorporan cambios de ancho.
- Código: `js/nagweb-v14-direction.js`, `js/nagweb-feedback-v16.js`. Regresiones de navegador en `.github/nagweb-editor-parts-smoke.mjs`. Consultar estado efectivo de Actions antes de considerar completada la validación.

## Decisión de producto: geometría adaptable de Historia sticky (13/10/2026)

- Se **generaliza a Historia sticky** el contrato de transformación de piezas que comenzó en Hero, sin introducir otro motor de scroll, alterar los capítulos ni duplicar el sistema de Deshacer/Rehacer.
- Cada rótulo `k1..k3`, título `t1..t3`, párrafo `c1..c3` e imagen `media-1..media-3` puede guardar coordenadas de referencia `refW/refH` en `__parts`. Los movimientos nuevos se exportan como desplazamientos relativos: X en unidades de contenedor `cqw` (ancho de Historia) e Y como fracción de `100vh` (alto del escenario sticky). Las coordenadas antiguas sin referencias conservan su interpretación en píxeles.
- La vista **móvil de Historia** usa el punto de corte de 720 px. Los ajustes realizados allí se guardan en `__partsMobile`, sin modificar las coordenadas de escritorio. Si no hay override móvil se hereda la posición de escritorio; «Restablecer móvil» elimina solo ese ajuste.
- El editor de partes reutiliza las mismas funciones `commitPart`, `partState`, `applyPart`, controles y selección por capítulo que Hero. El CSS responsive y el HTML exportado provienen de `js/nagweb-feedback-v16.js`. Validar selección, exportación, adaptación de tamaño y herencia con `.github/nagweb-editor-parts-smoke.mjs`.
- Queda pendiente trasladar a más composiciones la edición directa robusta de elementos internos, priorizando funcionalidades generales antes que pulir indefinidamente un único recurso.

## Infraestructura transversal: piezas internas de cualquier composición (13/10/2026)

- **Contrato compartido:** una composición puede declarar `data-nw-part-scope`, `data-nw-part-mobile` (ancho umbral), `data-nw-part-height` (selector del escenario que determina el alto) y `data-nw-part-y` (`var(--h)` o `100vh`). Los elementos editables usan `data-wpart` y el mismo almacenamiento `__parts` / `__partsMobile`.
- La lectura de coordenadas, variantes móviles, tamaño de referencia, serialización de CSS relativo y controles del lienzo se resuelven **una sola vez**: `partScope` en `js/nagweb-v14-direction.js`, `partTransformCSS` compartida y expuesta en `SCWX.partTransformCSS` desde `js/nagweb-feedback-v16.js`. Hero e Historia sticky utilizan el mismo contrato, conservando sus propios efectos y su historial.
- La acción **«Recuperar»** es transversal: puede centrar una pieza que quedó fuera del escenario visible en Hero, Historia sticky u otro contenedor compatible, sin reiniciar sus demás transformaciones. «Al frente / Al fondo» y «Liberar texto» siguen siendo controles específicos del Hero.
- Compatibilidad: los widgets previos con clases `.nw-lh` y `.nw-story` continúan funcionando sin los nuevos atributos. El CSS anterior sin `refW/refH` continúa en píxeles. Widgets nuevos deben definir sus reglas CSS de transformación y su selector de partes; no deben copiar las funciones de coordenadas existentes.
- No se alteraron ramas de Motion Lab, Cámara 3D, Interaction Studio ni Biblioteca de recursos. El director de scroll sigue siendo independiente. La prueba en navegador `.github/nagweb-editor-parts-smoke.mjs` cubre recuperación y geometría con alcance configurable.

## Primer recurso conectado al contrato compartido: Tarjeta holográfica (14/10/2026)

- **NAGWEB 01** conectó la Tarjeta holográfica (`holocard`) al motor universal de edición de partes, sin sustituir sus imágenes, video opcional ni la interacción 3D de reflejo/inclinación. Se mantiene el runtime original de puntero y la definición original de campos y variantes.
- En el Hero, Historia sticky y ahora la Tarjeta, el lienzo utiliza las mismas funciones de selección, arrastre, escala, giro, guardado, Deshacer/Rehacer y restauración. La tarjeta permite seleccionar **Imagen/video, Etiqueta, Título, Detalle y Botón**, además del contenedor de tarjeta, desde su barra contextual; los campos opcionales no se ofrecen si están ocultos.
- La tarjeta define `data-nw-part-scope="holocard"`, umbral móvil de **420 px** y un escenario `.nw-holo-card`; sus piezas utilizan el mismo `SCWX.partTransformCSS` y persistencia `__parts`/`__partsMobile`. La geometría se calcula sobre el **ancho útil sin padding**, haciendo que `cqw` corresponda con las coordenadas guardadas. Esto corrige una diferencia sistémica para futuras composiciones con padding.
- La barra, la selección haciendo clic en el lienzo y la restauración del foco comparten ahora el manejo de scopes genéricos de `js/nagweb-feedback-v16.js`. No se modificó el código fuente base de la biblioteca (`js/creatives-v14-batch5.js`) ni ninguna rama de NAGWEB 02–05.
- Regresión en `.github/nagweb-editor-parts-smoke.mjs`: prueba la tarjeta REAL, selección, composición, edición interna, guardado, escritorio/móvil, exportación, opciones de imagen/video y campos opcionales. Consultar CI del commit antes de declarar la validación definitiva.
- Próxima prioridad: ampliar el mecanismo de edición interna a más composiciones reales, agrupándolas cuando compartan una estructura sin crear un motor específico por recurso.

## Edición de composiciones de imagen reutilizando el motor compartido (14/10/2026)

- **Imagen revelada por el cursor** (`cursorreveal`) y **Lupa de detalle** (`detailmagnifier`) se integran al contrato común `data-nw-part-scope` mediante un **único adaptador** en `js/nagweb-feedback-v16.js`, sin alterar el código original de la biblioteca ni recrear sus herramientas de movimiento.
- La barra de edición selecciona independientemente **Imagen base / Imagen revelada / Etiqueta** y **Imagen / Texto**. Arrastre, escala, rotación, guardado, Deshacer/Rehacer, restauración móvil y exportación reutilizan `partTransformCSS`, `__parts` y `__partsMobile`. El umbral móvil es 600 px de ancho útil de cada figura.
- Se conservan imágenes reales, máscaras circulares, lupa, filtros de movimiento reducido, relaciones de aspecto, variantes y campos del modelo original. Durante la edición aislada de la capa revelada se muestra completa para que sea seleccionable, sin afectar la animación publicada.
- Ambos recursos usan una altura de referencia vinculada a su relación de aspecto, y la serialización proporcional comparte el mismo mecanismo usado previamente por Hero, Historia sticky y Tarjeta holográfica.
- Regresión extendida en `.github/nagweb-editor-parts-smoke.mjs`: prueba selección, geometría, guardado, exportación y herencia móvil/restauración en ambos recursos reales. Confirmar el estado de GitHub Actions del HEAD antes de considerarlo validado.

## Adaptador para composiciones reactivas de texto e imágenes (14/10/2026)

- **Titular con profundidad** (`depthheadline`) y **Mosaico magnético** (`magneticmosaic`) se conectaron juntos al contrato genérico de edición de partes internas. Cada línea del titular y cada fotografía del mosaico (más su etiqueta) disponen de selección, transformación por mouse, posición proporcional, variante móvil, Deshacer/Rehacer y exportación mediante el mismo motor existente.
- **Serializador unificado (14/10/2026):** `partStyleMarkup` limpia los valores de transformación antiguos en píxeles cuando el mismo elemento ya lleva `data-wpart`, conserva las propiedades ajenas (imágenes, colores, profundidad) y coloca **una sola pose efectiva** en el atributo `style`. Se reutiliza en Tarjeta holográfica, Revelado, Lupa, Titular con profundidad y Mosaico; evita que duplicados `--nw-tx/ty` anulen las coordenadas proporcionales. Regresión compartida con modelos heredados en el smoke del Editor.
- **Corrección sistémica:** antes las animaciones de puntero sobrescribían `element.style.translate`/`style.scale`, pisando o ignorando la posición diseñada. El adaptador nuevo diferencia la pose del autor (`--nw-tx`, `--nw-ty`, `--nw-ps`) y el desplazamiento efímero del puntero (`--nw-hover-x/y/s`) que se suma por CSS. También conserva las modalidades de perspectiva 3D, parallax, explosión y onda del titular mediante `--nw-hover-transform`.
- En edición la animación temporal queda pausada para poder arrastrar las piezas; el efecto sigue activo al publicar, y se respeta `prefers-reduced-motion`. Las composiciones previas siguen ofreciendo sus variantes y controles.
- Implementación en `js/nagweb-feedback-v16.js`, sin reescribir los recursos históricos ni cambiar las otras ramas. Regresiones reales de ambos widgets en `.github/nagweb-editor-parts-smoke.mjs`: selección, edición, guardado, CSS de exportación, composición del movimiento y escritorio/móvil. Verificar el CI exacto del HEAD antes de darlo por aprobado.
- Próxima prioridad: continuar agregando recursos a través de adaptadores comunes, y corregir defectos de geometría a nivel del motor, no multiplicar controles específicos.

## Contrato transversal para composiciones basadas en scroll (14/10/2026)

- **Media expandible** (`scrollzoom`) y **Cinta cinética** (`kineticstrip`) incorporan el motor compartido `data-nw-part-scope` a través de un adaptador único en `js/nagweb-feedback-v16.js`, sin reescribir el código base de sus recursos. El escenario de ambas composiciones es el contenedor sticky de altura de viewport y el umbral móvil es 720 px.
- En Media expandible se pueden seleccionar **medio, título inicial, indicación inicial**, además de las imágenes, rótulos, títulos y textos realmente presentes en cada momento narrativo. Las imágenes que no llegan a materializarse por una URL inválida o inaccesible no generan controles vacíos. En Cinta cinética se pueden seleccionar **rótulo y tarjetas individuales**. Ambas conservan sus mecanismos de avance por scroll, campos y variantes.
- Las poses autorales se guardan en `__parts`/`__partsMobile` con referencias adaptables y se exportan mediante `partStyleMarkup`. El scaling durante la salida de Media expandible se multiplica por la escala diseñada. La inclinación original de las tarjetas se suma a la rotación de la pieza.
- Los enlaces de tarjetas **no navegan durante la edición**, sin alterar los links publicados. En Media expandible, al seleccionar una parte de un momento que está oculto por el scroll, el modo de aislamiento lo muestra para que pueda editarse, sin modificar la secuencia narrativa publicada.
- Smoke de navegador agregado a `.github/nagweb-editor-parts-smoke.mjs`: casos reales de ambos recursos, capítulos dinámicos, selección, persistencia, exportación y variantes móviles, junto con sus movimientos originales. Consultar resultados de CI del HEAD antes de considerarlo aprobado.

## Adaptador compartido para Collage editorial y Moodboard (14/10/2026)

- **NAGWEB 01** incorpora **Collage editorial** (`editorialcollage`) y **Moodboard** (`moodboard`) al contrato `data-nw-part-scope` del editor, sin reconstruir el catálogo ni alterar `js/creatives-v14-batch1.js` o `js/creatives-v14-batch3.js`.
- Se reutilizan los `data-wpart` de fotografías declarados por el decorador histórico: `image-0..2` en Collage y `image-0..5` en Moodboard. Sus rótulos/pies también son seleccionables desde la misma barra, con arrastre, escala, giro, Deshacer/Rehacer, guardado y exportación compartidos.
- **Responsive real:** `__parts` conserva escritorio y `__partsMobile` guarda ajustes bajo los 600 px de contenido. El eje X usa `cqw` del contenedor de contenido; Y usa `var(--h)`, vinculado a la altura efectiva de la grilla y a sus variantes originales. Modelos heredados sin `refW/refH` conservan desplazamientos en píxeles.
- El adaptador respeta las composiciones, fondos, variantes y efectos históricos. `partStyleMarkup` elimina variables de transformación duplicadas por el decorador antiguo, sin alterar los valores ajenos. No genera barra de edición en HTML publicado.
- Código en `js/nagweb-feedback-v16.js`; regresiones añadidas a `.github/nagweb-editor-parts-smoke.mjs`. Verificar el resultado del CI del commit funcional vigente; esta nota documenta el alcance, no equivale a declarar la prueba aprobada.
- Próximo bloque recomendado: extender esta capacidad a otras composiciones preexistentes agrupándolas por estructura, priorizando las que ya tienen `data-wpart`, sin introducir una herramienta de transformación nueva.

## Contrato adaptable para composiciones de altura variable (15/10/2026)

- **NAGWEB 01** amplía el adaptador de edición interna ya utilizado en Collage/Moodboard a cuatro composiciones preexistentes: `splitfeature` (Split Feature), `floatingcaption` (Floating Caption), `casehero` (Case Hero) y `bentoshow` (Bento Show). Reutiliza sus `data-wpart` históricos, añade selectores para las piezas de texto que no eran manipulables y conserva sus variantes gráficas y el motor actual de historial.
- **Contrato nuevo, limitado a altura intrínseca:** `data-nw-part-y="100cqw"` permite almacenar desplazamientos Y proporcionales al ancho útil del contenedor en lugar de asumir una altura CSS fija; `partScope` considera `refH=refW` solamente en estos elementos. X y Y se exportan proporcionalmente con `partTransformCSS` y `partStyleMarkup`; los valores heredados sin `refW/refH` permanecen en píxeles. Los recursos que usan `var(--h)` o `100vh` no cambian.
- Cada composición puede editar fotografías, títulos y otros textos identificados mediante la misma barra contextual y los tiradores existentes. La barra es de posicionamiento absoluto para no convertirse en una celda nueva de las grillas o flexbox; se omite por completo en la salida publicada. Se conserva `__partsMobile` como versión independiente para ancho útil ≤ 600 px, con restauración e historial compartidos.
- Archivos: `js/nagweb-v14-direction.js`, `js/nagweb-feedback-v16.js` y smoke de navegador `.github/nagweb-editor-parts-smoke.mjs`. El estado definitivo de las pruebas debe comprobarse con GitHub Actions del commit funcional `62408d1e3bec30d17d0eba5207dd6ccb7a4dc9b4` (o con un HEAD posterior si hubo correcciones).
- Próxima prioridad: seguir generalizando composición/selección de partes en los recursos todavía no conectados, pero priorizar ahora consolidación y regresiones reales si aparecen en CI; no mezclar Motion Lab, Cámara 3D, Interaction Studio ni Biblioteca de recursos.

## Adaptador único para siete composiciones tipográficas y de identidad (15/10/2026)

- **NAGWEB 01** amplía el adaptador compartido de partes de `js/nagweb-feedback-v16.js`, ya utilizado por Collage, Moodboard y cuatro composiciones de altura variable, a siete recursos v14: `editorialposter`, `bignumber`, `pullquote`, `typespecimen`, `eventposter`, `splitstatement` y `brandboard`.
- El editor permite seleccionar y transformar las piezas tipográficas, imágenes y elementos gráficos internos de cada recurso, conservando los `data-wfield`, sus formatos y variaciones originales. En el tablero de marca también se identifican por separado los cuatro colores (`swatch-0..3`), sin alterar la paleta definida desde el inspector.
- La extensión reutiliza el contrato de `data-nw-part-scope`, `data-nw-part-y="100cqw"`, `partTransformCSS`, `partStyleMarkup`, `__parts` y `__partsMobile`, con el corte móvil de 600 px de ancho útil. El adaptador admite ahora selectores repetidos que asignan IDs de pieza deterministas, evitando crear un sistema paralelo.
- Se preservan retrocompatibilidad de desplazamientos en píxeles, historial, texto editable en el lienzo, CSS y contenido original. La barra contextual solo existe en modo editor, sin aparecer en la exportación.
- Regresión integrada en `.github/nagweb-editor-parts-smoke.mjs`: recursos reales, selección de partes, interacción del puntero, persistencia, serialización y edición móvil representativa. Comprobar el estado de <https://github.com/decrackpichon-gif/NagWeb/actions/runs/38687596223> antes de dar el bloque por validado.
- Próximo foco: tratar por separado los mockups y creativos que combinan gestos del puntero con transformaciones autorales, evitando que un efecto sobrescriba la pose manual, y consolidar defectos transversales cuando aparezcan en las pruebas.

**Registro detallado recuperado de los siete fallos:** [`NAGWEB_01_ACEPTACION_MANUAL_2026-10-16.md`](NAGWEB_01_ACEPTACION_MANUAL_2026-10-16.md). No solicitar nuevamente los resultados ni dar por aceptado el Editor hasta resolverlos.

## Guardado durable de proyectos grandes (16/10/2026)

- LocalStorage sigue como ruta rápida, pero una copia íntegra de cada guardado se escribe en una base IndexedDB independiente del historial de versiones. Si localStorage agota su cuota, el editor muestra el estado pendiente y confirma mediante la base durable; si fallan ambos, conserva una alerta persistente con descarga inmediata de JSON.
- Al iniciar, se compara la fecha de guardado local y durable; si la durable es más reciente se restaura antes de habilitar edición, sin sobrescribir el proyecto con un borrador antiguo. Escrituras durables serializadas para evitar regresiones por carreras.
- Importar JSON espera la confirmación de guardado durable antes de afirmar que el proyecto quedó almacenado.
- Se añadió regresión de navegador: documento con recurso mayor de 6 MB, guardado, F5 y recuperación. **La V1.0 continúa pendiente de aceptación manual**. Si el navegador bloquea todas las bases o se agota la cuota de IndexedDB, descargar el respaldo JSON.
- No se cambian otros frentes, ni se publica en Vercel.

## Estado de aceptación V1.0: NO ACEPTADA (16/10/2026)

**Corrección importante a la declaración anterior de «V1.0 terminada»:** el usuario ejecutó el checklist de siete flujos principales, **marcó los siete como fallidos y detalló las razones** en campos interactivos. Estos datos nunca fueron transmitidos al asistente porque el formulario sólo retenía estado local; además se perdió cuando cambió la conversación. **No se conocen las descripciones originales y no se deben inventar**. El usuario quedó obligado injustamente a repetir trabajo. Esta pérdida de reportes es una falla del asistente.

Los siete rubros rechazados fueron: 1) crear y editar páginas/escenas/capas, 2) deshacer/rehacer/recuperación, 3) Hero por capas, 4) escritorio/móvil, 5) Historia sticky, 6) Director de Scroll y keyframes, 7) guardado/recarga/exportación. No se puede inferir que todos los subpasos individuales fallaron; sí que **el usuario calificó las siete pruebas como fallidas**.

**Directiva de corrección:** NO llamar aceptada o terminada la V1.0 por pruebas automáticas aprobadas. NO volver a ofrecer formularios con estado local efímero; recopilar los reportes como mensajes reales o archivos adjuntos. NO pedir repetir las siete pruebas. Partir de una auditoría autónoma del recorrido con gestos reales y experiencia visible; si queda algún defecto no reproducible, solicitar sólo un ejemplo puntual por video/audio/captura. Registrar datos realmente recibidos en texto persistente y resolver los bloqueantes en bloques agrupados. La corrección de Cinta cinética está verificada automáticamente, pero no sustituye las otras siete pruebas rechazadas.

## Aceptación manual V1.0: observaciones del 16/10/2026

**Observaciones aportadas por el usuario:**
- **Tarjeta holográfica:** las funciones probadas operan correctamente. Desea agregar más textos, imágenes y otras piezas internas, **mejora pospuesta a V1.1+**; no bloquear la V1.0 por cantidad de elementos.
- **Collage editorial:** el usuario no identifica claramente el propósito y observó fotografías que parecían movibles incluso en el sitio publicado. Uso deseado: composición editorial de tres fotografías superpuestas, rótulo y pie; sólo se editan posiciones durante la autoría. Una prueba del HTML exportado comprobó que el arrastre sintético de una foto no modificó su posición (ejecución https://github.com/decrackpichon-gif/NagWeb/actions/runs/38942265581). Si el problema se repite manualmente, distinguir editor, Vista previa y HTML descargado antes de corregir.
- **Cinta cinética:** al desplazarse la página, el usuario pierde de vista la cinta. Se reprodujo en el HTML exportado cuando se inserta en **Lienzo libre**: el widget absoluto no ampliaba la altura de la escena, por lo que no quedaba una pista vertical para sticky. La misma prueba verificó que **en modo Apilada (flow) funciona**. Se implementó una corrección transversal que convierte sólo el widget de Cinta en un tramo con altura dentro de Lienzo libre, preservando la posición de sus elementos hermanos: `d1c07200616b99c01db4f78de9769165244b3a13`, suite de aceptación en `.github/nagweb-kinetic-acceptance.mjs`. Validación completa **aprobada**: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38943321838. La prueba real en Chromium verificó que la Cinta permanece en la misma posición vertical al 25 %, 50 % y 75 % del scroll, y que las tarjetas recorren la pista horizontalmente tanto en Apilada como en Lienzo libre. Collage público no registró movimiento por arrastre.
- La aceptación manual y los fallos marcados en controles interactivos deben quedar expresados también en texto para ser accesibles en chats nuevos. No inferir cuáles fueron las otras casillas seleccionadas si no se recibieron sus resultados.

**Criterio:** el cierre técnico del 15/10 es un hito de CI, no sustituye la aceptación de uso. Corregir defectos reproducibles de V1.0; las ampliaciones de producto quedan para después.

## Hito de cierre V1.0 (15/10/2026)

Documento de entrega y aceptación con alcance cerrado: [`docs/NAGWEB_01_ENTREGA_V1.md`](../NAGWEB_01_ENTREGA_V1.md). Se corrigió el bloqueo de descarga de JSON e HTML en navegadores sin integración especial (`8c4e318043168f93400ecc1681736507dded912a`). La verificación integral **aprobó** en GitHub Actions `38773384278` (15/10/2026): creación de página/escena/botón, guardado JSON/HTML en navegador corriente, recarga e importación, y batería original de historial, Director y partes. **NAGWEB 01 V1.0 se considera cerrada técnicamente en su rama**, sin merge ni despliegue; la revisión visual del usuario es una aceptación independiente. No continuar expandiendo recursos ni variantes mientras se completa el cierre funcional.

## Próximas prioridades (revisar con HEAD actual)

- Priorizar la experiencia de lienzo como herramienta de diseño, edición real de elementos anidados y uso de recursos sin degradar su editabilidad.
- Revisar el estado **real** del editor, defectos UX que queden abiertos, persistencia de escenas e inserción/edición/exportación.
- Definir el contrato de futura integración con Motion Lab, Cámara 3D, Interaction Studio y Biblioteca, sin hacer merges automáticos.

### Fuentes históricas recuperadas del Editor principal
- **Repositorio original aportado por el usuario:** https://github.com/decrackpichon-gif/NagWeb.git
- **Rama de storytelling:** https://github.com/decrackpichon-gif/NagWeb/tree/feat/storytelling-engine-v2
- **Archivos históricos accesibles por nombre en la Biblioteca de esta cuenta:** `Scrollcraft_1.1_creativos_extra.html`, `Scrollcraft_1.2_catalogo_creativos_baul.html`, `Scrollcraft_1.3_interactivos_agrupados.html`, sus ZIP equivalentes, `Scrollcraft — taller de sitios con scroll en 3D 1.0.zip` y `Web Scrollcraft — taller de sitios con scroll en 3D.zip`.
- **Incluido como copia de referencia en este paquete:** `materiales_recuperados/Scrollcraft_1.3_interactivos_agrupados.zip` (versión histórica, **no** reemplaza el HEAD más reciente en GitHub).
- Otros enlaces históricos del equipo de asistentes (no identificados como enlaces enviados personalmente por el usuario): https://nag-5oliq781j-nahue2.vercel.app y https://nagweb-git-feat-storytelling-engine-v2-nahue2.vercel.app . Son vistas previas antiguas, no fuente de verdad.
- **Referencia interna del repo a inspeccionar:** `js/nagweb-story-model.js`, `js/nagweb-story-editor.js`, `js/nagweb-workspace-v16.js`, `js/nagweb-behaviors-v2.js`, `docs/storytelling-engine-v2.md` si existen en el HEAD elegido.
- **Pendiente:** no se pudo reconstruir un inventario exhaustivo de todos los enlaces de los chats del Editor. No simular que estos son todos.

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

## Referencias originales auditadas (14/10/2026)

Se contrastaron los antecedentes del Editor principal con la rama `feat/storytelling-engine-v2`, el inventario histórico recuperado y los archivos Scrollcraft identificados en Biblioteca. **Ver [`NAGWEB_01_REFERENCIAS_ORIGINALES_VERIFICADAS.md`](NAGWEB_01_REFERENCIAS_ORIGINALES_VERIFICADAS.md)** para URL literales recuperadas, origen (usuario / despliegue generado / GitHub), prototipos antiguos y límites de la recuperación. El inventario **no es exhaustivo** y **no bloquea nuevos avances**: usar el código/CI del HEAD real y pedir un enlace histórico individual únicamente si es imprescindible. No atribuir al usuario enlaces encontrados solo en HTML/código ni mezclar este proyecto con Motion Lab.

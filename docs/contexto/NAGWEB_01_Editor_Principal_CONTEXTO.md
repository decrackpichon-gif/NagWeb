# NAGWEB 01 | Editor principal

> **Ficha de continuidad de producto, decisiones y referencias.** Actualizada 11/10/2026 a partir de documentos y ramas comprobadas. No reemplaza el código ni el historial Git. Toda cifra de estado es una **fotografía** y hay que verificar cambios posteriores.

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

# Secuencias narrativas

1. Activá **Director de scroll** en la escena y elegí su duración.
2. Seleccioná un elemento. En **Momento en la historia**, elegí **Crear keyframes del recorrido** o un punto de partida de movimiento.
3. Hacé doble clic en una pista para agregar un momento. Seleccioná el rombo y editá posición, escala, rotación, opacidad, desenfoque e interpolación.
4. Arrastrá el rombo para cambiar su momento. Las flechas lo mueven 0,1%; Shift + flecha, 5%. Delete o Backspace elimina el punto cuando tiene foco, sin borrar el elemento.
5. Usá **Ver un momento**, **Reproducir secuencia** o **Volver al scroll real** para revisar el recorrido.

Los valores se aplican sobre el diseño base: movimiento 0, escala 100% y opacidad 100% lo conservan. La interpolación de cada punto controla el tramo hacia el siguiente. Antes del primer punto y después del último se mantiene su estado; agregá opacidad 0 si querés ocultar el elemento fuera de ese intervalo.

**Agregar permanencia** duplica el estado seleccionado unos puntos más adelante. La línea debajo de dos estados iguales indica una permanencia. El campo de duración permite ajustarla antes de crearla.

**Marcador aquí** crea un momento narrativo de la escena, con nombre y porcentaje editables. Arrastralo o usá sus flechas; Delete/Backspace lo elimina cuando tiene foco. Los keyframes se ajustan a marcadores a menos de 2%. Desactivá **Ajustar a marcadores** o mantené Alt mientras arrastrás para evitar el ajuste.

Para escalonar, seleccioná varios elementos en el lienzo o con Shift + clic sobre nombres de pistas. **Secuencia seleccionada** permite elegir la primera entrada y la separación. Sigue el orden de las pistas, incluye hijos válidos de Escena universal y excluye contenedores universales, elementos fijos, modales y luces. Si un recorrido excede 100%, se comprime conservando todos sus estados; si no caben las entradas, avisa sin modificar nada.

Los seis puntos de partida de movimiento modifican keyframes del elemento seleccionado. No crean componentes. **Usar recorrido anterior** conserva los keyframes guardados y reactiva los parámetros del Director anterior. La conversión inicial del recorrido anterior toma muestras de sus momentos principales: revisá las curvas si necesitás reproducir exactamente un movimiento complejo.

En **Comportamientos aplicados** podés pausar, reactivar y editar una receta. Pausar restaura los valores anteriores de las propiedades que controlaba. Las recetas que comparten una propiedad se alternan; Revelar y Parallax pueden convivir porque controlan opacidad y movimiento vertical. Los valores de una receta aplicada sobre keyframes se editan en la pista. Una receta antigua no elimina keyframes creados después.

## Compatibilidad y límites

- No se migran ni borran los parámetros antiguos. Una pista sin keyframes activos usa el evaluador anterior.
- Se admiten hasta 512 keyframes por elemento y 128 marcadores por escena, con precisión de 0,1%. Los puntos no se cruzan ni coinciden; ampliá el intervalo antes de insertar otro.
- El Director mantiene su alcance en escenas verticales. Las escenas horizontales y la navegación fija quedan fuera de las transiciones narrativas.
- Escena universal compone sus reacciones con el Director, también en hijos anidados. El reparto automático nunca mueve el contenedor universal junto con sus hijos; dirigir el contenedor manualmente sigue siendo posible.
- Movimiento reducido neutraliza desplazamiento, escala, giro y desenfoque añadidos, conserva el diseño base y mantiene la visibilidad narrativa. Las transiciones se vuelven cortes y el video deja de buscar posiciones automáticamente.
- El scrub de video requiere un video nativo con duración disponible. La fluidez depende de su codificación; usá fotogramas clave frecuentes para buscar posiciones con precisión. YouTube/Vimeo no exponen este control.
- Las transiciones conservan el espacio de cada escena y componen entrada y salida. Revisá escenas con fondos transparentes y contenido que exceda la altura de pantalla, especialmente en móvil.
- El anclaje 3D existente sigue el elemento animado. No se agregan importadores de modelos, un editor 3D ni interpolación geométrica entre objetos.

## Mantenimiento

`nagweb-story-model.js` contiene el registro de propiedades y la función pura de evaluación. El Director serializa esa misma fábrica una sola vez en la página exportada y usa su evaluador para scroll, scrub y reproducción. El editor de la timeline y las configuraciones de comportamientos no agregan motores visuales. Los marcadores y los estados de edición no se exportan.

El proyecto persiste `sdKeyframes`, `sdKeyframesEnabled`, `sdBeats` y `nwBehaviorConfig`. `nwBehaviors` conserva los IDs compatibles con versiones anteriores. Los campos activos del elemento siguen siendo la fuente de valores del runtime; las configuraciones guardan activación y estados previos para poder pausar una receta.

Validación: `.github/nagweb-smoke.mjs` carga las pruebas originales y los módulos de narrativa y composición en Chromium. Para un servidor local distinto, configurá `NAGWEB_SMOKE_URL`; el workflow mantiene su servidor en el puerto 4173.

La tanda de historial (`.github/nagweb-history-smoke.mjs`) comprueba edición de un momento, cambios sin efecto, los botones Deshacer/Rehacer, guardado inmediato y recarga tras deshacer. También verifica que una edición nueva descarte la pila de rehacer y sobreviva a otra recarga, conservando los marcadores de la escena. El historial de pasos se mantiene durante la sesión; el proyecto resultante se guarda entre recargas.

La tanda de compatibilidad (`.github/nagweb-legacy-smoke.mjs`) abre un archivo anterior al formato de páginas mediante el importador real, lo guarda como JSON y lo vuelve a abrir. Comprueba textos, imágenes, recursos OBJ antiguos, tiempos del Director anterior y keyframes sin IDs; además ejecuta el HTML exportado. Los archivos inválidos o con páginas sin escenas se rechazan antes de reemplazar el proyecto actual.

La tanda de transparencia (`.github/nagweb-transparent-smoke.mjs`) ejecuta Fade, Overlay, Push, Zoom y Morph con fondos transparentes y semitransparentes, en escritorio y móvil. Comprueba la opacidad propia de cada escena, la conservación del espacio de escenas altas, la ausencia de desbordamiento horizontal, el retroceso del scroll, la interacción y movimiento reducido.

Las transiciones capturan la opacidad original y la componen con su fundido, también si fue definida mediante CSS personalizado o un estilo inline prioritario. Una escena futura permanece oculta y sin interacción hasta entrar; movimiento reducido recupera la opacidad original.

La tanda de cancelación (`.github/nagweb-cancel-smoke.mjs`) comprueba gestos interrumpidos de movimiento, tamaño y giro en el lienzo, y arrastre de momentos en la Timeline. Una cancelación restaura la apariencia y conserva el proyecto guardado y las pilas de Deshacer/Rehacer; los movimientos mínimos sin edición tampoco dejan cambios visuales pendientes.

## Profundidad 2.5D — primera etapa

El modelo compartido admite `z`, `rotateX` y `rotateY` en los momentos guardados y su interpolación. `rotate` mantiene el giro sobre Z existente. Los proyectos anteriores usan profundidad e inclinaciones cero; movimiento reducido neutraliza estas propiedades y conserva la visibilidad.

Los momentos seleccionados ya ofrecen **Profundidad**, **Inclinar arriba / abajo** e **Inclinar izquierda / derecha**. Los valores se aplican en el lienzo y en el sitio exportado mediante el mismo evaluador de scroll, scrub y reproducción. Profundidad positiva acerca; negativa aleja. **Perspectiva**, en el Director de scroll de la escena, controla la distancia de observación (200–5000 px). Un elemento que pasa detrás de esa distancia puede salir de vista.

El renderizado compone la pose 2.5D con las transformaciones CSS del diseño base, sin congelarlas ni sustituirlas. Una pose neutra y movimiento reducido retiran esa composición. Se reutilizan keyframes, guardado y Deshacer/Rehacer; no se agrega otro motor ni otra línea de tiempo.

**Iso Focus · enfoque inclinado** es la primera receta propia inspirada en esa referencia. En **Plantilla de movimiento** del elemento, genera cuatro momentos editables: comienza alejado e inclinado, se acerca al plano base al 35%, permanece hasta el 65% y sale hacia atrás con inclinación al otro lado. Conserva el objeto, su diseño base y la perspectiva de la escena; reemplaza únicamente sus momentos, con Deshacer/Rehacer. Al aplicar cualquier plantilla, el lienzo muestra su primer momento. No incluye todavía cámara animada ni una composición de múltiples objetos. Iso Orbit / Orbit Bloom / Ticker Tilt / Card Tunnel quedan para etapas posteriores.

Validación del modelo: `node .github/nagweb-depth-model-test.mjs`. La misma prueba se ejecuta al iniciar el smoke de Chromium y comprueba que la fábrica serializada de los sitios exportados evalúe las mismas poses.

## Motion Lab — galería inicial

Acceso visible en la barra superior y junto a Agregar escena. La galería incluye una primera composición Iso Focus con tres láminas y textos, una vista previa del runtime exportado, reproducción/pausa y control del momento. Abrirla no modifica el proyecto. Insertar agrega una escena libre con elementos normales, imágenes de ejemplo propias y momentos editables; conserva las escenas anteriores y admite Deshacer/Rehacer. Abre la Timeline acoplada y el modo Momento para editar la lámina central. Cada imagen se reemplaza desde el inspector habitual; títulos y descripción usan la edición normal del lienzo.

La receta usa profundidad e inclinación por elemento; todavía no incluye pista de cámara animada, exportación de video ni las otras composiciones. El preview usa el mismo evaluador del Director, sin otro motor de interpolación. `.github/nagweb-motion-lab-smoke.mjs` comprueba galería, reproducción, inserción, edición, guardado, historial, IDs únicos, exportación y tamaño móvil.

## Alcance de producto revisado — 3 de octubre de 2026

La galería inicial y sus tres láminas son un prototipo funcional, no el diseño final ni la calidad visual objetivo. La captura de Animos aportada por Nahuel define la organización esperada: biblioteca lateral con miniaturas por categoría, lienzo central amplio, inspector contextual derecho y controles de reproducción y momentos abajo. Motion Lab debe abrir ese espacio de trabajo, no limitarse a una ficha con preview y botón de inserción.

### Composición reutilizable, independiente del Director

- Una composición se puede colocar como grupo editable dentro de una escena existente, sin convertirla obligatoriamente en una nueva escena dirigida por scroll.
- El grupo conserva la identidad de la plantilla, su contenido, configuración, miembros y momentos. Después de insertarlo, **Editar en Motion Lab** reabre esa misma instancia; guardar aplica cambios a ella, sin duplicarla ni perder personalizaciones.
- Cada instancia admite **Tiempo** (reproducción autónoma con duración y repetición) o **Scroll** (progreso de la escena). Tiempo funciona con el Director desactivado, sin fijar la escena ni alargar la página. Cambiar la fuente de progreso conserva contenido y momentos.
- Scroll es una opción. Una instancia temporal también debe poder convivir con otras composiciones dentro de una escena dirigida por scroll, sin que el Director tome automáticamente sus miembros.
- Ambos modos usan el Story Model y el evaluador existentes. Se añade la fuente de progreso temporal y la selección de alcance por instancia, sin otro motor de interpolación ni otra definición de keyframes.
- La edición posterior, guardado, reapertura, Deshacer/Rehacer, variantes móviles y HTML exportado forman parte del flujo, no son tareas opcionales al final.

### Entorno y calidad visual

La biblioteca muestra composiciones con previews reconocibles, agrupadas por tipo. El lienzo central permite seleccionar y editar imágenes y textos directamente. El inspector organiza contenido, disposición, apariencia, profundidad/cámara y reproducción; muestra controles pertinentes a la composición (por ejemplo separación, inclinación, tamaño de tarjetas o radio de un anillo), además de acceso a momentos individuales. La franja inferior permite reproducir, pausar, recorrer el tiempo y editar momentos con el sistema existente.

Las plantillas son composiciones completas con dirección visual cuidada y contenido reemplazable. Prioridades: Iso Focus, Iso Orbit, Orbit Bloom, Ticker Tilt y Card Tunnel. La receta simple actual no acredita fidelidad a esas referencias; cada composición requiere evaluar su apariencia, profundidad y controles antes de considerarla terminada.

### Etapas pequeñas y verificables

1. Añadir el modo Tiempo independiente del Director, conservando evaluación y exportación compartidas. Verificar duración, repetición, pausa, movimiento reducido y convivencia con scroll.
2. Definir una instancia como grupo editable, inserción en una escena existente y reapertura de la misma instancia. Verificar edición, guardado, historial y ausencia de duplicados.
3. Convertir la ventana en el espacio de trabajo con biblioteca izquierda, lienzo central, inspector derecho y reproducción inferior. Conectar sus controles con los datos de la instancia.
4. Rediseñar y validar visualmente una primera composición completa; después ampliar el banco con los mismos criterios de edición y calidad.

Criterio de cierre: insertar una composición en una escena sin Director, verla animarse por tiempo, reabrirla, cambiar contenido y movimiento, guardar y obtener el mismo resultado en el HTML exportado. El modo Scroll debe seguir funcionando con la misma composición.

## Modo Tiempo — primera etapa implementada

Las nuevas escenas de Motion Lab usan `nwMotionSource: time`, con `sdEnabled: false`. El panel de escena **Reproducción de Motion Lab** ofrece Tiempo/Scroll, duración (0,5–120 s), repetición y perspectiva. Las escenas anteriores sin esos campos conservan el funcionamiento existente. En esta etapa la fuente se aplica a la escena completa; la agrupación de varias instancias y su reapertura son el siguiente paso.

El runtime único usa un reloj para el progreso temporal y evalúa los mismos momentos. Tiempo no crea un stage sticky ni modifica el alto de la escena. Exportación reproduce automáticamente; en diseño la pose queda detenida para editar, con Reproducir/Pausar y Reiniciar por tiempo. Sin repetición se mantiene el último momento. Movimiento reducido detiene el reloj y neutraliza los movimientos añadidos; las pestañas ocultas no acumulan tiempo. Cambiar de fuente conserva los momentos y editar una pose temporal no activa Scroll.

`.github/nagweb-time-smoke.mjs` comprueba duración, repetición, pausa, altura normal, coexistencia de escenas temporales y de scroll, cambio de fuente, movimiento reducido y edición/guardado.

## Instancias dentro de una escena — primera etapa implementada

**Insertar en esta escena** agrega un contenedor normal con seis miembros editables y `nwMotionInstance` (plantilla, fuente, duración, repetición y perspectiva). No crea otra escena ni cambia su Director; **Como escena nueva** conserva la alternativa anterior. La composición tiene su propio alcance en el mismo runtime y Timeline: el Director no toma sus miembros y el reloj temporal de la composición no mueve el resto de la escena.

Seleccionar el grupo o uno de sus miembros muestra **Editar en Motion Lab**. La ventana reabre esa instancia, con su contenido y configuración actuales, preview, selector de imágenes, textos y reproducción. Guardar reemplaza esos datos conservando IDs y momentos; cerrar descarta el borrador. La selección de Scroll al guardar activa el Director de la escena anfitriona. Los momentos individuales siguen editándose en el lienzo y la Timeline, sobre la instancia seleccionada.

La ventana aún conserva la organización de la galería inicial; su transformación al entorno de tres columnas y la mejora visual de la composición siguen pendientes. `.github/nagweb-motion-group-smoke.mjs` verifica inserción sin escenas nuevas, edición de poses por instancia, reapertura, contenido, cancelación, historial, IDs y exportación de grupos temporales junto al Director.

## Motion Lab — estructura de trabajo inicial

La ventana ocupa casi toda la pantalla y organiza biblioteca con miniatura a la izquierda, preview central amplio, inspector a la derecha y reproducción debajo del preview. Reabrir una instancia lleva sus controles de contenido y reproducción al inspector; el borrador sigue guardándose o descartándose mediante las mismas acciones. En pantallas pequeñas las regiones se apilan y el inspector conserva su propio desplazamiento.

Esta etapa reorganiza la interfaz existente. La línea de tiempo de momentos en esa ventana y el rediseño visual de la primera composición todavía están pendientes. Las pruebas de galería comprueban la geometría de columnas, el área de preview, reproducción inferior y adaptación móvil; las pruebas de grupos mantienen edición y guardado del mismo objeto.


## Motion Lab — selección y posición base en el centro

Al reabrir una composición, sus miembros directos pueden seleccionarse y arrastrarse en el panel central. El inspector indica el elemento seleccionado y permite ajustar X/Y en porcentaje; las flechas mueven un píxel y Mayús diez. La edición modifica la posición base (0–100%), conservando sus keyframes y ajustes móviles. El preview muestra esa posición base también cuando el panel es estrecho.

El arrastre pausa la reproducción. Cancelar un gesto restaura su posición inicial; cerrar descarta el borrador completo. Guardar conserva IDs y grupo, persiste los cambios y admite deshacer/rehacer. Las recargas de contenido mantienen selección y momento de preview. La galería utiliza ahora el mismo borrador editable antes de insertar. La edición de momentos dentro de Motion Lab sigue pendiente.

`.github/nagweb-motion-canvas-smoke.mjs` verifica arrastre de mouse real, selección, cancelación de gesto, teclado, controles numéricos, momento al recargar, cierre sin guardar, persistencia, historial y conservación de keyframes.


## Motion Lab — ancho desde el lienzo y el inspector

Seleccionar un miembro muestra un tirador lateral para cambiar su ancho base alrededor de su centro. Las imágenes mantienen su proporción; en textos se ajusta el ancho de la caja. El inspector incluye **Ancho (%)**, entre 1 y 100. Las flechas sobre el tirador cambian un punto porcentual (Mayús: cinco). El tirador acompaña la selección durante el recorrido de la animación y al redimensionar la ventana.

El cambio pausa la reproducción y permanece en el borrador hasta guardar. Cancelar el gesto restaura el ancho inicial; cerrar lo descarta. Guardado, reapertura y deshacer/rehacer conservan IDs, posiciones, keyframes y configuración móvil. Las pruebas del lienzo comprueban el arrastre real de tamaño, proporción, centro fijo, cancelación, teclado, valor numérico y seguimiento durante scrub.


## Motion Lab — giro base desde el lienzo y el inspector

El tirador superior gira el elemento alrededor de su centro, con ajuste cada 15° al mantener Mayús. **Ángulo (°)** permite un valor preciso; las flechas sobre el tirador giran 1° (Mayús: 15°). Los ángulos se normalizan entre −180° y 180°. El giro modifica `rot` del diseño base y conserva las rotaciones, inclinaciones y demás valores de los keyframes.

Los tiradores acompañan el recorrido de preview. Cancelar un gesto restaura el giro inicial, cerrar descarta el borrador y guardar conserva IDs y configuración móvil. Las pruebas del lienzo verifican arco de mouse real, ajuste con Mayús, matriz de rotación visible, centro fijo, cancelación, teclado, edición numérica, recarga, reapertura, persistencia y deshacer/rehacer.


## Motion Lab — preparar antes de insertar

Abrir Motion Lab permite personalizar la composición desde la biblioteca, con preview y los mismos controles usados al reabrir un grupo: textos, imágenes, posición, ancho, giro, fuente, duración, repetición y perspectiva. Los recursos de ejemplo y los cambios quedan en un borrador temporal; el proyecto, su almacenamiento y su historial no cambian hasta insertar. Cerrar descarta la preparación.

**Insertar en esta escena** y **Como escena nueva** consumen los valores preparados. La fuente Scroll activa el Director del destino, mientras Tiempo conserva la independencia de la escena anfitriona. La reapertura de un grupo mantiene **Guardar cambios en este grupo**. El banco sigue contando con una sola composición y la edición de momentos en la ventana está pendiente.

`.github/nagweb-motion-prepare-smoke.mjs` verifica personalización previa con mouse y controles, preview, cancelación sin escrituras, inserción de grupo/escena con los valores elegidos, fuente, reapertura e historial.


## Iso Focus — primera revisión visual

La composición nueva utiliza tres láminas originales de diseño editorial (Pulso, Forma y Trazo), con tipografía grande, motivos distintos y una paleta de lavanda, lima y marfil. La cabecera y el pie tienen una jerarquía más discreta y la miniatura de biblioteca se construye con esas mismas imágenes. Son recursos SVG autocontenidos, reemplazables desde el inspector; no requieren servicios ni descargas externas.

Esta revisión cambia el contenido visual inicial. Conserva geometría, duración, poses y selección de momentos del recorrido, así como la preparación antes de insertar. Las instancias existentes conservan sus imágenes y personalizaciones. El banco sigue contando con una sola composición. La prueba de galería verifica que las tres nuevas imágenes se cargan con sus dimensiones naturales y las pruebas de inserción/exportación conservan el flujo completo.


## Biblioteca Motion Lab — Órbita suave

La biblioteca suma **Órbita suave** junto a **Iso Focus**. Es una composición de tres láminas con flotación en un recorrido pequeño, profundidad e inclinaciones desfasadas, duración inicial de diez segundos y ciclo cerrado. Sus 21 momentos por lámina se evalúan con el mismo Story Model y runtime y permanecen editables en la línea de tiempo.

Cambiar de miniatura actualiza preview, título y controles. Cada opción conserva su propio borrador, selección y momento durante la sesión de Motion Lab; cerrar descarta las preparaciones. Insertar agrega solamente el grupo/escena y los recursos de la opción elegida. Reabrir un grupo identifica su plantilla y mantiene la edición sobre esa instancia. Los nombres de grupo y el momento seleccionado se adaptan a la composición.

`.github/nagweb-motion-bank-smoke.mjs` verifica ciclo sin salto, diferencias de pose, alternancia sin pérdida de borradores ni escrituras al proyecto, inserción sin recursos de opciones descartadas, IDs, reapertura, historial, exportación y biblioteca móvil.


## Biblioteca Motion Lab — Túnel de láminas

La tercera composición aproxima tarjetas desde el fondo, con fases escalonadas, inclinaciones y fundidos. El ciclo dura inicialmente doce segundos y utiliza perspectiva de 1200 px. El retorno al fondo ocurre con opacidad cero para evitar un salto visible; las poses y visibilidad de inicio y fin coinciden. La geometría base presenta las tarjetas ligeramente desplazadas.

El mismo runtime evalúa los momentos y, únicamente para esta plantilla, ordena los elementos animados por profundidad para mantener delante la tarjeta más cercana. El alcance funciona en preview, reapertura del grupo y exportación, y respeta movimiento reducido. No se agrega otro reloj o interpolador. La biblioteca genera las miniaturas desde su catálogo y conserva borradores independientes para las tres opciones.

`.github/nagweb-motion-tunnel-smoke.mjs` verifica el cierre del ciclo, retorno invisible, capas por profundidad mediante un solapamiento real, preparación, inserción sin activar el Director, reapertura, historial, exportación y movimiento reducido.


## Texto directo en Motion Lab

Los títulos, párrafos y etiquetas de texto simple se editan sobre el lienzo mediante doble clic o Enter sobre el elemento enfocado. La reproducción se pausa; Enter confirma, Escape restaura el texto previo y perder el foco confirma. Mientras se escribe, las flechas y la selección de texto conservan su comportamiento nativo y no desplazan el elemento. Se usa texto plano, sin convertir el contenido escrito en HTML.

El inspector refleja cada cambio del borrador. Cambiar de plantilla conserva la edición; insertar o guardar confirma también una edición activa. Cerrar descarta el borrador completo. Guardar mantiene IDs, geometría y momentos, sobre la misma instancia. Los textos con estilos por fragmentos conservan por ahora su flujo existente en el editor principal.

`.github/nagweb-motion-text-smoke.mjs` verifica escritura real con mouse/teclado, confirmación y cancelación, sincronización, borradores sin escritura al proyecto, inserción, reapertura, guardado sin duplicar, historial y HTML exportado.


## Imágenes propias en Motion Lab

Cada lámina ofrece “Cargar imagen…” tanto al preparar una composición como al editar una instancia. El archivo se lee y valida en el navegador y se previsualiza en el borrador; no se modifica el proyecto hasta insertar o guardar. Reemplazar la imagen conserva el elemento, su geometría, configuración móvil y momentos. Un archivo que no puede decodificarse mantiene la imagen previa.

Las cargas pertenecen a la sesión y al borrador que las inició. Cambiar de plantilla conserva sus recursos; cerrar descarta las cargas, incluso si terminan después. Insertar/guardar se deshabilita mientras carga la opción activa. Solo se incorporan los recursos nuevos utilizados por la composición final; las alternativas reemplazadas no se agregan al proyecto. El historial incluye elementos y recursos.

`.github/nagweb-motion-upload-smoke.mjs` verifica el selector real de archivos, carga y preview, archivo inválido, cancelación, borradores por plantilla, recursos utilizados, IDs/geometría/momentos, guardado en la misma instancia, historial, cargas tardías y renderización del HTML exportado.


## Tipografía y fondo en Motion Lab

Seleccionar un título, párrafo o etiqueta de texto simple muestra controles de tamaño base (0–160 px; 0 hereda), peso, alineación y color. Las imágenes y los textos con estilos por fragmentos no activan estos controles. El fondo de la composición también se personaliza antes de insertar o al editar una instancia.

Los cambios viven en el borrador y se previsualizan con el mismo generador. Motion Lab muestra la tipografía base sin las sobrescrituras móviles del iframe; al insertar y guardar se preserva la configuración móvil original. Cada plantilla conserva sus estilos y fondo durante la sesión. Guardar modifica el fondo del grupo y los estilos del elemento manteniendo IDs, geometría y momentos; cerrar descarta el borrador.

`.github/nagweb-motion-style-smoke.mjs` verifica controles contextuales, estilos calculados visibles, fondo, borradores sin escrituras al proyecto, configuración móvil, inserción/guardado de la misma instancia, cancelación, historial y estilos calculados del HTML exportado.


El inspector separa el contenido desplazable de los botones de insertar/guardar, que ocupan un pie propio. Al mostrar los controles de texto, las acciones no cubren otros campos ni reciben clics dirigidos a ellos. La prueba de escritura directa confirma el texto al enfocar Duración y exige que Motion Lab siga abierto.


## Profundidad e inclinación por momento en Motion Lab

Seleccionar un elemento con momentos activos muestra “Movimiento del elemento”: se elige uno de sus momentos existentes y se ajustan profundidad, inclinación vertical e inclinación lateral. El selector recorre esa pose y cada cambio actualiza el mismo runtime mediante su operación de actualización, sin recargar el iframe ni agregar un reloj o interpolador. Los controles del diseño base siguen siendo independientes.

La edición cambia solo las propiedades elegidas del punto existente: conserva IDs, tiempos, easing, otros valores, elementos y configuración móvil. Cada borrador conserva el punto seleccionado; recorrer el control de progreso selecciona el punto más próximo. El progreso admite décimas de porcentaje para los puntos fraccionarios del túnel. Insertar/guardar incorpora la edición, cerrar la descarta y el historial incluye los cambios. Agregar, eliminar y reordenar momentos sigue disponible en la línea de tiempo del editor principal.

`.github/nagweb-motion-key-smoke.mjs` verifica transformación visible y poses, independencia del diseño base, puntos/IDs/otras propiedades/elementos intactos, borradores sin escritura al proyecto, inserción, guardado de la misma instancia, cancelación, historial, runtime exportado y momentos decimales.


## Desplazamiento, apariencia y transición por momento

“Movimiento del elemento” suma un desplegable con desplazamiento X/Y, tamaño, giro, opacidad y desenfoque del momento elegido. Los valores son relativos al diseño base; tamaño 100% conserva el tamaño original. Los nueve controles utilizan los límites del Story Model y actualizan la vista previa sin recargar el iframe.

“Al siguiente momento” elige el easing del tramo saliente: Lineal, Suave, Acelera, Frena, Acelera y frena o Cinemática. En el último momento queda deshabilitado porque no hay un tramo siguiente. La edición mantiene los demás momentos, sus IDs, la geometría base y los demás elementos. Funciona antes de insertar y al reabrir el grupo; cada plantilla conserva su borrador y cerrar lo descarta.

`.github/nagweb-motion-transition-smoke.mjs` verifica las nueve propiedades en un punto intermedio conocido, el cambio real entre easing cinematográfico y lineal, estilos computados, límites, último momento, conservación de geometría y otros puntos/elementos, borradores, inserción, guardado sobre la misma instancia, cancelación, Deshacer/Rehacer y el movimiento en el HTML exportado.


## Agregar y quitar momentos dentro de Motion Lab

Un elemento con momentos activos ofrece “Agregar aquí” y “Quitar elegido”. Recorrer la vista previa y agregar captura las nueve propiedades de la pose evaluada en ese porcentaje, con precisión de décimas y un ID nuevo. El nuevo momento hereda el easing del tramo en el que se agrega. Si ya existe un momento en esa posición, se selecciona sin duplicarlo ni reemplazarlo. Se mantienen los límites de 512 puntos y al menos dos momentos por elemento; quitar selecciona el punto superviviente más próximo.

La captura conserva la pose en el instante elegido. Al dividir un tramo con easing, la curva entre los momentos puede cambiar; cada tramo sigue usando su propio easing. Los cambios permanecen en el borrador antes de insertar/guardar y no alteran los demás elementos ni la geometría base. Reubicar momentos sigue disponible en la línea de tiempo del lienzo principal.

`.github/nagweb-motion-points-smoke.mjs` verifica captura de una pose interpolada sin salto ni recarga, posiciones decimales, duplicados, quitar y selección posterior, mínimo de puntos, IDs/otros momentos/elementos, borradores por plantilla, inserción, guardado en la misma instancia, cancelación, historial y equivalencia con el HTML exportado.


## Reubicar momentos dentro de Motion Lab

“Ocurre en (%)” permite adelantar o retrasar el momento elegido entre 0 y 100, con precisión de décimas. Conserva su ID, pose y easing saliente, ordena los puntos por su nueva posición y recorre la vista previa hasta allí mediante el mismo runtime, sin recargar el iframe. El movimiento entre puntos refleja el nuevo intervalo.

Si la posición redondeada ya está ocupada, o el valor no es válido, se restaura el campo y se muestra un aviso junto a él sin modificar ningún momento. La reubicación funciona en los borradores por plantilla y al reabrir una instancia; insertar/guardar la confirma, cerrar la descarta. La edición avanzada por arrastre sigue disponible en la línea de tiempo principal.

`.github/nagweb-motion-retime-smoke.mjs` prueba el campo con teclado real, interpolación en un instante conocido, cruces de orden, pose/easing/IDs y otros elementos conservados, decimales, colisiones y valores inválidos sin pérdida, borradores, inserción, guardado de la misma instancia, cancelar, Deshacer/Rehacer y equivalencia con el HTML exportado.


## Selección desde la lista de elementos en Motion Lab

La columna izquierda alterna entre “Biblioteca” y “Elementos”. La segunda muestra los elementos que se editan directamente en el lienzo, con su nombre y tipo, y permite elegirlos aunque estén superpuestos, fuera de vista o transparentes. Seleccionar desde la lista confirma la escritura directa pendiente y pausa la reproducción, conservando el momento actual. La selección del lienzo, la lista y el inspector permanece sincronizada después de editar o regenerar la vista previa.

Cada borrador por plantilla restaura su propia selección y lista. Reabrir un grupo mantiene disponibles sus elementos aunque la biblioteca de plantillas esté deshabilitada. Los nombres se insertan como texto, los botones usan `aria-pressed` y las pestañas ofrecen navegación con flechas/Home/End. En pantallas compactas, la lista ocupa la misma fila horizontal desplazable de la biblioteca.

`.github/nagweb-motion-layers-smoke.mjs` verifica una lámina del túnel con opacidad cero y sin eventos de puntero, selección real del lienzo, edición de texto pendiente, teclado y pestañas, cambio/restauración de borrador, ausencia de escrituras al proyecto antes de confirmar, inserción, reapertura, guardado, cancelar, historial y selección en pantalla compacta.


## Duplicar textos y láminas en Motion Lab

“Duplicar seleccionado” copia una lámina o texto simple del lienzo, antes de insertar o al reabrir una instancia. Confirma la escritura directa pendiente, pausa la vista previa y selecciona la nueva copia. Conserva contenido, estilos, dimensiones, configuración móvil y movimiento, asigna nuevos IDs al elemento y sus momentos, y desplaza su posición base tres puntos porcentuales en X/Y (también en las posiciones móviles explícitas). Los nombres de copias del mismo elemento se distinguen con un número cuando hace falta.

Las copias reutilizan el recurso de imagen y mantienen sus datos independientes. Quedan en el borrador por plantilla hasta insertar o guardar; cerrar las descarta. Guardar una instancia actualiza los miembros existentes y añade los nuevos al mismo grupo, preservando los elementos externos. La duplicación se deshabilita sin selección válida o durante una carga de imagen. Los contenedores y textos por fragmentos quedan fuera de esta etapa.

`.github/nagweb-motion-duplicate-smoke.mjs` verifica poses renderizadas antes/después de copiar, edición independiente, IDs, recursos reutilizados, estilos móviles, texto directo activo, borradores sin escritura al proyecto, inserción, incorporación de nuevos miembros al guardar, elementos externos, cancelar, Deshacer/Rehacer y renderizado del HTML exportado.


## Quitar elementos y simplificar composiciones en Motion Lab

“Quitar elemento” elimina una lámina o texto simple del borrador y selecciona el siguiente elemento disponible. Conserva al menos un elemento y no elimina contenedores ni elementos con hijos. Se deshabilita durante las cargas de imagen. Reconstruye la lista, el inspector y la vista previa sin modificar el proyecto hasta insertar o guardar; cerrar descarta las eliminaciones.

Guardar aplica las eliminaciones únicamente a miembros de la instancia editada, además de actualizar los existentes y agregar los nuevos. Conserva los elementos externos y los recursos ya incorporados al proyecto. Recalcula la selección del lienzo principal por ID; si el elemento seleccionado fue eliminado, selecciona el grupo para evitar que el inspector edite accidentalmente al siguiente elemento. Una composición nueva solo incorpora los recursos de sus elementos supervivientes. La inserción ya no presupone dos láminas: elige un elemento animado disponible y, si solo quedan textos sin momentos, selecciona uno en modo de diseño base.

`.github/nagweb-motion-remove-smoke.mjs` verifica selección después de quitar, borradores por plantilla, ausencia de escrituras previas, recursos utilizados, altas y bajas en el mismo guardado, supervivientes y elementos externos intactos, cancelar, Deshacer/Rehacer, elementos ausentes del HTML exportado e inserción de una sola lámina como escena y de un solo texto como grupo.


## Agregar textos propios en Motion Lab

La pestaña “Elementos” ofrece “Agregar texto”, incluso cuando la composición ya no tiene ningún texto que duplicar. Crea y selecciona un texto simple independiente en el centro, con nombre único, ancho 70%, tamaño 24 px (18 px en móvil) y un color inicial claro u oscuro según el fondo. Se puede escribir directamente en el lienzo y editar posición, ancho, ángulo y estilo antes de insertar.

El texto comienza sin desplazamientos ni efectos, con dos momentos neutros en 0% y 100% e interpolación lineal. Sus nueve propiedades de movimiento se pueden personalizar desde el inspector, agregar o reubicar momentos, y combinar con Tiempo o Scroll. Agregar confirma la escritura pendiente y pausa la vista previa. Se deshabilita mientras se carga una imagen.

Los textos nuevos quedan en el borrador de su plantilla hasta insertar o guardar. Al reabrir una composición se pueden añadir más textos en el mismo grupo; cerrar descarta esas altas. No requieren recursos de imagen ni activar el Director cuando la composición usa Tiempo.

`.github/nagweb-motion-add-text-smoke.mjs` verifica creación sin textos previos, escritura directa y texto literal seguro, contraste inicial, nombres e IDs únicos, movimiento interpolado propio sin alterar la geometría base, borradores sin escrituras al proyecto, inserción independiente del Director, nuevas altas al guardar, elementos externos, cancelación, Deshacer/Rehacer y equivalencia de la animación en el HTML exportado.


## Agregar imágenes propias en Motion Lab

“Agregar imagen…” en Elementos abre el selector de archivos y añade una lámina independiente solo después de validar que la imagen se pueda cargar. Funciona aunque se hayan quitado todas las imágenes de la plantilla. Cancelar o elegir un archivo inválido no agrega elementos ni recursos; los errores se muestran junto al botón. La nueva imagen aparece seleccionada en el centro, con ancho 36% (48% en móvil), proporción original, nombre único y dos momentos neutros en 0% y 100%. Se puede mover, redimensionar, girar, duplicar y ajustar su movimiento antes de insertar.

La carga usa la misma validación de las imágenes de reemplazo. Mientras está pendiente se bloquean altas, duplicaciones, eliminaciones e inserción/guardado del borrador actual. Si se cambia de plantilla, la imagen termina de incorporarse a su propio borrador y se selecciona al volver. Cerrar invalida las cargas de esa sesión. Las imágenes añadidas no requieren activar el Director para animar por Tiempo.

Insertar solo incorpora los recursos que siguen utilizados, y las copias comparten el archivo. Reabrir una instancia permite sumar más imágenes y guardarlas en el mismo grupo, sin modificar elementos externos. Cerrar descarta las altas pendientes de confirmar.

`.github/nagweb-motion-add-image-smoke.mjs` verifica selector real, cancelación y archivo inválido sin elementos vacíos, creación sin imágenes previas, proporción renderizada, movimiento propio, guardas durante la carga, cambio de plantilla y cierre de sesión con cargas tardías, recursos utilizados y duplicación, inserción sin Director, altas al guardar, externos intactos, Deshacer/Rehacer y renderizado/movimiento en el HTML exportado.


## Nombres de elementos en Motion Lab

El inspector ofrece “Nombre del elemento” para identificar el texto o la imagen seleccionada. Enter o salir del campo confirma; Escape descarta lo escrito en el campo sin cerrar Motion Lab. Se recortan los espacios exteriores y se admiten hasta 80 caracteres. Un nombre vacío conserva el anterior. El nombre organiza la composición y no modifica el texto visible, la imagen ni su movimiento.

La lista de Elementos, el título del inspector, las etiquetas de contenido y las etiquetas accesibles del lienzo y selector de archivos se actualizan con texto literal, sin regenerar la vista previa. Los nombres se conservan en cada borrador por plantilla y al insertar/guardar; cerrar descarta los cambios sin confirmar. Reabrir permite renombrar dentro de la misma instancia.

`.github/nagweb-motion-name-smoke.mjs` verifica teclado real, Enter/Tab/Escape, vacíos, nombres con marcas literales, sincronización sin recarga, conservación del contenido/movimiento, borradores sin escritura previa, guardado exacto de un único nombre, externos intactos, cancelación, Deshacer/Rehacer y equivalencia de la animación exportada.


## Contenido contextual en el inspector de Motion Lab

“Contenido seleccionado” aparece junto al nombre y antes de los controles de geometría. Elegir un texto muestra su campo de escritura; elegir una imagen muestra su recurso y el botón de carga. Los campos de los demás elementos se ocultan, y sin selección no se muestra contenido. El lienzo y la lista de Elementos utilizan el mismo inspector. Los controles de composición siguen disponibles para ajustar fondo, duración, repetición y perspectiva.

Se mantienen los índices y campos de cada miembro para sincronizar escritura directa, cargas y borradores. Cambiar la selección o regenerar la vista previa restaura el contenido del elemento elegido sin perder las ediciones anteriores. El nombre sigue siendo una etiqueta de organización independiente del contenido.

`.github/nagweb-motion-inspector-smoke.mjs` verifica visibilidad de un único contenido, ubicación en el inspector, selección desde lista y lienzo, edición con teclado y selector reales, reemplazo sin alterar el movimiento, regeneración, borradores sin escritura previa, guardado exacto, controles accesibles en pantalla compacta, Deshacer/Rehacer y equivalencia del HTML exportado. La prueba de cargas selecciona explícitamente la imagen antes de abrir su selector de archivos.


## Prioridad de controles en el inspector

“Estilo del texto” se ubica inmediatamente después de “Contenido seleccionado”, antes de geometría y movimiento. Al seleccionar una imagen, el estilo de texto sigue oculto. El bloque “Composición” agrupa fondo, fuente de animación, duración, repetición y perspectiva en un desplegable nativo, inicialmente cerrado para dedicar el panel a la edición del elemento.

Cada borrador conserva durante la sesión si Composición está abierta, incluso al cambiar y regresar de plantilla o reconstruir el inspector. Ese estado de interfaz no se agrega al proyecto ni a la configuración de la animación. La regeneración de la vista previa mantiene el desplegable abierto y los valores editados.

La prueba de inspector abre Composición, edita la duración con teclado real, comprueba su guardado y verifica que el estado abierto se conserve al volver a la plantilla. También verifica la posición de los controles de estilo. La prueba de escritura directa confirma el texto pendiente al abrir Composición y mantiene accesible el campo Duración.


## Selección directa de momentos en Motion Lab

“Movimiento del elemento” muestra los momentos como botones con su porcentaje, junto al selector existente. El elegido se distingue visualmente y con `aria-pressed`. Un clic pausa y lleva la vista previa a esa pose, sincronizando el porcentaje, el selector y las propiedades. La fila se actualiza al agregar, quitar o reubicar puntos, conserva posiciones decimales y utiliza una altura acotada con desplazamiento para composiciones con muchos momentos.

Las flechas izquierda/derecha recorren los momentos en orden; Home/End eligen el primero/último. Enter y Espacio eligen el botón enfocado. Un único botón participa en el orden de Tab, y el foco se conserva al reconstruir la fila. Los atajos se capturan antes de los comandos del lienzo principal para que no modifiquen elementos externos. El control se oculta cuando el elemento no tiene momentos activos.

Las pruebas de momentos usan clics reales sobre los botones para editar, cambiar de plantilla, guardar, cancelar y verificar la exportación. También recorren los atajos con un elemento exterior seleccionado y comprueban que el proyecto, el almacenamiento y el historial no cambien. La prueba de agregar/quitar compara los IDs y porcentajes de la fila con los del selector después de cada operación.


## Biblioteca personal de Motion Lab

“Mis composiciones”, en la pestaña Biblioteca, permite nombrar y guardar una copia de lo preparado antes de insertarlo. Guarda contenido, imágenes utilizadas, geometría, estilos móviles, momentos, interpolación y configuración de Tiempo/Scroll. Cada guardado crea una composición nueva dentro del proyecto (`nwMotionLibrary`, versión 1), incluida en el JSON y conservada al volver a abrirlo. No inserta elementos ni añade recursos a las escenas.

Elegir una composición guardada crea un borrador independiente con nuevos IDs de elementos, imágenes y momentos. Conserva el tipo de plantilla original para su comportamiento de profundidad. Se puede personalizar antes de insertar y cambiar de plantilla sin perder el borrador durante la sesión. Las instancias insertadas llevan el nombre personalizado y se reabren con el mismo editor. Las imágenes incorporadas a la biblioteca son copias incluidas en sus datos; insertar solo incorpora las utilizadas.

También se puede guardar una copia en Biblioteca al editar una instancia colocada, sin aplicar los cambios pendientes a esa instancia. “Quitar de Biblioteca” elimina únicamente la composición guardada: los grupos ya insertados conservan contenido y recursos. Guardar y quitar admiten Deshacer/Rehacer en el editor principal. Los nombres se muestran como texto literal. Los controles siguen disponibles en pantalla compacta.

`.github/nagweb-motion-library-smoke.mjs` verifica guardado previo a inserción, imágenes propias incluidas, nombres y texto literal, ausencia de cambios en escenas y recursos principales, poses interpoladas equivalentes, IDs independientes entre reutilizaciones, borradores, Tiempo sin Director, guardado desde una instancia sin aplicarlo, eliminación sin alterar instancias, historial, conservación del JSON tras migración y recarga, controles compactos y equivalencia del HTML exportado.


## Abanico de láminas en Motion Lab

La Biblioteca incorpora “Abanico de láminas” (`card-bloom`): tres imágenes parten de una pila central, se despliegan con desplazamiento, inclinación y giro, permanecen abiertas y regresan a la misma pose inicial. Usa las láminas editoriales reemplazables del banco, una duración inicial de diez segundos y perspectiva de 1100 px. Cada imagen tiene seis momentos editables (0%, 12%, 38%, 62%, 88%, 100%) con transición cinematográfica. Las pausas cerrada y abierta evitan un salto al repetir.

Se prepara y personaliza antes de insertar, conserva su borrador al cambiar de plantilla y se puede guardar en Mis composiciones. Las copias guardadas mantienen el tipo de plantilla para ordenar las imágenes por profundidad, igual que Túnel: la imagen central queda delante durante el despliegue. Se usa el runtime compartido, tanto para escenas como grupos y HTML exportado. Tiempo funciona sin activar el Director y el modo de movimiento reducido mantiene una pose neutra. Las dimensiones móviles conservan las tres láminas dentro de la vista previa compacta.

`.github/nagweb-motion-bloom-smoke.mjs` verifica poses interpoladas y cierre continuo, apertura y superposición renderizadas, selección y edición de momentos, texto y borradores sin modificar el proyecto, reutilización desde Biblioteca con IDs independientes, inserción y guardado en la misma instancia, historial y JSON, equivalencia del HTML exportado, pantalla compacta y movimiento reducido. El flujo de pruebas conserva capturas de escritorio y móvil durante siete días para revisar el resultado visual. La prueba del banco verifica las cuatro plantillas disponibles.


## Buscar composiciones en la Biblioteca

El campo “Buscar composiciones” filtra las plantillas y Mis composiciones por nombre y descripción. La búsqueda ignora mayúsculas y tildes, permite varias palabras en cualquier orden y las trata como texto literal. Muestra el número de coincidencias o un mensaje para probar otro nombre. La búsqueda no oculta los controles para guardar una composición. Guardar o quitar una entrada actualiza los resultados del filtro activo.

Limpiar búsqueda devuelve todas las tarjetas y conserva el foco en el campo. Escape, con texto en el buscador, lo limpia sin cerrar Motion Lab ni descartar la edición. El filtro no elige otra plantilla, no reconstruye la vista previa, no pausa su reloj ni altera la selección, los momentos o el borrador. Cambiar de plantilla entre resultados sigue usando los borradores habituales. La búsqueda solo dura durante esa sesión; una nueva apertura o la edición de una instancia muestra toda la Biblioteca.

`.github/nagweb-motion-search-smoke.mjs` verifica teclado real, nombres y descripciones, mayúsculas/tildes/orden de palabras, marcas literales, ausencia de resultados, limpiar y Escape, mismo documento de preview y selección/pose, borradores y reproducción intactos, actualización al guardar/quitar, historial, nueva sesión, búsqueda durante edición de instancias y controles en pantalla compacta sin escrituras al proyecto. Guarda una captura de la búsqueda móvil en los artefactos del flujo de pruebas.


La revisión visual del buscador compacto detectó que el título inicial del abanico, al ocupar dos líneas, se superponía con su etiqueta. El título de las nuevas composiciones Abanico se ubica en Y=24% tanto en diseño base como en móvil. Las instancias ya colocadas conservan sus posiciones. La prueba de búsqueda comprueba el espacio entre los rectángulos renderizados del título y la etiqueta en pantalla compacta.


## Ampliar el lienzo de Motion Lab

El botón “Ampliar lienzo”, junto a Cerrar, dedica el espacio de Biblioteca e inspector a la vista previa y aumenta la altura del diálogo. En escritorio centra el lienzo con un ancho acotado según su altura, para que las láminas no invadan los textos al crecer la ventana. “Volver a paneles” restaura el editor. Conserva el mismo iframe, la composición, selección, búsqueda, paneles abiertos, posición del inspector y momento actual; no agrega escrituras al proyecto. Reproducir, pausar y recorrer la animación siguen disponibles, y ampliar/restaurar no interrumpe la reproducción. Los tiradores se recolocan al cambiar el tamaño del iframe.

La edición directa del lienzo sigue disponible en la vista ampliada. Escape vuelve a los paneles y enfoca su botón. Dentro del iframe, una edición de texto o un arrastre activo se cancela primero; otro Escape vuelve al editor. Cerrar mantiene el comportamiento habitual de descartar cambios pendientes. Una nueva sesión o la reapertura de una instancia comienza con todos los paneles disponibles. El modo ampliado funciona en escritorio y pantallas compactas, y no se guarda en los datos del proyecto.

`.github/nagweb-motion-expand-smoke.mjs` verifica el aumento real del lienzo, mismo documento y estado de edición, reproducción continua, conservación de búsqueda/desplegable/scroll, Escape y foco desde controles e iframe, cancelación de texto y arrastre, edición directa e inserción habitual, reapertura/cierre, ausencia de escrituras y espacio/controles en móvil. Se ejecuta antes de las otras pruebas de flujo y conserva capturas de escritorio y móvil.

## Agregar imágenes por arrastre en Motion Lab

Se puede arrastrar una imagen local al lienzo o a su marco para agregar un elemento nuevo y seleccionado, incluso con el lienzo ampliado o al editar una instancia colocada. Un aviso visible indica dónde soltarla y desaparece al salir, cancelar, soltar o cerrar. Pasar el archivo sobre el lienzo no interrumpe la reproducción ni reconstruye la vista previa. Soltar confirma la carga y pausa igual que “Agregar imagen…”. No reemplaza las imágenes sobre las que se suelta. Se admite una imagen por operación; archivos inválidos no crean elementos ni recursos vacíos. La indicación bajo Agregar imagen permite descubrir el gesto.

El arrastre del marco y el del documento de la vista previa usan la misma carga existente: FileReader, decodificación real de imagen, proporción original, selección, momentos neutros, control de cargas pendientes, caché por composición y descarte de resultados de sesiones cerradas. No cambia el proyecto antes de Insertar o Guardar. No modifica el comportamiento de mover elementos que ya están en el lienzo.

`.github/nagweb-motion-drop-smoke.mjs` usa archivos temporales reales y eventos de arrastre de Chromium por CDP. Verifica aviso/reproducción/cancelación, carga desde la vista previa y desde el marco, conservación de imágenes existentes, archivos múltiples e inválidos, bloqueo de carga concurrente, modo ampliado, ausencia de escrituras prematuras, inserción independiente de Director de Scroll, edición de la misma instancia, elementos externos y recursos en el HTML exportado. Se ejecuta al inicio del flujo y conserva capturas del aviso y del resultado.


## Showcase Stream: anillo curvo para la web

Nueva plantilla procedural en Motion Lab. El análisis del HAR y los videos de referencia identifica la órbita, superficies curvadas, orden por profundidad y desvanecimiento posterior. NagWeb implementa un modelo propio y legible, con franjas de textura sobre cada superficie y recursos gráficos de muestra propios. No se incorpora el editor ni un video de Animos. Los elementos siguen siendo imágenes editables, con selección por lienzo o lista y sustitución por archivos propios. La plantilla determina la geometría de los miembros del anillo; las imágenes libres y los textos añadidos conservan su edición directa habitual.

El panel incluye de 4 a 16 imágenes, proporción del lienzo y las tarjetas, inclinación, apertura, tamaño de anillo/tarjetas, desvanecimiento posterior, perspectiva, margen, esquinas, sombra y fondo por color, degradado o imagen propia. Reducir y volver a aumentar la cantidad conserva los miembros retirados dentro del mismo borrador. Duplicar y quitar respetan los límites del anillo. Los fondos se incluyen al guardar una composición en Biblioteca y sus identificadores se remapean al crear copias.

Dos fuentes de reproducción: Loop continuo (segundos por vuelta, independiente del scroll), o Secuencia por scroll (vueltas totales, inicio/fin como porcentaje de la escena y recorrido en vh). La vista previa usa el mismo modelo/runtime y muestra la secuencia elegida. El loop recorre una vuelta aunque se conserve el número de vueltas de la alternativa Scroll. Al alcanzar el final de una secuencia no se reinicia el progreso. Cuando Motion Lab activa el Director sobre una escena que antes no lo tenía, marca esa activación; regresar a Loop desactiva el recorrido extra solo si ninguna otra composición necesita Scroll. Un Director preexistente se conserva.

Insertar como escena nueva crea un grupo editable dentro de esa escena; el panel de escena permite reabrirlo en Motion Lab. Insertar en esta escena utiliza el grupo habitual. Guardar modifica esa misma instancia. Biblioteca, JSON, Deshacer/Rehacer y HTML exportado conservan los parámetros y recursos. Movimiento reducido mantiene el anillo quieto; las pausas y la visibilidad usan el reloj compartido del Director, sin añadir relojes por imagen.

El modelo puro prueba cierre exacto, curvatura, orden de superficies, perspectiva y límites de fase. La prueba de navegador comprueba selección, archivos reales, controles, recuperación por cantidad, fondos, tres vueltas entre 20% y 80%, recorrido de 420vh, avance/retroceso con scroll real en el HTML exportado, loop sin recorrido extra, edición de instancia, Biblioteca, historial, escena reeditable, pantalla compacta y movimiento reducido. Las capturas del anillo de escritorio y móvil acompañan los artefactos de CI.

## Showcase Stream sin fondo y tamaño proporcional

El fondo puede ser “Sin fondo”: el grupo permanece transparente en el editor y en el HTML exportado, mostrando la escena que tiene detrás. Al colocarlo se selecciona la composición completa; hacer clic sobre sus tarjetas en la escena selecciona ese grupo. Las imágenes del anillo se personalizan en Motion Lab, donde la plantilla sigue determinando su geometría.

El tirador de tamaño cambia ancho y alto juntos, conservando la proporción de la órbita y sus tarjetas. El runtime observa el tamaño del contenedor para redibujar durante el arrastre, incluso con la vista previa pausada. La cancelación restaura ambas dimensiones; Deshacer/Rehacer y reapertura conservan el tamaño. La prueba de navegador usa arrastre real por mouse en Loop y Scroll, compara la geometría proporcional de las doce tarjetas y comprueba transparencia y recursos en exportación.

## Orden de imágenes de Showcase Stream

Al seleccionar una imagen del anillo, el inspector muestra **Posición en el anillo**. Podés escribir el puesto o usar **Anterior / Siguiente** para moverla un lugar. La pestaña Elementos indica la posición de cada imagen. Los botones se desactivan en los extremos y durante una carga pendiente; una posición vacía vuelve al valor actual sin reconstruir la vista previa.

La operación mueve la misma imagen, conservando su identificador, nombre y recurso. Las imágenes libres y los textos mantienen su lugar. La selección, el momento del preview y el desplazamiento del inspector se conservan; reordenar pausa la reproducción para poder revisar el resultado. Se puede preparar antes de insertar y también modificar una instancia colocada. Biblioteca, guardado, reapertura, Deshacer/Rehacer y HTML exportado conservan el orden. Cerrar descarta los cambios pendientes y guardar una secuencia por scroll mantiene su reproducción conectada al scroll real.

La prueba de Showcase Stream verifica posición directa, ambos botones, extremos, valores vacíos, selección y momento conservados, texto libre intacto, recursos e identificadores, Biblioteca, inserción, edición y exportación, además de cancelación por cierre. Los campos de texto y números del inspector usan negro sobre blanco en ambos temas, y Tamaño de imagen admite hasta 80%.

## Iso Orbit: grilla isométrica editable

La nueva plantilla organiza nueve imágenes en una grilla de 3 × 3, con oscilación o giro completo y flotación individual. Incluye nueve láminas originales de muestra, reemplazables por archivos propios. El inspector permite cambiar tamaño de grilla, separación, inclinación, amplitud de oscilación, flotación, proporciones, margen, esquinas y sombra. Comienza con “Sin fondo” y también admite color, degradado o imagen. La cantidad de tarjetas se mantiene en nueve; se pueden agregar imágenes libres y textos sobre la composición.

La selección en el lienzo sigue la superficie inclinada de cada tarjeta, evitando que las esquinas vacías de su contenedor intercepten otras imágenes. “Posición en la grilla” y Anterior/Siguiente cambian el orden conservando identificadores y recursos. Se puede preparar y previsualizar todo antes de insertar, guardar en Biblioteca o editar la misma instancia colocada.

Loop continuo usa segundos por ciclo, independiente del scroll. Secuencia por scroll usa ciclos, inicio/fin y recorrido de escena; permite avanzar, detener y retroceder. Ambas fuentes comparten el modelo geométrico y el reloj del runtime existente, con cierre exacto entre ciclos. La inserción como grupo o escena, redimensionado proporcional, transparencia, historial, Biblioteca, reapertura y HTML exportado reutilizan el flujo de Showcase Stream.

El modelo puro verifica nueve planos afines, cierre de oscilación y giro, encuadre inicial en distintos tamaños, profundidad, límites y fábrica serializada. Las pruebas de navegador verifican imágenes dibujadas, selección real, sustitución y orden, controles, copias independientes, scroll real después de guardar, loop sin Director, inserción y edición, exportación, redimensionado, móvil y movimiento reducido. Las capturas de escritorio y móvil se guardan con los artefactos de CI.

## Cargar varias imágenes en Motion Lab

Showcase Stream e Iso Orbit incluyen “Cargar varias imágenes…”. Se pueden elegir hasta tantas imágenes como posiciones tenga la composición. El lote reemplaza las primeras posiciones, en el orden de los archivos elegidos, respetando el orden actual de las tarjetas. Las posiciones restantes, identificadores, nombres, parámetros de movimiento y elementos libres se conservan. El inspector informa la cantidad cargada.

Primero se leen y decodifican todas las imágenes; recién entonces se aplica el lote completo al borrador. Si un archivo falla o se eligen demasiados, no se cambia ninguna imagen ni se agregan recursos parciales. Mientras se carga se bloquean inserción, guardado, Biblioteca, cambios de cantidad, orden y nuevas cargas. Cambiar de plantilla permite terminar la carga en su borrador sin alterar la plantilla visible; cerrar descarta los resultados pendientes. El proyecto cambia al insertar o guardar.

La prueba de navegador usa archivos propios reales, orden modificado, reemplazo parcial, texto libre, archivos inválidos y exceso de cantidad, bloqueos, cambio de plantilla durante lectura, descarte al cerrar, inserción, reapertura, edición de la misma instancia, historial y recursos del HTML exportado.

## Desarrollo y publicación por tandas

La rama `internal-motion-lab` conserva las microetapas y ejecuta el flujo completo de GitHub Actions. `vercel.json` desactiva los despliegues automáticos únicamente para las ramas `internal-motion-lab*`, mediante `git.deploymentEnabled`, según la configuración oficial de Vercel. Las otras ramas mantienen su comportamiento. Se promueve una tanda verificada a `feat/storytelling-engine-v2` cuando corresponda publicar para revisión; no se promueve cada corrección o microetapa. Registrar el commit publicado y el commit pendiente evita confundir la versión online con avances aún sin publicar.

## Pop Grid: imágenes que aparecen a distinto ritmo

Nueva plantilla basada en el comportamiento analizado en el HAR de referencia: cada imagen de una grilla aparece con una pequeña expansión, permanece visible y se contrae, siguiendo su propio desfase estable. Arranca con seis láminas propias y ocho segundos por ciclo; admite de dos a doce imágenes. Separación y Tiempo visible controlan el espacio entre las tarjetas y cuánto permanece completa cada una. La grilla se adapta a un lienzo horizontal o vertical y usa encuadre por cobertura, sin deformar las imágenes.

Comparte las opciones de margen, esquinas, sombra y fondos, con “Sin fondo” inicial. Orden, carga individual o múltiple, imágenes libres y textos, borradores, Biblioteca, grupo o escena y edición posterior reutilizan los flujos existentes. Secuencia por scroll permite elegir ciclos, inicio/fin y recorrido; Loop continuo usa segundos por ciclo y funciona sin Director. Las texturas se conservan mientras cambia el tamaño animado de cada tarjeta, evitando recrearlas en cada fotograma.

El modelo puro prueba de dos a doce posiciones, ritmos independientes, aparición/desaparición de todas las imágenes, cierre exacto, proporcionalidad, límites y fábrica exportada. Las pruebas de navegador cubren controles, cantidad y recuperación de tarjetas, Biblioteca con copias independientes, scroll real después de guardar, loop, transparencia, historial, JSON y HTML, escena reeditable, redimensionado por mouse, carga múltiple, móvil y movimiento reducido. Esta plantilla queda en la tanda pendiente de publicación junto con Iso Orbit y carga múltiple.

## Miniaturas y reemplazo directo de imágenes

La pestaña Elementos muestra la imagen de cada lámina junto a su nombre y posición. Permite reconocer y seleccionar tarjetas ocultas en el momento actual de la animación. El contenido seleccionado incluye una previsualización mayor y el nombre del archivo; pulsarla abre el selector para reemplazar esa misma imagen, conservando posición, tamaño y movimiento. Los textos mantienen sus controles propios. Las miniaturas usan encuadre por contenido, sin recortar ni deformar.

Las vistas se actualizan al cambiar recursos, cargar archivos individuales o múltiples, reordenar, recuperar borradores y reabrir instancias. El reemplazo desde la previsualización se bloquea durante cargas pendientes. Las pruebas comprueban el selector real, la coincidencia de miniaturas con imágenes renderizadas, nombres de archivo, orden y cargas múltiples en las tres plantillas procedurales, escritorio y móvil, y guardado/historial/exportación.

## Encuadre individual de las tarjetas

Showcase Stream, Iso Orbit y Pop Grid permiten ajustar el recorte horizontal y vertical de cada tarjeta seleccionada, con valores de 0 a 100 y centro en 50. “Centrar imagen” restaura el recorte original. Las imágenes siguen cubriendo su tarjeta sin deformación; el ajuste solo actúa en la dimensión que desborda. El encuadre pertenece a la tarjeta y se conserva al sustituir la imagen, reordenarla, duplicarla, recuperar cantidad, guardar en Biblioteca y editar la instancia. Los elementos libres y textos no muestran estos controles.

El runtime utiliza el mismo cálculo en Motion Lab, el lienzo y el HTML exportado. El encuadre participa en la clave de textura, por lo que se dibuja el recorte nuevo y se conserva la textura durante la animación. Los proyectos antiguos mantienen su recorte centrado. Las pruebas verifican cobertura, proporciones y fábrica exportada; en navegador comprueban píxeles reales de imágenes de prueba horizontales y verticales, extremos, centro, reemplazo, orden, Biblioteca, guardado, cancelación, historial, JSON y exportación en las tres plantillas.

## Center Stage: secuencia de imágenes

Presenta una imagen por vez: entra desde la derecha, permanece en el centro y sale hacia la izquierda mientras se desvanece. Parte del comportamiento y los valores del HAR de referencia, con tres láminas propias horizontales y siete segundos por ciclo. Admite de dos a seis imágenes. Recorrido de entrada y salida, Tamaño de imagen y Estela al salir controlan el desplazamiento, el tamaño y las tres copias que acompañan la salida. Cada ciclo muestra todas las imágenes en su orden; Inicio, Fin y Ciclos delimitan la secuencia por scroll, mientras Loop continuo avanza por tiempo sin Director.

Se puede personalizar y previsualizar antes de insertar. Conserva encuadres individuales, carga múltiple, orden, recuperación de imágenes al cambiar cantidad, textos e imágenes libres, Biblioteca, fondo transparente, colocación como grupo o escena y edición posterior. Las superficies de la estela comparten la textura de la imagen; las tarjetas invisibles conservan su textura y evitan trabajo de rasterizado por fotograma.

Las comprobaciones del modelo cubren orden y visibilidad, entrada/permanencia/salida, estela opcional, cierre exacto, límites, texturas estables, proporcionalidad y fábrica exportada. Las pruebas de navegador verifican la estela en píxeles reales, scroll real después de guardar, loop independiente, controles, borradores, Biblioteca con IDs nuevos, historial, JSON/HTML, móvil y movimiento reducido. Los flujos compartidos prueban también redimensionado por mouse, selección del grupo, carga múltiple y encuadre con archivos reales. Se conserva en la tanda pendiente de publicación.

## Orbit Bloom: anillo de pétalos

Nueva composición basada en el HAR: las láminas giran como los radios de una rueda y se inclinan hacia el centro. Arranca con doce imágenes propias, doce segundos por vuelta y de cuatro a dieciséis posiciones editables. Permite elegir sentido, ritmo constante o rápido/lento/rápido, intensidad del ritmo, inclinación hacia el centro, ancho y profundidad del anillo, rotación, perspectiva, desvanecimiento posterior, tamaño y curvatura hacia afuera o adentro. La inclinación hacia el centro y la curvatura comienzan en cero. El tamaño admite hasta 80% para facilitar composiciones con pocas imágenes.

Con curvatura, las superficies se ordenan por profundidad entre todas las tarjetas; el mismo orden determina qué imagen se selecciona al pulsar una zona donde se cruzan pétalos. Las tarjetas vistas de canto no capturan la selección de otra imagen. Un lienzo compartido dibuja las superficies curvas sin rasterizar además las tarjetas ocultas. Las texturas y sus esquinas se mantienen estables durante el giro.

Comparte carga individual/múltiple, miniaturas, encuadre, orden, recuperación de cantidad, borradores, Biblioteca, fondos y transparencia, grupos/escenas e historial. Scroll recorre vueltas entre Inicio y Fin y responde después de guardar; Loop usa segundos por vuelta y funciona sin Director. El modelo verifica geometría, sentido/ritmo, curvatura, visibilidad, cierre, proporcionalidad y fábrica exportada. Las pruebas de navegador cubren los cruces en píxeles reales con curvatura positiva/negativa y selección de la superficie visible, además de controles, edición previa y posterior, scroll real, loop, Biblioteca, JSON/HTML, móvil, movimiento reducido, redimensionado, cargas y encuadres. Queda en la tanda pendiente de publicación.

## Ticker Tilt: filas en perspectiva

Nueva composición basada en el comportamiento y los parámetros del HAR de referencia. Las imágenes recorren filas sobre un mismo plano inclinado, con perspectiva que cambia a lo largo de su profundidad. Arranca con doce láminas propias, doce segundos por ciclo y de cuatro a veinticuatro imágenes editables. Incluye tamaño de imagen, inclinación del plano de −55° a 55°, perspectiva, separación entre filas, proporción de imagen, esquinas y sombra. Los modos Sentidos opuestos, Mismo sentido y Escalonado comparten el sentido principal; Escalonado habilita Demora entre filas y suaviza el arranque y la llegada de cada fila.

Las repeticiones visuales de una misma posición comparten su imagen y textura. Seleccionar cualquiera de las copias visibles permite reemplazar el contenido, ajustar el encuadre o cambiar su posición en la fila. El contorno destaca sus copias dentro del lienzo, y las zonas fuera del encuadre no interceptan clics. Las superficies se dibujan en un lienzo compartido con recorte al área visible, conservando una sola tarjeta editable por posición. No se crean recursos nuevos para cada repetición ni texturas nuevas por fotograma.

Se prepara antes de insertar y se conserva editable como grupo o escena. Incluye carga múltiple, miniaturas, encuadre individual, orden, recuperación de posiciones al cambiar cantidad, textos e imágenes libres, Biblioteca, transparencia, historial y HTML exportado. Cada ciclo desplaza todas las posiciones de la secuencia; Scroll recorre los ciclos entre Inicio y Fin y funciona después de guardar cambios. Loop continuo se anima por tiempo, independiente del scroll y sin Director.

El modelo verifica 4–24 posiciones, visibilidad de todas las fuentes, repeticiones enlazadas, sentido de las filas, modos y demora, cierre exacto, geometría finita, texturas estables, límites de asignación, proporcionalidad y fábrica exportada. Las pruebas de navegador cubren clics reales en distintas copias, controles, cantidad y recuperación, edición previa/posterior, Biblioteca, scroll real después de guardar, loop independiente, transparencia, historial, JSON/HTML, móvil y movimiento reducido. Las comprobaciones compartidas verifican redimensionado proporcional por mouse, encuadres con píxeles reales y carga múltiple. Queda guardada en la tanda pendiente de publicación.

## Ticker Loop: filas y columnas con zoom

Nueva plantilla basada en el HAR de referencia, con doce imágenes propias iniciales, doce segundos por ciclo y de cuatro a veinticuatro posiciones editables. Las filas horizontales o columnas verticales se desplazan en sentidos opuestos o en un mismo sentido. Rotación del plano gira la composición completa de −15° a 15°, manteniendo rectangulares las imágenes. Incluye tamaño, separación, proporciones, esquinas, sombra y fondos, con “Sin fondo” inicial.

Movimiento permite elegir Continuo, Pulsos de zoom o Recorrido con paradas. Pulsos controla cantidad e intensidad del zoom y el tiempo de pausa. Recorrido mueve la cámara entre posiciones reproducibles, mostrando el plano completo entre acercamientos; permite ajustar cantidad de paradas, zoom, pausa, avance lento durante la pausa y margen de cámara. Los controles específicos aparecen únicamente en su modo. El inicio y el fin de cada ciclo coinciden, incluida la cámara, para que el loop cierre sin salto.

Reutiliza el lienzo compartido y la selección de copias de Ticker Tilt. Cada posición conserva una sola imagen editable y sus repeticiones comparten textura. Los pulsos y movimientos de cámara usan una textura estable por imagen; los acercamientos grandes limitan su lado mayor a 2048 píxeles de dibujo. Las imágenes pueden reemplazarse, reordenarse y encuadrarse antes o después de insertar. Mantiene carga múltiple, miniaturas, recuperación de posiciones, elementos libres, Biblioteca, transparencia, grupos o escenas, historial y HTML exportado. Scroll controla toda la secuencia, incluido el zoom; Loop continuo avanza por tiempo sin Director.

Las pruebas del modelo cubren orientación, sentidos, pulsos, paradas y avance lento, rotación sin deformación, cierre exacto, visibilidad, geometría finita, texturas estables, proporcionalidad y fábrica exportada. Las comprobaciones de navegador incluyen controles y sus modos visibles, ausencia de nuevas texturas durante ciclos de zoom después de calentarlas, límite de textura con acercamientos grandes, selección real de copias, cantidad 4–24, Biblioteca, scroll después de guardar, loop independiente, historial, JSON/HTML, móvil y movimiento reducido. Las pruebas compartidas cubren encuadres con píxeles reales, cargas múltiples y redimensionado por mouse con cámara y orientación vertical. Queda en la tanda pendiente de publicación.

## Carousel Flow: foco central en una secuencia

Nueva plantilla basada en el HAR: las imágenes se deslizan hasta el centro y permanecen allí antes de la siguiente transición. Comienza con cinco láminas propias, diez segundos por ciclo y de tres a diez posiciones editables. Permite elegir orientación horizontal o vertical, tamaño de las imágenes laterales de 0,6 a 1, separación, margen, esquinas, sombra y proporciones de imagen, incluida “Del lienzo”. Las laterales se reducen y atenúan mientras la central toma protagonismo, conservando las imágenes rectangulares.

Cada ciclo presenta todas las imágenes. Scroll permite fijar ciclos, Inicio, Fin y recorrido de escena, y controla avance, pausa y retroceso. Loop continuo usa segundos por ciclo y funciona sin Director. Con pocas imágenes y formatos extremos, las copias que alcanzan los bordes comparten su fuente y permiten continuar el recorrido sin saltos visibles; cualquiera de ellas puede seleccionarse para editar la misma imagen.

Reutiliza el lienzo compartido, el recorte al área visible y los contornos de selección. Conserva una posición editable por imagen y una textura estable durante los cambios de foco. Incluye edición previa y posterior, carga individual y múltiple, miniaturas, encuadre, orden, recuperación al modificar cantidad, elementos libres, Biblioteca, fondos con “Sin fondo” inicial, grupos o escenas, historial y exportación a HTML.

El modelo comprueba cantidad, orientaciones y proporciones, foco central y pausa, repetición continua en los bordes, límites de geometría y asignación, texturas estables, cierre exacto, proporcionalidad y fábrica exportada. Las pruebas de navegador verifican controles, selección real y copias vinculadas, cantidad y recuperación, ausencia de nuevas texturas por ciclo, edición previa/posterior, Biblioteca, scroll después de guardar, loop independiente, historial, JSON/HTML, móvil y movimiento reducido. Las comprobaciones compartidas cubren redimensionado por mouse con orientación vertical, encuadres con píxeles reales y carga múltiple. Queda en la tanda pendiente de publicación.

## Stack Slide: imágenes que suben y se apilan

Nueva plantilla basada en el HAR de referencia, con cuatro láminas propias iniciales, ocho segundos por ciclo y de tres a ocho posiciones editables. Cada imagen sube desde abajo con un giro inicial de dos grados que se corrige al llegar; permanece sobre las dos anteriores antes de la siguiente transición. La llegada ocupa el 55% de cada turno. Incluye margen de tarjeta de 0 a 15%, tamaño entre niveles de 0,85 a 1, desplazamiento horizontal y vertical de −50 a 50%, margen de lienzo, esquinas, sombra y proporciones de imagen, incluida “Del lienzo”.

Las tarjetas anteriores se reducen y atenúan según su nivel. El dibujo y la selección respetan el mismo orden de profundidad: se puede pulsar una parte expuesta de una tarjeta posterior o la imagen que la cubre para editar la correspondiente. Las superficies se recortan al área visible y conservan una textura por imagen, independiente de su movimiento y tamaño animado. Las proporciones permanecen estables y el grupo se escala de forma proporcional en el lienzo.

Comparte edición y previsualización antes de insertar, carga individual y múltiple, miniaturas, encuadre, orden, recuperación al cambiar cantidad, elementos libres, borradores, Biblioteca, fondos con “Sin fondo” inicial, grupos o escenas, edición posterior, historial y exportación a HTML. Scroll permite elegir ciclos, Inicio, Fin y recorrido; Loop continuo usa segundos por ciclo sin Director. Guardar cambios en la instancia mantiene la respuesta al scroll real.

El modelo comprueba cantidad, subida, giro, niveles y profundidad, permanencia, proporciones, límites de geometría, texturas estables, cierre exacto, proporcionalidad y fábrica exportada. Las pruebas de navegador verifican clics reales en tarjetas superpuestas, controles, cantidad y recuperación, ausencia de nuevas texturas por ciclo, Biblioteca, scroll después de guardar, loop independiente, historial, JSON/HTML, móvil y movimiento reducido. Las comprobaciones compartidas cubren redimensionado proporcional por mouse, selección del grupo, encuadres con píxeles reales y cargas múltiples. Queda en la tanda pendiente de publicación.

## Verificación automática en dos grupos

GitHub Actions ejecuta `procedural` y `editor` en runners independientes. El primero cubre las composiciones procedurales y sus flujos compartidos; el segundo cubre las herramientas generales de edición y el resto de las composiciones. Ambos ejecutan los modelos puros, arranque, contratos, persistencia y comprobaciones comunes. Se conservan todas las verificaciones anteriores y cada grupo guarda sus capturas en un artefacto propio. Ejecutar el script sin `NAGWEB_SMOKE_SUITE` mantiene la verificación completa en un solo proceso.

## Iso Focus: fila diagonal con foco escalonado

La composición del HAR organiza las imágenes en una fila diagonal a −34°, con tarjetas superpuestas a ambos lados de una posición central. Comienza con diez láminas propias y doce segundos por ciclo, y admite de cuatro a dieciséis imágenes. Tamaño, Inclinación, Separación en la pila, Espacio alrededor del foco, Tamaño de la imagen central y Sentido controlan la composición. Las tarjetas avanzan en pequeños pasos escalonados y permanecen detenidas entre transiciones. La inclinación conserva una transformación afín y no modifica las proporciones de la fuente.

Las repeticiones mantienen una sola posición editable y textura por imagen. El lienzo compartido ordena las copias por su profundidad individual; los clics usan ese mismo orden, incluso cuando distintas copias de una fuente se cruzan con otras imágenes. El dibujo y los contornos se recortan al lienzo. Las texturas conservan tamaño durante los cambios del foco central y limitan su lado mayor a 2048 píxeles de dibujo.

Comparte edición y previsualización antes de insertar, carga individual y múltiple, miniaturas, encuadres, orden, recuperación al cambiar cantidad, elementos libres, borradores, Biblioteca, fondos con “Sin fondo” inicial, grupos o escenas, edición posterior, historial y HTML exportado. Scroll recorre ciclos entre Inicio y Fin y sigue respondiendo después de guardar cambios; Loop usa segundos por ciclo sin Director. La composición inicial de tres láminas pasa a mostrarse como “Foco de láminas”, conservando su identificador `iso-focus` y el comportamiento de las instancias y composiciones guardadas. La nueva plantilla utiliza `iso-focus-sequence`.

El modelo prueba 4–16 posiciones, foco y pausa, inclinación, proporciones, ambos sentidos, cierre exacto y continuidad de las copias, geometría acotada, profundidad, texturas estables, escalado proporcional y fábrica exportada. Las pruebas de navegador cubren copias seleccionables, controles, cantidad y recuperación, Biblioteca, scroll real después de guardar, loop independiente, transparencia, historial, JSON/HTML, móvil y movimiento reducido. Una comprobación específica usa imágenes propias de colores planos y clics reales para verificar que los píxeles y la selección coincidan con la tarjeta frontal en ambos sentidos, incluyendo cruces que requieren ordenar cada copia. Los flujos compartidos prueban encuadres con píxeles reales, carga múltiple y redimensionado por mouse. Queda en la tanda pendiente de publicación.

## Card Toss: lanzamientos de imágenes

Nueva plantilla basada en el HAR, con ocho láminas propias iniciales, doce segundos por ciclo y de cuatro a dieciséis posiciones editables. Las imágenes suben desde debajo del lienzo, reducen su velocidad cerca del punto más alto y vuelven a caer con un giro suave. Cada ciclo presenta todas las fuentes. Permite ajustar tamaño de 14 a 45%, variación de tamaño de 0 a 50%, altura del lanzamiento de 40 a 95%, dispersión horizontal de 0 a 100%, giro de 0 a 45° y desplazamientos horizontal/vertical de −50 a 50%. El ritmo “Una por vez” lanza una imagen cada turno; “Superpuestas” permite hasta tres vuelos simultáneos. Incluye proporciones de imagen, margen, esquinas y sombra, con proporción 3:4 inicial.

La variación se calcula de manera determinista para cada posición. El recorrido sigue una parábola, con un desplazamiento lateral lineal y una rotación afín que conserva la proporción. Las tarjetas mantienen el orden de sus fuentes al cruzarse; la selección respeta ese mismo orden y el recorte al lienzo. Cada imagen conserva una textura estable durante su vuelo, con el lado mayor limitado a 2048 píxeles de dibujo. El ciclo cierra exactamente y el grupo se redimensiona de forma proporcional.

Comparte edición y previsualización antes de insertar, carga individual y múltiple, miniaturas, encuadres, orden, recuperación al cambiar cantidad, elementos libres, borradores, Biblioteca, fondos con “Sin fondo” inicial, grupos o escenas, edición posterior, historial y HTML exportado. Scroll permite fijar ciclos, Inicio, Fin y recorrido; Loop continuo usa segundos por ciclo sin Director. Guardar cambios mantiene la respuesta al scroll real.

El modelo prueba 4–16 fuentes, subida/apogeo/caída, ambos ritmos, proporciones, altura, tamaño, dispersión, giro y posición, límites de geometría, texturas estables, cierre exacto, proporcionalidad y fábrica exportada. Las pruebas de navegador cubren controles, cantidad y recuperación, ausencia de nuevas texturas por ciclo, Biblioteca, scroll real después de guardar, loop independiente, transparencia, historial, JSON/HTML, móvil y movimiento reducido. Una comprobación específica carga imágenes de colores planos y compara píxeles de la captura del navegador y clics reales con la tarjeta frontal durante dos vuelos superpuestos. Los flujos compartidos cubren encuadres con píxeles reales, carga múltiple y redimensionado proporcional por mouse. Queda en la tanda pendiente de publicación.

## Diagonal Carousel e Iso Cascade: cintas diagonales editables

Continuación de Motion Lab a partir del HAR `animos har.har` del 2 de octubre de 2026. El catálogo pasa de 15 a 17 composiciones. Las referencias del HAR son `diagonal-carousel` e `iso-cascade`; la implementación usa geometría propia dentro de `NAGWEB_CREATE_STREAM_MODEL`, el mismo Director y la misma exportación que las composiciones anteriores.

- **Diagonal Carousel**: 6 imágenes iniciales, 3–12 posiciones, ciclo de 12 segundos. Cuatro direcciones, movimiento continuo o por pasos, tamaño 20–70%, superposición 0–85% y demora entre láminas 0–100% (visible al elegir pasos). El centro se dibuja delante de las tarjetas laterales.
- **Iso Cascade**: 10 imágenes iniciales, 4–20 posiciones, ciclo de 10 segundos. Cuatro direcciones, movimiento continuo o escalonado, tamaño 25–70%, inclinación 0–90% y separación 20–100%. La superficie conserva la inclinación isométrica y el orden de la cinta.

Ambas incluyen proporción de imagen/lienzo, esquinas, sombra, fondos, carga múltiple, encuadre por imagen, cambio de orden y recuperación de posiciones al aumentar la cantidad. Las copias de borde comparten la imagen original y su textura. Pintado y selección usan la profundidad de cada copia; los canvas quedan acotados al lienzo. No hay un reloj ni una línea de tiempo adicional.

Funcionan como loop de tiempo o secuencia por scroll con ciclos, inicio, fin y recorrido configurables. Pueden guardarse en Biblioteca, insertarse como grupo/escena, reabrirse, deshacerse y exportarse a JSON/HTML. El movimiento reducido mantiene una pose estática. La fábrica exportada incluye los dos modelos.

Validación: `.github/nagweb-diagonal-model-test.mjs` cubre direcciones, ciclos, modos, texturas estables, escala proporcional, copias y fábrica exportada. `.github/nagweb-motion-diagonal-smoke.mjs` cubre controles, archivos propios, píxeles y clics sobre tarjetas superpuestas, cantidad/recuperación, Biblioteca, grupo reeditable, historial, scroll real, exportación y móvil. La nueva suite `diagonal` corre separada de `procedural` y `editor` para mantener las verificaciones dentro del límite de tiempo.

Referencias pendientes del HAR para futuras etapas: Zoom Parallax (zoom y dirección de paneo), Cascade Drop (giro y apilado), Focus Shift (riel y foco), Spiral Stream (hélice y profundidad), entre otras. Esto es una lista de candidatos recuperados, no una prioridad acordada en el chat anterior. Mantener el trabajo en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas de Storytelling/Interaction durante esta etapa.


## Grid Reveal: armado y retiro de una grilla

Se incorpora la referencia `grid-reveal` del mismo HAR de Animos. El catálogo pasa de 17 a 18 composiciones. La grilla inicial tiene 4 imágenes y un ciclo de 6 segundos; admite 2–9 imágenes y orden de aparición por filas, columnas o diagonales. Separación 0–10%, margen 0–20%, esquinas, sombra y fondo conservan los controles de Motion Lab.

El ciclo arma las tarjetas durante el primer 35%, mantiene la grilla completa hasta el 65% y retira las tarjetas en orden inverso durante el tramo final. Cada tarjeta combina opacidad y tamaño (70–100%) sin alterar la proporción de su casilla. La disposición de 2, 3 o 4 imágenes y las grillas de hasta 3 columnas siguen la referencia. La proporción de imagen depende de la casilla; el encuadre individual permite elegir el recorte.

La cantidad, carga múltiple, orden de contenido y recuperación de posiciones funcionan con la infraestructura existente. Loop, scroll con ciclos/inicio/fin/recorrido, Biblioteca, grupo o escena reeditable, undo/redo y JSON/HTML comparten el Director y la fábrica exportada. Las texturas no cambian durante la aparición o salida. Con movimiento reducido se muestra la grilla completa.

Verificación: `nagweb-reveal-model-test.mjs` cubre órdenes reales de 9 posiciones, armado/permanencia/salida inversa, geometría proporcional, límites, textura estable, scroll y fábrica exportada. `nagweb-motion-grid-reveal-smoke.mjs` verifica los controles en navegador y el flujo de edición/guardado/exportación/móvil. La suite `grid` agrega colocación y cambio de tamaño con mouse y carga múltiple de archivos reales. Continúa en `internal-motion-lab`, sin despliegue Vercel. Próximo candidato: Zoom Parallax.

## Zoom Parallax: zoom y desplazamiento entre imágenes

Se incorpora `zoom-parallax` del HAR de Animos. El catálogo pasa de 18 a 19 composiciones. Tres láminas iniciales, ciclo de 9 segundos y 2–8 imágenes. Controles propios: amplitud del zoom 4–25% (12% inicial) y dirección del recorrido alternada, izquierda o derecha. Incluye proporción del lienzo, margen, esquinas, sombra y fondos; cada imagen ocupa el mismo marco y conserva su encuadre individual.

Cada turno acerca lentamente una imagen y recorre su encuadre horizontal. En el último 18% entra la siguiente mediante un fundido suave sobre la imagen actual. La implementación propia anticipa el movimiento de la entrante durante el fundido y conserva esa pose al tomar el siguiente turno: evita saltos al cambiar de imagen y al volver a la primera, incluso con una cantidad impar. La dirección describe el recorrido del encuadre, igual que los controles de foco horizontal.

El renderer conserva una textura de la imagen completa, con el lado mayor limitado a 2048 píxeles, en lugar de precortar la fuente. Zoom y desplazamiento cambian únicamente su dibujo dentro del marco fijo, cuyo recorte conserva las esquinas. El encuadre se limita a los bordes de la foto, manteniendo su proporción sin descubrir huecos. La textura se reutiliza durante el ciclo. Selección y profundidad siguen a la imagen entrante durante el fundido.

Usa el mismo modelo y Director para Loop y scroll con ciclos/inicio/fin/recorrido, carga individual o múltiple, orden y recuperación de posiciones, elementos libres, Biblioteca, grupo o escena reeditable, undo/redo y JSON/HTML. Movimiento reducido mantiene una imagen estática visible, independientemente del rango de scroll o la cantidad de ciclos.

Verificaciones añadidas: `nagweb-zoom-model-test.mjs` para límites, direcciones, fundidos, continuidad, proporción, encuadre, cobertura, escala y fábrica exportada; `nagweb-motion-zoom-smoke.mjs` para controles, píxeles reales de desplazamiento/encuadre, texturas acotadas sin recreación, clic sobre la imagen frontal, Biblioteca, guardado, scroll real, loop, historial, exportación, móvil y movimiento reducido. La suite `zoom` incluye redimensionado por mouse y carga múltiple de archivos reales. Se mantiene en `internal-motion-lab`, sin despliegue ni integración con otras ramas. Próximo candidato del HAR: Cascade Drop.

## Cascade Drop: caída, pila y salida conjunta

Nueva referencia `cascade-drop` del HAR de Animos: el catálogo pasa de 19 a 20 composiciones. Cuatro imágenes iniciales, ciclo de 7 segundos y 2–8 posiciones. Controles propios: intensidad del giro 0–200% (100% inicial), tamaño 50–95% (78% inicial) y proporción de imagen, incluida “Del lienzo”; proporción 1:1 inicial. Incluye margen, esquinas, sombra y fondos, con “Sin fondo” inicial.

Las imágenes entran por turnos durante el primer 62% del ciclo, giran ligeramente y se acomodan con un pequeño rebote. La pila queda quieta hasta el 82%; después todas las imágenes salen juntas hacia abajo. La última fuente queda delante. El giro conserva la proporción rectangular, y las posiciones y el ritmo son deterministas. El ciclo vuelve al inicio cuando la pila ya está fuera del lienzo.

La geometría propia vive en la misma fábrica procedural. El renderer existente dibuja las tarjetas con el recorte del lienzo y texturas estables, limitadas a 2048 píxeles en su lado mayor. Los canvas se acotan a la parte visible de cada tarjeta; los polígonos de selección y la profundidad coinciden con el dibujo. Con movimiento reducido se mantiene la pila completa en una pose estática, independientemente del rango o cantidad de ciclos de scroll.

Comparte Loop y scroll con ciclos/inicio/fin/recorrido, encuadre y orden por imagen, carga múltiple, recuperación de posiciones al cambiar cantidad, elementos libres, Biblioteca, grupo o escena, edición posterior, undo/redo y JSON/HTML. Guardar una composición por scroll mantiene el movimiento en la escena real.

Verificación añadida: `nagweb-drop-model-test.mjs` cubre caída por turnos, rebote, permanencia, salida conjunta, giro, tamaño, proporciones, recursos acotados, texturas estables, escala, scroll y fábrica exportada. `nagweb-motion-drop-cascade-smoke.mjs` cubre controles y edición/exportación, más píxeles y clics reales sobre imágenes superpuestas durante caída, permanencia y salida. La suite `drop` incluye colocación/redimensionado por mouse, encuadre con imágenes panorámicas/verticales y carga múltiple de archivos reales. Se mantiene en `internal-motion-lab`, sin despliegue Vercel ni integración con otras ramas. Próximo candidato del HAR: Focus Shift.

## Focus Shift: miniaturas y foco principal

Se incorpora `focus-shift` del HAR de Animos. El catálogo pasa de 20 a 21 composiciones. Cuatro imágenes iniciales, ciclo de 10 segundos y 3–6 posiciones. Controles propios: tamaño del lateral 18–40% (26% inicial) y separación 0,5–8% (2,5% inicial). Incluye proporción del lienzo, margen, esquinas, sombra y fondos; el encuadre se ajusta por imagen.

Todas las imágenes permanecen visibles. Durante el primer 40% de cada turno, una miniatura se amplía hacia el foco principal, la imagen anterior vuelve al final del lateral y las otras miniaturas avanzan una posición. El foco se mantiene el resto del turno. El recorrido presenta todas las imágenes y cierra el ciclo sin saltos. Las esquinas interpolan entre ambos tamaños para conservar la continuidad al cambiar de turno. La imagen entrante queda delante durante las superposiciones; dibujo y selección respetan el mismo orden.

El lateral queda a la derecha en lienzos horizontales y abajo en lienzos verticales. La orientación usa la proporción efectiva del lienzo, incluida la proporción elegida, para que la disposición sea predecible al redimensionar. El renderer conserva la imagen original completa en una textura estable, limitada a 2048 píxeles en su lado mayor, y recalcula únicamente su recorte al cambiar el marco. Esto evita deformar la foto o regenerar texturas durante cada transición. El encuadre individual se conserva en la miniatura y en el foco.

Comparte Loop, scroll con ciclos/inicio/fin/recorrido, carga múltiple, orden y recuperación de imágenes, elementos libres, Biblioteca, grupo o escena reeditable, undo/redo y JSON/HTML. Movimiento reducido conserva una galería estática con la primera imagen en el foco, independientemente del rango o cantidad de ciclos de scroll.

Verificaciones añadidas: `nagweb-shift-model-test.mjs` cubre todos los turnos, permanencia, cierre y continuidad de geometría/esquinas, orientación, límites de controles, recursos acotados, escala y fábrica exportada. `nagweb-motion-focus-shift-smoke.mjs` cubre personalización y flujo de edición/exportación, reutilización de texturas durante el cambio de tamaño, móvil y movimiento reducido, más píxeles y clics reales sobre las cuatro transiciones con fotos propias. La suite `shift` incluye colocación/redimensionado por mouse, encuadre y carga múltiple de archivos reales. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con otras ramas. Próximo candidato del HAR: Spiral Stream.


## Spiral Stream: hélice vertical con tarjetas curvas o planas

Se incorpora `spiral-stream` del HAR de Animos mediante geometría propia en el modelo compartido. El catálogo pasa de 21 a 22 composiciones. Doce imágenes iniciales, 6–20 fuentes y ciclo de 28 segundos. La cantidad de tarjetas físicas es independiente: 8–48 (24 iniciales), distribuidas sobre una hélice de 1–6 vueltas (3,75 iniciales). Si hay más fuentes que tarjetas, se usan las primeras posiciones; aumentar las tarjetas incorpora las demás.

Controles de referencia: sentido descendente/ascendente; ritmo continuo, rápido–lento–rápido o por tarjeta; intensidad del pulso 10–90%; ancho 35–90%; estrechamiento −90–90% (hacia cualquiera de los extremos); tamaño de imagen 12–36%; proporción de imagen; tarjetas curvas en 3D o planas y verticales; desvanecimiento detrás 10–95%; perspectiva 0–40%; inclinación −45–45°; separación 0–50%; aumento frontal 0–60%. Conserva proporción del lienzo, margen, esquinas, sombra y fondos. Las vueltas de la hélice se guardan como `spiralTurns`: `turns` mantiene su significado común de ciclos de scroll, sin mezclar forma y reproducción.

La geometría asigna cada tarjeta a una fuente por posición y proyecta las superficies alrededor de la hélice. Las tarjetas curvas usan 48 segmentos horizontales, con profundidad por segmento; las planas conservan sus bordes verticales y solo su centro sigue la espiral inclinada. El renderer compartido ordena todos los segmentos, incluso los de distintas copias, y el selector usa exactamente los mismos polígonos y valores de profundidad. El recorte limita dibujo y selección al área útil del lienzo. Los canvas de fuente se acotan al lienzo y todas las copias reutilizan una textura estable por imagen, limitada a 2048 píxeles en su lado mayor. No crea texturas nuevas durante el movimiento. Las tarjetas envuelven el ciclo fuera del marco visible, y el modo por pasos pausa después del primer 55% de cada turno.

Comparte Loop y scroll con ciclos/inicio/fin/recorrido, encuadre y orden por fuente, carga múltiple, recuperación al cambiar cantidad, elementos libres, Biblioteca, grupo o escena reeditable, undo/redo y JSON/HTML. Movimiento reducido mantiene una espiral visible y estática, independientemente del rango de scroll o su cantidad de ciclos.

Verificación: `nagweb-spiral-model-test.mjs` cubre límites, todas las tarjetas, geometría curva/plana, extremos de inclinación/estrechamiento/perspectiva, escalado, texturas estables, continuidad, ritmos, dirección, scroll y fábrica exportada. `nagweb-motion-spiral-smoke.mjs` verifica personalización, recuperación, reutilización de texturas, píxeles y clics en superposiciones de ambos estilos, encuadre horizontal/vertical, aislamiento del borrador, Biblioteca, grupo/escena, guardado y scroll real, exportación, historial, móvil y movimiento reducido. La suite `spiral` añade colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con otras ramas. Próximo candidato del HAR: Film Strip.


## Film Strip y Card Totem: bandas curvas con paradas centrales

Dos composiciones del HAR de Animos, implementadas mediante geometría propia y un modelo común: `film-strip` es horizontal y `card-totem` es vertical. El catálogo pasa de 22 a 24 composiciones. Ambas arrancan con seis imágenes, admiten 3–12 y duran 12 segundos por ciclo. Film Strip usa tamaño 22–48% (32% inicial); Card Totem, 22–50% (34% inicial). Las dos incluyen proporción de imagen, separación 1–8% (2,5% inicial), curvatura −100–100% (70% inicial) y movimiento continuo o con paradas en el centro.

La curvatura positiva contrae y desvanece los extremos de la banda; la negativa los expande; cero deja las tarjetas planas. La banda avanza hacia la izquierda o arriba y cada parada presenta la siguiente imagen en el centro. El movimiento ocupa el primer 55% de cada turno y mantiene el centro el resto. Las curvas se calculan con 48 segmentos; las tarjetas planas usan un solo segmento. El eje de rasterizado cambia entre ambas orientaciones, conservando las fuentes y sus proporciones. Dibujo y selección usan los mismos segmentos y profundidades.

Las copias se calculan según el área visible, en lugar de fijar solo tres repeticiones: una secuencia corta sigue llenando un lienzo largo. Todas las copias actualizan su contenido y encuadre desde su fuente. La geometría y los canvas se acotan al marco útil; las texturas se reutilizan durante la animación y se limitan a 2048 píxeles en su lado mayor. Conserva margen, esquinas, sombra y los cuatro fondos.

Comparte Loop y scroll con ciclos/inicio/fin/recorrido, carga individual y múltiple, orden/encuadre por fuente y recuperación al cambiar cantidad, elementos libres, Biblioteca, grupo o escena reeditable, undo/redo y JSON/HTML. Con movimiento reducido queda una banda estática visible, independientemente del rango y la cantidad de ciclos del scroll.

Verificaciones: `nagweb-band-model-test.mjs` para ambos ejes, curvaturas, paradas, repeticiones, límites, proporciones, escala, texturas, cierre del ciclo y fábrica exportada. `nagweb-motion-band-smoke.mjs` cubre controles, píxeles de encuadre horizontal y vertical con ambas curvaturas y modo plano, clic real, reutilización de texturas, orden y recuperación, Biblioteca, grupo/escena, scroll real tras guardar y exportar, tiempo, historial, móvil y movimiento reducido. Las suites `film` y `totem` añaden colocación/redimensionado por mouse y carga múltiple. Se mantiene en `internal-motion-lab`, sin despliegue Vercel ni integración con otras ramas. Próximo candidato del HAR: Deck Peel.


## Deck Peel: una pila que descubre la siguiente tarjeta

Se incorpora `deck-peel`, a partir de los controles del HAR de Animos y geometría propia. El catálogo pasa de 24 a 25 composiciones. Cuatro imágenes iniciales, 4–8 fuentes y ciclo de 9 segundos. Controles de referencia: tamaño 35–65% (48% inicial), proporción de imagen y separación entre capas 2–8% (4% inicial, paso 0,5). Conserva proporción del lienzo, margen, esquinas, sombra y los cuatro fondos.

Cada turno deja caer la tarjeta frontal con un giro de 5°, mientras las tres capas siguientes avanzan hacia el frente. El movimiento ocupa el primer 45% del turno y luego mantiene la nueva tarjeta visible. La próxima capa posterior entra gradualmente: con cuatro fuentes es una copia de la saliente; con cinco a ocho es la siguiente fuente en el orden. Así se conserva la identidad de las tarjetas en el relevo, incluso al cerrar el ciclo. La tarjeta saliente desaparece fuera del marco útil antes del cambio de turno.

Cada fuente conserva su textura y puede tener varias superficies. Dibujo y selección comparten los mismos polígonos y profundidades; la saliente queda delante de la pila mientras cae. El canvas compartido se recorta al marco útil y sus texturas se limitan a 2048 píxeles en el lado mayor. No agrega un motor ni un reloj. Reutiliza reproducción por tiempo y scroll con ciclos/inicio/fin/recorrido, contenido y encuadre por fuente, orden y recuperación, carga múltiple, Biblioteca, grupo o escena reeditable, historial y exportación JSON/HTML. Movimiento reducido mantiene la pila estática independientemente del rango de scroll.

Verificaciones: `nagweb-peel-model-test.mjs` cubre límites, turnos de todas las fuentes, continuidad de los relevos, caída/pausa, profundidad y copias, proporciones, escala, texturas estables, geometría acotada, scroll y fábrica exportada. `nagweb-motion-peel-smoke.mjs` comprueba controles, píxeles y clics en la superposición durante la caída, encuadres horizontal/vertical, recuperación, Biblioteca, grupo/escena, scroll real tras guardar/exportar, tiempo, historial, móvil y movimiento reducido. La suite `peel` agrega colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Poster Burst.


## Poster Burst: imágenes que crecen desde el centro

Se incorpora `poster-burst` del HAR de Animos con geometría propia. El catálogo pasa de 25 a 26 composiciones. Cuatro imágenes iniciales, 2–10 fuentes y ciclo de 12 segundos. Proporción de imagen, incluida «Como el lienzo»; tres ritmos: una por una, escalonadas y por tandas. Los controles cambian según el ritmo: pausa 0–60% (30% inicial), superposición 20–100% (60% inicial) y cantidad por tanda 2–10 (3 iniciales). Conserva margen, proporción del lienzo, esquinas, sombra y los cuatro fondos.

Cada imagen nace en el centro y crece hasta cubrir el marco útil. Una por una mantiene la imagen anterior detrás y pausa cuando la nueva completa su crecimiento. Las entradas escalonadas se superponen según el porcentaje elegido. Las tandas agrupan las fuentes con un pequeño intervalo interno: el intervalo se acota para mantener el orden incluso en tandas grandes. En el caso mínimo de dos imágenes, el crecimiento termina antes de lanzar la segunda para conservar una imagen completa de fondo. Las fuentes más antiguas que una imagen ya completa quedan ocultas, sin trabajo de rasterizado adicional.

Las esquinas disminuyen durante el crecimiento y la sombra acompaña la expansión. El rasterizador compartido conserva la imagen original, limitada a 2048 píxeles en su lado mayor, y aplica el encuadre sobre el rectángulo animado. Mantiene la textura durante todo el movimiento y acota los canvas al marco útil. La selección respeta los mismos rectángulos y radios: un clic en una esquina transparente alcanza la imagen visible debajo. Comparte el Director y su reloj, sin un motor adicional.

Reutiliza Loop y scroll con ciclos/inicio/fin/recorrido, encuadre y orden por fuente, recuperación al cambiar cantidad, carga individual y múltiple, texto e imágenes libres, Biblioteca, grupo o escena reeditable, historial y exportación JSON/HTML. Movimiento reducido mantiene una imagen completa y estática independientemente del rango y la cantidad de ciclos de scroll.

Verificaciones: `nagweb-burst-model-test.mjs` cubre límites, los tres ritmos, pausa/superposición/tandas, orden de fuentes, cobertura de fondo, profundidad, proporciones, escalado, radios dinámicos, texturas estables, canvas acotados, cierre del ciclo, scroll y fábrica exportada. `nagweb-motion-burst-smoke.mjs` verifica controles condicionales, recuperación, píxeles y selección de frente/esquina transparente, encuadre horizontal/vertical, reutilización de texturas, Biblioteca, grupo/escena, scroll real después de guardar/exportar, tiempo, historial, móvil y movimiento reducido. La suite `burst` incluye colocación/redimensionado por mouse y carga múltiple. Se mantiene en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Photo Orbit.


## Photo Orbit: grupo de imágenes en una órbita circular o elíptica

Se incorpora `photo-orbit` del HAR de Animos con geometría propia. El catálogo pasa de 26 a 27 composiciones. Ocho imágenes iniciales, 3–12 fuentes y ciclo de 18 segundos. Controles de referencia: giro horario/antihorario, ritmo constante/rápido–lento–rápido/pausa por tarjeta, intensidad del pulso 10–90% (60% inicial), ancho y alto de la órbita 30–80% (56% inicial), tamaño 14–38% (26% inicial) y proporción de imagen. Conserva margen, proporción del lienzo, esquinas, sombra y los cuatro fondos. El pulso solo se muestra al elegir su ritmo.

Todas las tarjetas orbitan juntas alrededor del centro y se mantienen de frente. Una pequeña variación determinista de tamaño y radio produce un conjunto menos uniforme, sin aleatoriedad durante la reproducción. El ritmo por pasos avanza una posición durante el primer 55% del turno y pausa el resto. El pulso acelera al principio y al final y desacelera en el medio, con avance monotónico. El orden de las fuentes determina las superposiciones: las últimas se dibujan delante, y cambiar el orden también cambia su posición en la órbita.

La geometría conserva el tamaño de cada textura durante el movimiento y limita los canvas al marco útil. Las texturas usan el encuadre de cada fuente y se acotan a 2048 píxeles en su lado mayor. El dibujo y la selección respetan el mismo rectángulo, radio de esquina y orden. Reutiliza el rasterizador, el Director y su reloj, sin motores adicionales.

Comparte Loop y scroll con ciclos/inicio/fin/recorrido, contenido y encuadre por fuente, orden y recuperación al cambiar cantidad, carga individual y múltiple, texto e imágenes libres, Biblioteca, grupo o escena reeditable, historial y exportación JSON/HTML. Movimiento reducido conserva una órbita visible y estática independientemente del rango y la cantidad de ciclos de scroll.

Verificaciones: `nagweb-photo-model-test.mjs` comprueba límites, 3–12 fuentes, tarjetas siempre de frente, variación de tamaño, sentidos y ritmos, pausas, pulso monotónico, extremos del marco/proporciones/escala, orden de superposición, texturas estables, canvas acotados, cierre del ciclo, scroll y fábrica exportada. `nagweb-motion-photo-smoke.mjs` cubre controles y pulso condicional, recuperación, píxeles/clics en una órbita densa, encuadre horizontal/vertical, textura estable, orden, Biblioteca, grupo/escena, scroll real tras guardar/exportar, tiempo, historial, móvil y movimiento reducido. La suite `photo` incluye colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Wheel Carousel.


## Wheel Carousel: rueda de tarjetas con anticipación, rebote y pausa

Se incorpora `wheel-carousel` del HAR de Animos mediante geometría propia. El catálogo pasa de 27 a 28 composiciones. Seis imágenes iniciales, 4–10 fuentes y ciclo de 9 segundos. Controles de referencia: sentido horario/antihorario, tamaño de imagen 40–90% (70% inicial), tamaño de rueda 70–160% (105% inicial), anticipación 0–40% (20% inicial), rebote 0–30% (10% inicial), pausa 0–60% (33% inicial) y proporción de imagen. Añade los desplazamientos horizontal/vertical −50–50% de la referencia. Conserva proporción del lienzo, margen, esquinas 0–12% (5% inicial), sombra y los cuatro fondos.

Cada turno retrocede ligeramente, avanza más allá de la próxima posición y se acomoda antes de la pausa. Los tres tramos ocupan 20%, 40% y 40% de la parte móvil del turno. Anticipación y rebote admiten cero; la pausa reserva el porcentaje elegido al final. La rueda presenta todas las fuentes en el centro. Las tarjetas giran con la rueda, situada debajo del centro del lienzo, y se ordenan por su profundidad angular.

Hay dos copias físicas por fuente, separadas media vuelta. Un ciclo avanza tantas posiciones como fuentes y la copia opuesta permite cerrar sin saltos. Las copias comparten contenido, encuadre y textura. El hemisferio posterior se oculta; una transición breve de opacidad en su límite evita una aparición brusca con proporciones que dejan ver los extremos de la rueda. El canvas compartido se recorta al marco útil; las texturas permanecen estables durante el movimiento y se limitan a 2048 píxeles en su lado mayor. Dibujo y selección usan los mismos polígonos, profundidad y esquinas redondeadas giradas: un clic en una esquina transparente alcanza la tarjeta visible debajo.

Reutiliza el Director, su reloj y rasterizador, Loop y scroll con ciclos/inicio/fin/recorrido, orden y recuperación al cambiar cantidad, encuadre por fuente, carga individual y múltiple, elementos libres, Biblioteca, grupo o escena reeditable, historial y exportación JSON/HTML. Movimiento reducido conserva una rueda estática con imágenes visibles independientemente del rango y los ciclos del scroll.

Verificaciones: `nagweb-wheel-model-test.mjs` cubre límites, 4–10 fuentes, anticipación/rebote/pausa, ambos sentidos, copias y profundidad, desvanecimiento posterior, cierre del ciclo, proporciones, desplazamientos, escala, texturas estables, canvas acotados, scroll y fábrica exportada. `nagweb-motion-wheel-smoke.mjs` cubre controles, recuperación, píxeles y clics en tarjetas giradas superpuestas y esquinas transparentes, encuadre horizontal/vertical, reutilización de texturas, Biblioteca, grupo/escena, scroll real tras guardar/exportar, tiempo, historial, móvil y movimiento reducido. La suite `wheel` añade colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Wheel Spin.


## Wheel Spin: rueda completa con giro propio y volteo de tarjetas

Se incorpora `wheel-spin` del HAR de Animos mediante geometría propia. El catálogo pasa de 28 a 29 composiciones. Ocho imágenes iniciales, 4–14 fuentes y ciclo de 14 segundos. Controles de referencia: sentido horario/antihorario, tamaño de imagen 12–45% (26% inicial), proporción de imagen, tamaño de rueda 50–100% (92% inicial), 1–4 vueltas de rueda por ciclo (1 inicial), movimiento continuo o por pasos, anticipación 0–40% (20% inicial), rebote 0–30% (10% inicial), pausa 0–60% (33% inicial), giro de tarjeta acompañando la rueda, sobre sí misma o con volteo 3D. Los giros propios admiten 1–8 vueltas por ciclo (2 iniciales); el volteo permite eje horizontal o vertical. Conserva desplazamientos −50–50%, proporción del lienzo, margen, esquinas 0–12% (5% inicial), sombra y los cuatro fondos.

La rueda se centra en el marco útil y reserva el radio de la diagonal de la tarjeta antes de calcular su radio de giro. Así las tarjetas con giro propio caben durante todo el ciclo en las proporciones habituales. Si el tamaño y la proporción de una tarjeta superan el marco, el radio se reduce a cero y el recorte común limita la superficie; los desplazamientos permiten mover deliberadamente la rueda hacia el borde.

El movimiento por pasos divide cada vuelta en tantas posiciones como fuentes y usa el mismo relevo con anticipación, rebote y pausa de Wheel Carousel. Las opciones de ese relevo solo aparecen al elegir por pasos. El giro propio y el volteo siguen avanzando durante la pausa de la rueda, como en la referencia. Las vueltas de rueda se guardan como `rotations` y las de tarjeta como `spinRate`; `turns` conserva su significado común de ciclos de scroll. Ambos conteos de vueltas son enteros para cerrar sin saltos.

El volteo proyecta la tarjeta mediante la compresión cosenoidal del eje elegido, muestra la fuente reflejada en la cara posterior y oculta la superficie cuando queda de canto, evitando transformaciones inversas singulares. Las texturas conservan su tamaño y encuadre durante el giro y se acotan a 2048 píxeles en el lado mayor. Cada fuente usa una única superficie; todas se dibujan en el canvas compartido. La profundidad angular continua evita un cambio brusco de apilamiento al cruzar el inicio de una vuelta. Dibujo, sombra y selección comparten polígonos y esquinas redondeadas transformadas; la selección invierte giro y escala, incluso en caras reflejadas.

Reutiliza el Director y su reloj, Loop y scroll con ciclos/inicio/fin/recorrido, contenido, orden y encuadre por fuente, recuperación al cambiar cantidad, carga individual y múltiple, elementos libres, Biblioteca, grupo o escena reeditable, historial y JSON/HTML. Movimiento reducido muestra una rueda estática independientemente del rango y los ciclos del scroll.

Verificaciones: `nagweb-spin-model-test.mjs` cubre límites, 4–14 fuentes, ambos sentidos, 1–4 vueltas, movimiento continuo/por pasos, pausa, giro propio, ambos ejes de volteo, caras reflejadas y desaparición de canto, radio reservado, proporciones, desplazamientos, escala, recursos estables/acotados, cierre del ciclo, scroll y fábrica exportada. `nagweb-motion-spin-smoke.mjs` cubre controles condicionales, recuperación, píxeles y clics en superposiciones y esquinas, caras invertidas en ambos ejes, encuadre horizontal/vertical, texturas estables, Biblioteca, grupo/escena, guardado, scroll real y exportación, tiempo, historial, móvil y movimiento reducido. La suite `spin` agrega colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con las ramas paralelas. Próximo candidato del HAR: Wheel Spin Bottom.


## Wheel Spin Bottom: rueda desde abajo con copias y avance escalonado

Se incorpora `wheel-spin-bottom` del HAR de Animos mediante geometría propia. El catálogo pasa de 29 a 30 composiciones. Ocho imágenes iniciales, 4–14 fuentes y ciclo de 14 segundos. Controles de referencia: sentido horario/antihorario, tamaño de imagen 10–36% (20% inicial), proporción de imagen, tamaño de rueda 30–90% (50% inicial), 1–4 vueltas de rueda por ciclo (1 inicial), movimiento continuo o por pasos, anticipación 0–40% (20% inicial), rebote 0–30% (10% inicial), pausa 0–60% (33% inicial), demora entre tarjetas 0–100% (40% inicial), giro de tarjeta acompañando la rueda, sobre sí misma o con volteo 3D. Las tarjetas admiten 1–8 vueltas propias por ciclo (2 iniciales), con eje horizontal o vertical para el volteo. Conserva desplazamientos −50–50%, proporción del lienzo, margen, esquinas 0–12% (5% inicial), sombra y los cuatro fondos.

El centro de giro se coloca por debajo del centro del lienzo, a una distancia igual al radio. Con el tamaño inicial y un lienzo horizontal ocupa el borde inferior: las tarjetas dibujan una cúpula por encima. Cambiar radio, proporción o desplazamiento permite dejar ver más o menos rueda. Se calculan dos tarjetas físicas por fuente, separadas media vuelta; ambas conservan el mismo contenido, encuadre y textura. Solo las superficies que intersectan el marco útil se dibujan, incluidas ambas copias cuando la proporción deja verlas.

Una vuelta por pasos tiene tantas posiciones como tarjetas físicas, el doble de las fuentes editables. Cada tarjeta retrasa su avance según su posición angular al empezar el turno. La demora se limita al tiempo disponible de pausa, para que todas terminen el relevo antes del próximo turno y no haya saltos al cerrar el ciclo. Cero demora sincroniza las tarjetas; cero pausa deja sin demora efectiva, conservando un avance continuo entre turnos. Los controles de relevo y demora solo aparecen al elegir por pasos. El giro propio y el volteo siguen avanzando durante la pausa de la rueda, como en la referencia. `rotations` y `spinRate` conservan vueltas enteras por ciclo; `turns` continúa indicando ciclos de scroll.

Reutiliza la proyección y el rasterizador de las ruedas: caras posteriores reflejadas, desaparición de canto, sombra y esquinas proyectadas, profundidad angular continua y selección que invierte giro y escala. Las copias de cada fuente comparten una textura estable limitada a 2048 píxeles en el lado mayor. Los canvas y la selección se acotan al marco útil. No agrega un motor ni un reloj.

Comparte Loop y scroll con ciclos/inicio/fin/recorrido, contenido, encuadre y orden por fuente, recuperación al cambiar cantidad, carga individual y múltiple, elementos libres, Biblioteca, grupo o escena reeditable, historial y JSON/HTML. Movimiento reducido conserva una rueda visible y estática independientemente del rango y los ciclos del scroll.

Verificaciones: `nagweb-bottom-model-test.mjs` cubre límites, 4–14 fuentes y sus copias, sentidos/1–4 vueltas, movimiento continuo/por pasos, pausas, demora angular y límite de demora, relevos y cierre del ciclo, giro propio, ambos ejes de volteo, caras reflejadas y desaparición de canto, radio de la cúpula, proporciones, escala, desplazamientos, recursos estables/acotados, scroll y fábrica exportada. `nagweb-motion-bottom-smoke.mjs` cubre controles condicionales y demora, recuperación, copias visibles, píxeles/clics de superposición y esquinas, caras invertidas en ambos ejes, encuadre horizontal/vertical, texturas estables, Biblioteca, grupo/escena, guardado, scroll real y exportación, tiempo, historial, móvil y movimiento reducido. La suite `bottom` suma colocación/redimensionado por mouse y carga múltiple. Continúa en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Cover Flow.


## Cover Flow y Cover Flow Vertical: carrusel con perspectiva y paradas

Se incorporan `cover-flow` y `cover-flow-vertical` del HAR de Animos mediante geometría propia. El catálogo pasa de 30 a 32 composiciones. Ambas comienzan con cinco imágenes, admiten 3–12 fuentes y tienen un ciclo de 12 segundos. Comparten tamaño de imagen 30–62% (46% inicial, altura relativa al lado menor del marco), separación 0–16% (4% inicial), inclinación lateral 0–70° (40° inicial), proporción de imagen y lienzo, desplazamientos −50–50%, margen, esquinas 0–12% (3% inicial), sombra y cuatro fondos. El carrusel horizontal admite inclinación del recorrido de 0–90° (0° inicial). Como decisión de presentación de NagWeb, el preset vertical comienza con lienzo 9:16 para mostrar las tarjetas vecinas completas; el horizontal conserva 16:9 y ambas proporciones siguen siendo editables. El vertical mantiene su recorrido de abajo hacia arriba o en sentido inverso; el horizontal admite izquierda y derecha.

La imagen central queda de frente. Las vecinas se inclinan alrededor del eje vertical en Cover Flow y del horizontal en la variante vertical. La perspectiva transforma el plano de cada imagen en 48 tiras, conservando su textura y encuadre completos; inclinación cero usa un plano de una sola tira. El ángulo del recorrido horizontal mueve los centros de las tarjetas, conservando el eje de proyección de cada plano. La focal se ajusta solo cuando una proporción automática muy estrecha y una separación alta harían degenerar el radio, para mantener geometría finita en todo el rango de controles.

El avance continuo recorre todas las fuentes. Con paradas, cada turno avanza durante su primer 55% con interpolación suave y luego mantiene la nueva tarjeta en el centro. Las tarjetas de ambos extremos se desvanecen antes de cambiar de lado, incluyendo las secuencias de tres imágenes. Los planos se ordenan por distancia al centro y se descartan cuando quedan de canto o se invierten. Las esquinas y sombras siguen el plano proyectado; la selección aplica la transformación inversa para ignorar las esquinas transparentes y resolver la tarjeta visible en superposiciones.

Reutilizan el Director, reloj y canvas compartido existentes. Las texturas mantienen dimensiones sin proyectar y un límite de 2048 píxeles por lado. Admiten reemplazo/carga múltiple, encuadre y orden, recuperación de fuentes al cambiar la cantidad, imágenes/textos libres, Biblioteca, inserción como grupo o escena, guardado y reapertura, historial, JSON/HTML, tiempo o scroll, móvil y movimiento reducido. No se añade otro reloj ni dependencia.

Verificaciones: `nagweb-cover-model-test.mjs` cubre límites, proporciones automáticas extremas, perspectiva y plano, turnos en ambos sentidos, ángulo del recorrido, inversa de esquinas, desvanecimiento/cierre, texturas estables, escala, desplazamientos, scroll y fábrica exportada. `nagweb-motion-cover-smoke.mjs` cubre controles, recuperación, píxeles de encuadre en tarjetas frontales y en perspectiva, esquinas/clics reales y superposiciones, reutilización de texturas, Biblioteca, grupo/escena, scroll real tras guardar/exportar, tiempo, historial, móvil y movimiento reducido. Las suites `cover` y `cover-vertical` agregan colocación/redimensionado por mouse y carga múltiple. Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Cover Ring.


## Cover Ring: anillo de planos completos con perspectiva

Se incorpora `cover-ring` del HAR de Animos mediante geometría propia. El catálogo pasa de 32 a 33 composiciones. Ocho imágenes iniciales, 4–16 fuentes y ciclo de 14 segundos. Controles de referencia: tamaño de imagen 16–100% (37% inicial, altura relativa al lado menor del marco), tamaño del anillo 50–400% (131% inicial), inclinación −60–60° (0° inicial), perspectiva 0–100% (55% inicial), desvanecimiento del fondo 0–90% (55% inicial), sentido horario/antihorario y movimiento continuo o con paradas por tarjeta. Conserva proporciones de imagen/lienzo, desplazamientos −50–50%, margen, esquinas 0–12% (3% inicial, radio visual multiplicado por 1,2 como en la referencia), sombra y cuatro fondos.

Cada fuente ocupa un plano tangente al anillo y recorre los 360°. La inclinación afecta el conjunto, incluyendo posición, orientación y profundidad de sus planos. La focal controla el acercamiento de las tarjetas frontales; las posteriores muestran la misma imagen reflejada. El desvanecimiento se calcula por profundidad angular y se aplica una sola vez por plano. Con paradas, cada turno avanza durante el primer 55% con interpolación suave; luego mantiene la siguiente tarjeta delante. Se conserva un desplazamiento angular inicial de una décima de posición, para evitar alinear las tarjetas laterales exactamente de canto.

Se añade al modelo una proyección homogénea de plano y su inversa. La perspectiva actúa sobre ambos ejes de la textura. El rasterizador existente divide el plano en una malla adaptativa de hasta 32 × 32 celdas, pinta en el canvas ya existente de cada tarjeta y compone los planos por profundidad sobre el canvas compartido. Aplicar la transparencia al plano completo evita acumular alfa en las uniones de la malla. Las celdas reemplazan sus píxeles bajo recorte, para conservar también la transparencia propia de una imagen en esas uniones. Las esquinas, sombra y selección usan la misma proyección; la inversa resuelve el contenido editable incluso en caras reflejadas. Las texturas y los canvas de plano tienen un máximo de 2048 píxeles por lado. Las proporciones extremas con anillos pequeños ajustan la focal únicamente cuando un plano podría atravesar la cámara, manteniendo denominadores positivos y geometría acotada.

Reutiliza el Director y su reloj único. Incluye carga múltiple, encuadre, orden, recuperación de fuentes al cambiar la cantidad, texto/imágenes libres, Biblioteca, grupo o escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll, móvil y movimiento reducido. No incorpora dependencias ni otro motor de progreso.

Verificaciones: `nagweb-ring-model-test.mjs` cubre límites, todos los turnos y sentidos, proyección analítica, inclinación, perspectiva, caras posteriores/reflejos, desvanecimiento, proyección/inversa, proporciones extremas y focal segura, malla/geometría acotadas, texturas estables, cierre/escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-ring-smoke.mjs` cubre controles, 4–16 fuentes y recuperación, composición de alfa por plano, píxeles/clics de superposición y esquinas, encuadre horizontal/vertical en frente y detrás, reflejo posterior, reutilización y límites de canvas, Biblioteca, grupo/escena, guardado/exportación y scroll real, tiempo/historial/JSON/HTML, móvil y movimiento reducido. La suite `ring` agrega colocación y redimensionado por mouse y carga múltiple. Se mantiene en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Cover Ring Vertical.


## Cover Ring Vertical: anillo vertical con orientación y giro del lienzo

Se incorpora `cover-ring-vertical` del HAR de Animos mediante geometría propia. El catálogo pasa de 33 a 34 composiciones. Ocho imágenes iniciales, 4–16 fuentes y ciclo de 14 segundos. Conserva tamaño de imagen 16–100% (37% inicial, altura relativa al lado menor del marco), tamaño del anillo 50–400% (131% inicial), perspectiva 0–100% (55% inicial), desvanecimiento del fondo 0–90% (55% inicial), proporciones de imagen/lienzo, desplazamientos −50–50%, margen, esquinas 0–12% (3% inicial, radio visual ×1,2), sombra y cuatro fondos. Como decisión de presentación de NagWeb, el preset comienza con lienzo 9:16 para mostrar el anillo completo; la proporción sigue siendo editable y el modelo común mantiene su valor inicial 16:9. El sentido es hacia arriba o abajo; el movimiento puede ser continuo o con paradas por tarjeta, durante el primer 55% de cada turno.

Rotación 3D −60–60° (0° inicial) orienta el anillo vertical alrededor de su eje vertical antes de la proyección. Inclinación −60–60° (0° inicial) gira el conjunto ya proyectado alrededor de su centro en el lienzo. Ambos controles son independientes: la inclinación conserva profundidad y desvanecimiento. Los desplazamientos siguen los ejes de la pantalla, incluso con inclinación. La cara posterior refleja verticalmente la misma fuente, con el mismo encuadre; no añade una copia editable. Se conserva el pequeño desfase angular inicial y la focal segura de Cover Ring para proporciones extremas.

Reutiliza la proyección homogénea, su inversa y el rasterizador de planos de Cover Ring: malla adaptativa acotada, texturas estables, transparencia propia de la fuente, desvanecimiento aplicado una vez por plano, composición por profundidad, esquinas/sombras proyectadas y selección de la tarjeta visible. No añade otro motor, reloj ni dependencia. Comparte Loop y scroll, carga múltiple, encuadre, orden, recuperación al cambiar cantidad, elementos libres, Biblioteca, grupo/escena, reapertura, historial, JSON/HTML, móvil y movimiento reducido.

Verificaciones: `nagweb-ring-vertical-model-test.mjs` cubre límites, ambos sentidos/paradas, orientación y giro independientes, proyección analítica, inversión homogénea, reflejo vertical posterior, desvanecimiento, proporciones extremas, focal segura, malla/geometría acotadas, texturas estables, cierre/escala/desplazamientos, scroll y fábrica exportada. La suite `ring-vertical` reutiliza `nagweb-motion-ring-smoke.mjs` con controles y píxeles específicos del eje vertical; incluye esquinas/clics reales y superposiciones, transparencia de fuente, encuadre en ambas caras, Biblioteca, grupo/escena, scroll real y exportación, tiempo/historial/JSON/HTML, móvil/movimiento reducido, colocación/redimensionado por mouse y carga múltiple. Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con las ramas paralelas. Próximo candidato del HAR: Image Trail.


## Image Trail: estelas opuestas con fuentes repetidas editables

Se incorpora `image-trail` del HAR de Animos con geometría propia. El catálogo pasa de 34 a 35 composiciones. Doce imágenes iniciales, 4–20 fuentes y ciclo de 10 segundos. Controles de referencia: tamaño de imagen 10–32% (19% inicial, ancho relativo al lado menor del marco), longitud de estela 8–24 tarjetas (18 iniciales), escala al aparecer y salir 0–80% (50% inicial), proporción de imagen y esquinas 0–12% (0% inicial). Conserva lienzo editable, desplazamientos −50–50%, margen, sombra y cuatro fondos.

Dos secuencias separadas medio ciclo colocan tarjetas por turnos sobre arcos opuestos. La trayectoria de NagWeb es una curva cúbica propia; el extremo izquierdo deja cada fuente visible antes de retirarse. Cada posición nace según su lugar en el arco durante el primer 23,6% del ciclo. La entrada dura un 8% del ciclo y crece desde la escala elegida hasta el tamaño completo. La salida comienza entre 29% y 50% según la posición, dura un 5% y reduce la tarjeta a la escala elegida antes de retirarla. Cero escala produce una entrada y salida desde cero; escala alta hace el cambio más breve visualmente. Las tarjetas permanecen derechas; la estela se forma por apariciones, sin deformar la imagen.

La longitud se interpreta como mínimo de posiciones por arco. Si hay más fuentes que posiciones entre ambos arcos, se reserva al menos la mitad de la cantidad de fuentes por arco. Así 20 fuentes con longitud 8 usan 10 posiciones por arco y todas las imágenes aparecen durante el ciclo. Las copias repiten las fuentes en su orden actual y comparten contenido, encuadre y textura. La tarjeta más nueva queda delante; dibujo, esquinas y selección usan los mismos datos por instancia, incluso cuando una fuente tiene varias copias simultáneas. La textura conserva dimensiones sin escalar y un máximo de 2048 píxeles por lado. No se crean canvas durante el avance del ciclo.

Reutiliza el canvas compartido, el Director y su reloj único. La vista previa nueva y la reapertura comienzan al 25%, para mostrar la estela armada; la animación sigue conservando el inicio real del ciclo. Movimiento reducido muestra ese mismo estado estático, independientemente del rango y las vueltas de scroll. Incluye carga múltiple, recuperación al cambiar cantidad, reemplazo, encuadre, orden, imágenes/textos libres, Biblioteca, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil.

Verificaciones: `nagweb-trail-model-test.mjs` cubre límites, 4–20 fuentes, ambos arcos, entrada/permanencia/salida, cero escala, cobertura de fuentes con longitud mínima y tamaños extremos, copias, prioridad por edad, esquinas escaladas, proporciones/geometría acotada, texturas estables, cierre/escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-trail-smoke.mjs` cubre controles, cantidad/recuperación, cobertura de 20 fuentes con estela mínima, píxeles y clics reales en superposiciones/esquinas, encuadre de todas las copias en ambas estelas, transparencia propia de fuente, reutilización de texturas, Biblioteca, grupo/escena, guardado/exportación y scroll real, tiempo/historial/JSON/HTML, móvil y movimiento reducido. La suite `trail` añade colocación/redimensionado por mouse y carga múltiple. Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con las ramas paralelas. Próximo candidato del HAR: Position Dance.


## Position Dance: seis imágenes en tres poses con pausa y escala

Se incorpora `position-dance` del HAR de Animos con geometría y coreografía propias. El catálogo pasa de 35 a 36 composiciones. Seis imágenes fijas y ciclo de cuatro segundos. Controles de referencia: tamaño de imagen 16–42% (28% inicial, ancho relativo al lado menor del marco), separación −20–20% (0% inicial), proporción de imagen y esquinas 0–12% (4% inicial). Conserva lienzo editable, desplazamientos −50–50%, margen, sombra y cuatro fondos.

Cada imagen intercambia tres posiciones y escalas durante el ciclo. Las tres etapas duran lo mismo: una pausa ocupa el primer 30% de cada etapa y una transición suave ocupa el 70% restante. El último cambio vuelve a la primera pose sin salto. Las tarjetas se mantienen derechas; las últimas fuentes pintan delante y la selección respeta ese orden y las esquinas transparentes. Separación modifica las dimensiones alrededor de los centros originales, conservando las posiciones y el radio de las esquinas hasta el límite geométrico. El tamaño relativo de cada pose sigue la escala de su imagen.

La cantidad fija aparece como información de la coreografía. Las seis fuentes pueden reemplazarse, cargarse por lote, encuadrarse y ordenarse; duplicar o eliminar una fuente queda desactivado. Los elementos libres siguen admitiendo las operaciones habituales. Cada fuente reutiliza una textura de tamaño constante durante la animación, limitada a 2048 píxeles por lado. La composición utiliza el canvas compartido, el Director y su reloj existentes; no añade motor ni dependencias. Movimiento reducido conserva una pose representativa estática, independientemente del rango y los ciclos de scroll.

Incluye Biblioteca con identificadores nuevos, grupo o escena reeditable, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil. `nagweb-dance-model-test.mjs` verifica límites, seis fuentes fijas, tres poses, pausas y transición, cierre, separación y radio independientes, orden, proporciones extremas, geometría acotada, texturas estables, escala y desplazamientos, scroll y fábrica exportada. `nagweb-motion-dance-smoke.mjs` verifica controles, cantidad fija, selección y píxeles de superposiciones/esquinas, encuadre a través de las tres poses, transparencia de fuente, reutilización de texturas, Biblioteca, grupo/escena, scroll real y exportación, tiempo, historial/JSON/HTML y móvil/movimiento reducido. La suite `dance` suma colocación/redimensionado por mouse y carga múltiple.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Cascade Deck.


## Cascade Deck: pila diagonal con intercambio de ejes y regreso al centro

Se incorpora `cascade-deck` del HAR de Animos con geometría propia. El catálogo pasa de 36 a 37 composiciones. Ocho imágenes iniciales, 3–12 fuentes y ciclo de ocho segundos. Controles de referencia: tamaño 45–100% (80% inicial), superposición 40–85% (70% inicial), movimiento escalonado o simultáneo y proporción de imagen. Conserva lienzo editable, desplazamientos −50–50%, margen, esquinas 0–12% (3% inicial), sombra y cuatro fondos.

La secuencia abre la pila durante el primer 15% del ciclo. Entre 22% y 40% intercambia las posiciones verticales; entre 47% y 65% intercambia las horizontales en orden inverso. Entre 74% y el final vuelve a apilar las imágenes en el centro. Las pausas intermedias conservan cada diagonal completa. Las imágenes permanecen derechas: el cambio de diagonal desplaza sus centros y conserva el encuadre, tamaño y orientación de cada tarjeta. El ciclo cierra sin salto. La primera fuente queda delante durante todo el movimiento; dibujo y selección respetan el mismo orden y las esquinas transparentes.

Con movimiento escalonado, la duración de cada transición y la demora se adaptan al número de imágenes, con media transición de superposición entre relevos. Todas terminan dentro de la etapa correspondiente. Con movimiento simultáneo avanzan juntas. El tamaño indica la fracción del lado útil ocupada por el conjunto desplegado; superposición determina los pasos entre centros y el tamaño de las tarjetas. La proporción de imagen se ajusta dentro de su cuadrado base, sin extender la geometría por proporciones automáticas extremas.

Reutiliza el canvas compartido, el Director y su reloj único. Cada fuente mantiene una textura estable durante el ciclo, limitada a 2048 píxeles por lado. Incluye cantidad y recuperación de fuentes, duplicar/eliminar dentro de límites, reemplazo y carga múltiple, encuadre y orden, elementos libres, Biblioteca con identificadores nuevos, grupo/escena, reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido muestra una pose estática independiente del rango y los ciclos de scroll.

`nagweb-cascade-deck-model-test.mjs` verifica límites, 3–12 fuentes, apertura, intercambios de ejes, orden inverso horizontal, cierre y pausas, ambos movimientos, tamaños/superposición/proporciones, prioridad de la primera fuente, geometría acotada, texturas estables, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-cascade-deck-smoke.mjs` verifica controles y recuperación, selección/píxeles en superposiciones y esquinas, encuadre por las diagonales, transparencia de fuente, reutilización, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo, historial/JSON/HTML y móvil/movimiento reducido. La suite `deck` suma colocación/redimensionado por mouse y carga múltiple.

La prueba de composición general espera ahora una muestra coherente del reloj, el frame renderizado y el progreso de reproducción después del reinicio. Antes podía aprobar su espera con el 25% anterior y leer la imagen antigua junto al primer avance desde cero; la comprobación conserva la relación entre progreso y posición sin depender del orden de los mensajes y los frames.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato del HAR: Orbit Showcase.


## Orbit Showcase: órbita de imágenes derechas con escala y desvanecimiento por profundidad

Se incorpora `orbit-showcase` del HAR de Animos con geometría propia. El catálogo pasa de 37 a 38 composiciones. Doce imágenes iniciales, 4–16 fuentes y ciclo de doce segundos. Controles de referencia: sentido horario/antihorario, ritmo constante o rápido–lento–rápido, variación de ritmo 10–90% (60% inicial), ancho de órbita 30–90% (64% inicial), profundidad de órbita 8–60% (26% inicial), inclinación −45–45° (0° inicial), dispersión 0–100% (100% inicial), tamaño de imagen 12–34% (22% inicial, ancho relativo al lado menor del marco), perspectiva 0–100% (55% inicial) y desvanecer detrás 0–90% (45% inicial). Conserva proporciones de imagen/lienzo, desplazamientos −50–50%, margen, esquinas 0–12% (3% inicial), sombra y cuatro fondos.

Las imágenes permanecen derechas mientras sus centros recorren una elipse inclinable. Su profundidad angular determina el tamaño, la opacidad y el orden de composición. Perspectiva cero conserva un tamaño uniforme; al aumentar la perspectiva, las imágenes crecen delante y se achican detrás. El radio horizontal también cambia suavemente según la profundidad. Desvanecer detrás es independiente del tamaño: cero conserva la opacidad de todas las fuentes. La inclinación gira los centros de la órbita sin inclinar las tarjetas ni cambiar su profundidad, escala u opacidad. Los desplazamientos actúan sobre los ejes del lienzo.

Dispersión reduce los radios de la órbita sin reducir las imágenes. Cero reúne todos los centros; la imagen frontal visible cambia durante el ciclo, conservando el orden por profundidad en dibujo y selección. Las coincidencias de profundidad mantienen un orden determinista por fuente. El ritmo variable acelera al empezar y terminar el ciclo y frena en la mitad, sin invertir el movimiento. Ambos sentidos y ritmos cierran el ciclo sin salto; todas las fuentes pasan por el frente.

Reutiliza el canvas compartido, el Director y su reloj único. Cada fuente conserva una textura de tamaño estable durante el avance, limitada a 2048 píxeles por lado; las esquinas y el encuadre se escalan con la tarjeta. La opacidad se aplica una vez por fuente y conserva la transparencia propia de la imagen. Incluye cantidad/recuperación, duplicar y eliminar dentro de límites, reemplazo y carga múltiple, encuadre y orden, elementos libres, Biblioteca con identificadores nuevos, grupo/escena, reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido conserva una órbita estática visible independientemente del rango y los ciclos de scroll.

`nagweb-showcase-orbit-model-test.mjs` verifica límites, 4–16 fuentes, ambos sentidos y ritmos, paso de cada fuente por el frente, escala y desvanecimiento, inclinación/dispersión independientes, cero perspectiva y cero dispersión, prioridad frontal, proporciones extremas, geometría acotada, texturas estables, cierre/escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-showcase-orbit-smoke.mjs` verifica controles y recuperación, selección/píxeles por profundidad y esquinas, cambio de la fuente frontal con dispersión cero, encuadre delante/laterales/detrás, transparencia de fuente multiplicada por desvanecimiento, reutilización, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo, historial/JSON/HTML y móvil/movimiento reducido. La suite `showcase` suma colocación/redimensionado por mouse y carga múltiple.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Split Reveal.


## Split Reveal: dos ventanas fijas con entradas opuestas y cuatro imágenes

Se incorpora `split-reveal` del HAR de Animos con geometría propia. El catálogo pasa de 38 a 39 composiciones. Cuatro fuentes fijas, agrupadas en dos pares, y ciclo de ocho segundos. Controles de referencia: división 30–70% (50% inicial) y separación 0–8% (2% inicial, pasos de 0,5%). Conserva proporción de lienzo, desplazamientos −50–50%, margen, esquinas 0–12%, sombra y cuatro fondos. La proporción de cada imagen corresponde a su ventana; el encuadre conserva la imagen original sin deformarla.

Los paneles quedan lado a lado en lienzos horizontales o cuadrados y uno sobre otro cuando el alto del marco supera su ancho por más del 5%. En cada mitad del ciclo, el primer panel recibe una imagen desde la izquierda o arriba y el segundo desde la derecha o abajo. La segunda entrada empieza un 8% de la etapa después de la primera. Cada transición ocupa la mitad de la etapa, con aceleración y frenado suaves; después las imágenes permanecen quietas hasta el relevo. Los dos pares alternan sin cortes en la mitad ni al cerrar el ciclo.

Cada ventana conserva su tamaño y sus esquinas durante la entrada. La imagen se desplaza completa detrás de esa máscara: su recorte no se estira para llenar la porción visible. División regula el primer panel y el segundo recibe el espacio restante; separación deja una franja transparente. El render y la selección respetan la intersección de imagen, ventana redondeada y lienzo. Las imágenes no invaden el otro panel ni se pueden seleccionar por partes ocultas. Las fuentes conservan su transparencia y sus encuadres al cambiar de turno o panel.

Reutiliza el canvas compartido, el Director y su reloj único. Las texturas permanecen estables a lo largo del ciclo y se limitan a 2048 píxeles por lado. Las cuatro fuentes pueden reemplazarse, encuadrarse, ordenarse y cargarse por lote; duplicar/eliminar una fuente queda bloqueado. Los elementos libres mantienen las operaciones habituales. Incluye Biblioteca con identificadores nuevos, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido muestra los dos paneles completos, independientemente del rango y las vueltas de scroll.

`nagweb-split-model-test.mjs` verifica límites, cuatro fuentes fijas, división horizontal/vertical y umbral de orientación, entradas opuestas y demora, alternancia/pausas/continuidad, ventanas y esquinas estáticas, dimensiones y texturas estables, geometría recortada y valores extremos, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-split-smoke.mjs` verifica controles, cantidad fija, píxeles y clics reales en las partes entrantes y de fondo de ambos paneles, esquinas/franja transparentes, encuadre durante la entrada y permanencia en ambas orientaciones, transparencia de fuente, reutilización de texturas, orden/encuadre, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo/historial/JSON/HTML y móvil/movimiento reducido. La suite `split` suma colocación/redimensionado por mouse y carga múltiple.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Diagonal Wipe.


## Diagonal Wipe: secuencia con máscara diagonal y borde luminoso

Se incorpora `diagonal-wipe` del HAR de Animos con geometría propia. El catálogo pasa de 39 a 40 composiciones. Tres fuentes iniciales, 2–8 imágenes y ciclo de ocho segundos. Controles de referencia: ángulo del borde −45–45° (−20° inicial, pasos de 5°) y brillo del borde 0–100% (60% inicial, pasos de 5%). Conserva proporción de lienzo, desplazamientos −50–50%, margen, esquinas 0–12%, sombra y cuatro fondos. La proporción de imagen corresponde al marco; su encuadre se conserva al cambiar la máscara.

Cada fuente permanece durante el primer 65% de su etapa y el último 35% revela la siguiente desde la derecha, con aceleración y frenado suaves. El ángulo inclina el borde, sin rotar ni desplazar las imágenes. La última fuente revela la primera y el ciclo cierra sin salto. Se normalizan los límites de etapa próximos a un entero para evitar que el redondeo numérico conserve el relevo anterior al ubicar el progreso exactamente sobre una fuente.

Las texturas representan la imagen completa, con dimensiones constantes. La región entrante se calcula por intersección de un semiplano diagonal con el marco y el lienzo; mantiene las esquinas redondeadas del marco. El render y la selección siguen esa misma región visible. El barrido conserva la transparencia de la fuente entrante: sus píxeles reemplazan a los salientes dentro de la máscara, incluso cuando son transparentes, para evitar restos de la imagen anterior y cambios de opacidad en el relevo. La sombra del marco queda fuera de la ventana redondeada, para conservar esa transparencia también al pasar de imagen entrante a imagen completa. El borde luminoso se dibuja después de la imagen y sólo dentro de su franja; su intensidad crece hacia la mitad del barrido y se desvanece en los extremos. Brillo cero elimina esa franja sin alterar la geometría ni la selección.

Reutiliza el canvas compartido, el Director y su reloj único. Las texturas permanecen estables durante el ciclo, limitadas a 2048 píxeles por lado. Incluye cantidad/recuperación, duplicar y eliminar dentro de límites, reemplazo y carga múltiple, encuadre y orden, elementos libres, Biblioteca con identificadores nuevos, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido muestra una imagen completa, independientemente del rango y las vueltas de scroll.

`nagweb-wipe-model-test.mjs` verifica límites, 2–8 fuentes, permanencia y barrido, máscara angular independiente, orden/relevo/cierre, marco redondeado estático, brillo independiente de la geometría, texturas estables, geometría recortada y extremos, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-wipe-smoke.mjs` verifica controles y recuperación, píxeles/clics reales a ambos lados del borde con ángulos opuestos en ambos formatos, esquinas/margen transparentes, reemplazo semitransparente y totalmente transparente sobre una imagen opaca, brillo real acotado al borde, encuadre durante permanencia/barrido/relevo, reutilización de texturas, orden/encuadre, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo/historial/JSON/HTML y móvil/movimiento reducido. La suite `wipe` suma colocación/redimensionado por mouse y carga múltiple.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Stripe Reveal.


## Stripe Reveal: imágenes reconstruidas con franjas deslizantes

Se incorpora `stripe-reveal` del HAR de Animos con geometría propia. El catálogo pasa de 40 a 41 composiciones. Tres imágenes iniciales, 2–8 fuentes y ciclo de ocho segundos. Cantidad de franjas 3–14 (7 iniciales, pasos de una). Conserva proporción de lienzo, desplazamientos −50–50%, margen, esquinas 0–12%, sombra y cuatro fondos. La proporción de imagen corresponde al marco y cada fuente conserva su encuadre.

Durante la primera mitad de cada etapa, la nueva imagen se reconstruye con franjas que entran alternadamente desde lados opuestos y con una demora progresiva. La segunda mitad mantiene la imagen completa. En lienzos horizontales o cuadrados, las franjas verticales suben y bajan; cuando el alto supera el ancho en un 5%, las franjas horizontales entran desde izquierda y derecha. La última etapa vuelve a la primera fuente sin salto. Los límites de etapa se normalizan cerca de los enteros.

Cada franja recorta una copia desplazada de la textura completa de su fuente: no estira la imagen para llenar una franja. Las máscaras se intersectan con el marco, el lienzo y la imagen desplazada. El marco redondeado permanece fijo y dibujo y selección respetan las mismas regiones visibles. Los límites internos de las franjas se alinean con los píxeles del canvas al pintar; las texturas y su encuadre no se modifican. La transparencia entrante reemplaza a la fuente anterior dentro de cada franja. La sombra se dibuja una vez fuera de la ventana redondeada y la imagen completa utiliza una sola superficie durante la pausa, para evitar costuras o cambios de opacidad al terminar la entrada.

Reutiliza el canvas compartido, el Director y su reloj único. Cada fuente mantiene una textura estable, limitada a 2048 píxeles por lado. Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo y carga múltiple, encuadre/orden, elementos libres, Biblioteca con identificadores nuevos, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido muestra una imagen completa independiente del rango y los ciclos de scroll.

`nagweb-stripe-model-test.mjs` cubre límites, división 3–14, alternancia/demora, traslaciones de la imagen completa, orientación automática, 2–8 fuentes, permanencia/cierre, máscaras redondeadas, texturas constantes, geometría acotada, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-stripe-smoke.mjs` cubre controles/recuperación, píxeles y clics por franja en ambos formatos, transparencia sobre fuente opaca, uniones entre franjas, encuadre/alpha/sombra durante entrada y pausa, reutilización de texturas, orden, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo/historial/JSON/HTML y móvil/movimiento reducido. La suite `stripe` agrega colocación/redimensionado por mouse y carga múltiple. La matriz suma 27 suites de navegador y el conjunto de modelos suma 36.

Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Mosaic Wipe.


## Mosaic Wipe: revelado por mosaico o persianas con aperturas configurables

Se incorpora `mosaic-wipe` del HAR de Animos con geometría propia. El catálogo pasa de 41 a 42 composiciones. Cuatro fuentes iniciales, 2–8 imágenes y ciclo de ocho segundos. Incluye mosaico y persianas: mosaico con 1–8 filas/columnas (4×4 inicial), patrones normal, diagonal, radial, espiral o aleatorio; persianas con 2–20 divisiones (8 iniciales), orientación horizontal/vertical y apertura desde inicio, final, centro o lados alternados. Demora entre aperturas 0–100% (60% inicial) y variación de velocidad 0–100% (0% inicial), en pasos de 5%. El panel muestra sólo los controles correspondientes a cada variante y conserva sus valores al alternarlas.

Cada etapa reconstruye la siguiente imagen durante el primer 60% y la mantiene completa durante el 40% restante. Las celdas del mosaico crecen desde su centro; las persianas amplían su ventana desde el lado elegido. Las aperturas muestran regiones de la misma imagen completa y fija, conservando su encuadre y proporción. El orden radial comienza en el centro; la espiral recorre el borde exterior hacia adentro; normal avanza por filas y diagonal agrupa diagonales. Aleatorio y variación de velocidad utilizan semillas estables, de modo que avanzar y retroceder por scroll genera las mismas regiones.

La demora y duración de cada ventana quedan dentro de la etapa de entrada. El extremo 100% conserva una breve apertura final y la variación de velocidad se acota al tiempo disponible de cada pieza: todas completan su recorrido antes de la pausa. Esto evita celdas sin abrir o saltos al cambiar de fuente con los valores extremos de la referencia. Los límites del 60% y las etapas se normalizan frente al redondeo numérico. La última imagen vuelve a la primera sin salto.

La selección respeta las aperturas, el marco redondeado y las imágenes visibles detrás. Los píxeles entrantes reemplazan a los salientes dentro de sus ventanas, conservando transparencia parcial o completa; los límites de las máscaras se alinean con los píxeles del canvas para evitar costuras entre divisiones. El redondeo normaliza las diferencias numéricas próximas a medio píxel para que dos celdas vecinas compartan el mismo borde al terminar su apertura. La sombra se dibuja una vez fuera del marco y la pausa utiliza una sola superficie completa. Cada fuente reutiliza una textura estable, limitada a 2048 píxeles por lado. Se mantiene el canvas compartido, el Director y su reloj único.

Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo y carga múltiple, encuadre/orden, elementos libres, Biblioteca con identificadores nuevos, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo o scroll y móvil. Movimiento reducido muestra una imagen completa independiente del rango y las vueltas de scroll.

`nagweb-mosaic-model-test.mjs` cubre límites/enumeraciones, 2–8 fuentes, cinco patrones estables y grillas extremas, ambas orientaciones de persianas y sus cuatro aperturas, demora/velocidad, finalización con valores extremos, geometría de máscaras sobre imagen fija, permanencia/cierre, texturas estables, geometría acotada, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-mosaic-smoke.mjs` cubre controles contextuales, píxeles/clics reales en mosaicos y persianas, todos los patrones, transparencia parcial/completa, uniones, demora/velocidad y finalización, encuadre/alpha/sombra, reutilización, cantidad/recuperación, orden, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo/historial/JSON/HTML y móvil/movimiento reducido. La suite `mosaic` agrega colocación/redimensionado por mouse y carga múltiple. La matriz suma 28 suites de navegador y el conjunto de modelos suma 37.

La verificación final de Stripe Reveal completó las 27 suites de navegador correctamente (`142c637809973946f12a250bdd9b8cf59b08c8c1`). Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Hero Reel.


## Hero Reel: miniaturas activas y fondo con revelado por patrones

Se incorpora `hero-reel` del HAR de Animos. El catálogo pasa de 42 a 43 composiciones. Siete fuentes iniciales, 3–10 imágenes y ciclo de diez segundos. Controles de referencia: elevación 0–4% (1,8 inicial), escala activa 100–120% (108 inicial), separación 0–6% (2 inicial), opacidad del fondo 0–100% (55 inicial), movimiento del fondo 0–100% (60 inicial) y pausa 20–80% (55 inicial). Conserva proporción del lienzo, desplazamientos, margen, esquinas, sombra y cuatro fondos.

Cada imagen aparece como miniatura cuadrada en una fila y como fondo que cubre el lienzo. Ambos encuadres usan la misma fuente y su foco personalizado, ajustados por separado sin deformar la imagen. La miniatura activa se eleva y aumenta de tamaño; el relevo mueve suavemente esa elevación a la siguiente fuente. La pausa mantiene las miniaturas quietas antes del relevo. La última imagen vuelve a la primera y el ciclo cierra sin salto. El fondo incorpora zoom y desplazamiento suaves, con intensidad configurable; intensidad cero conserva el zoom base fijo de la referencia. Desplazamientos y margen afectan a las miniaturas; el fondo cubre el marco completo.

El relevo del fondo reutiliza los patrones de Mosaic Wipe: mosaico con 1–8 filas/columnas y orden normal, diagonal, radial, espiral o aleatorio; persianas con 2–20 divisiones, orientación horizontal/vertical y apertura desde inicio, final, centro o lados alternados. Demora y variación de velocidad son independientes. Las semillas estables permiten volver al mismo punto por scroll. Los extremos completan todas las aperturas dentro de la etapa. Opacidad se aplica una sola vez; la imagen entrante reemplaza los píxeles salientes dentro de su máscara, incluida la transparencia.

Las miniaturas se dibujan después del fondo, con prioridad de la activa en los solapamientos. Sus esquinas y sombras respetan la transparencia de la fuente. El render y los clics utilizan las mismas regiones visibles: seleccionar una miniatura o su fondo permite editar la misma fuente. Fondo con opacidad cero no recibe clics. Se reutilizan texturas completas estables, limitadas a 2048 píxeles, con el canvas compartido, el Director y su reloj único.

Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo/carga múltiple, encuadre/orden, Biblioteca con identificadores nuevos, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo/scroll y móvil. Movimiento reducido conserva una pose completa independiente del rango y las vueltas de scroll.

`nagweb-hero-model-test.mjs` cubre controles/límites, 3–10 fuentes, miniaturas cuadradas, elevación/escala/pausa/relevo/cierre, opacidad independiente, movimiento del fondo, patrones deterministas y extremos, profundidad/sombra, texturas estables, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-hero-smoke.mjs` verifica controles contextuales, píxeles/clics del fondo y miniaturas, transparencia/opacidad, solapamientos/esquinas/sombras, movimiento real del fondo, encuadres independientes, reutilización, Biblioteca, grupo/escena, scroll real, guardado/exportación, tiempo/historial/JSON/HTML y móvil/movimiento reducido. La suite `hero` agrega colocación/redimensionado por mouse y carga múltiple. La matriz suma 29 suites de navegador y el conjunto de modelos suma 38.

La verificación final de Mosaic Wipe completó las 28 suites de navegador correctamente (`03d978d6423e9e33f7a01cc4ebf9c1e0d9a310fe`). Continúa exclusivamente en `internal-motion-lab`, sin despliegue Vercel ni integración con ramas paralelas. Próximo candidato pendiente del HAR: Flip Grid.


## Flip Grid: grilla de pares con giros escalonados

Se incorpora `flip-grid` del HAR de Animos. El catálogo pasa de 43 a 44 composiciones. Ocho fuentes iniciales y 6–12 imágenes en pasos de dos: cada casilla tiene frente y dorso. Ciclo de ocho segundos; separación 0–10% (3% inicial, paso de 0,5%) y eje horizontal/vertical. Conserva proporción de lienzo, desplazamientos, margen, esquinas, sombra y cuatro fondos.

La primera mitad de las imágenes contiene los frentes y la segunda los dorsos. Tres pares forman una fila de tres casillas; cuatro pares forman 2×2; cinco o seis pares utilizan tres columnas y dos filas. Cada casilla demora el giro un 13% del ciclo respecto de la anterior. Los giros ocupan el primer 12% de cada mitad del ciclo, con aceleración y frenado cúbicos y compresión por coseno. La cara cambia a mitad del giro, cuando el plano está de canto. Se normalizan los límites numéricos del cambio de cara y del ciclo. Después de cada giro, la cara permanece completa hasta el siguiente relevo.

El encuadre se ajusta a la casilla completa y conserva sus dimensiones de textura durante la compresión: girar no cambia el recorte. Las esquinas se comprimen junto con la imagen; los clics respetan la cara visible, la forma redondeada y el lienzo. La sombra crece durante el giro y se recorta fuera de la forma comprimida para conservar la transparencia de la fuente. El renderer comparte canvas, Director y reloj existentes; las texturas se reutilizan y se acotan a 2048 píxeles por lado.

La cantidad conserva el emparejamiento al reducir/ampliar y recupera las fuentes y sus identificadores dentro del borrador. Duplicar o quitar una fuente actúa sobre su par completo, con identificadores nuevos para las copias; los elementos libres mantienen sus operaciones habituales. Incluye reemplazo/carga múltiple, encuadre/orden, Biblioteca, grupo/escena, guardado/reapertura, historial, JSON/HTML, tiempo/scroll y móvil. Movimiento reducido conserva una pose completa, independiente del rango y vueltas de scroll.

`nagweb-flip-model-test.mjs` cubre límites y cantidad par, emparejamiento, grilla y demora de referencia, ambos ejes, cambio exacto de cara, permanencia/cierre, texturas/encuadre estables, geometría redondeada y acotada, escala/desplazamientos, scroll y fábrica exportada. `nagweb-motion-flip-smoke.mjs` cubre controles, duplicación/eliminación de pares, recuperación, píxeles/clics en ambos ejes y formatos, partes comprimidas ocultas, esquinas/transparencia/sombra, foco personalizado durante el giro, reutilización, Biblioteca, grupo/escena, scroll real, guardado/exportación, historial y móvil/movimiento reducido. La suite `flip` agrega colocación/redimensionado y carga múltiple. La matriz suma 30 suites de navegador y el conjunto de modelos suma 39.

Hero Reel completó su verificación específica de navegador y las otras composiciones completaron 28 de las 29 suites del último commit anterior; la suite general `editor` detectó una espera de preview en su prueba de cancelación, todavía pendiente de estabilizar. Se creó una única vista previa de `2fb7ccf5aa39835309a37421994da8686545d0f6` en Vercel a pedido expreso del usuario. Los avances posteriores continúan con despliegues automáticos deshabilitados en `internal-motion-lab`, sin integrar ramas paralelas. Próximo candidato del HAR: Orbit Carousel.

## Orbit Carousel: carrusel con escala y opacidad por profundidad

Se incorpora `orbit-carousel` del HAR de Animos. El catálogo llega a 45 composiciones. Cuatro imágenes iniciales, rango 3–10 y ciclo de 12 segundos. Amplitud 40–100% (70% inicial, paso 5), profundidad 20–90% (60% inicial, paso 5) y proporción de tarjeta automática, del lienzo o fija. Incluye desplazamientos, margen, esquinas, sombra y fondos.

Las tarjetas se mantienen derechas. Sus centros siguen el seno del ángulo y la profundidad sigue el coseno. El recorrido es horizontal salvo en marcos cuyo alto supera el ancho un 5%, donde se orienta verticalmente. La tarjeta base ocupa el 52% del área interior y ajusta su proporción antes del movimiento. La profundidad reduce la escala hasta `1 - profundidad × 0,55` y la opacidad hasta `1 - profundidad`. La amplitud modifica sólo el recorrido. Las imágenes se pintan del fondo al frente; empates de profundidad priorizan la última fuente, igual que el orden de dibujo de la referencia.

Texturas y encuadre permanecen estables mientras escala la tarjeta. Las esquinas escalan con la imagen y la selección utiliza las mismas formas, profundidad y recorte del marco. Las sombras se pintan junto a cada tarjeta en orden de profundidad y se limitan al exterior de su forma, respetando la transparencia de la fuente. Se comparte canvas, Director y reloj, con texturas acotadas a 2048 píxeles y reutilizadas.

Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo/carga múltiple, foco/orden, Biblioteca, grupo/escena, guardar/reabrir, historial, JSON/HTML y tiempo/scroll. Movimiento reducido conserva una pose completa independiente del rango o vueltas del scroll.

`nagweb-orbit-carousel-model-test.mjs` verifica las fórmulas del HAR, límites, cantidad, recorrido horizontal/vertical, proporciones, geometría/esquinas, texturas estables, cierre, desplazamientos/escala, scroll y fábrica exportada. `nagweb-motion-orbit-carousel-smoke.mjs` verifica controles, píxeles y selección por profundidad, opacidad/transparencia, esquinas/sombras, encuadre a diferentes profundidades, reutilización, Biblioteca, grupo/escena, scroll real, guardar/exportar, tiempo/historial y móvil/movimiento reducido. La suite agrega colocación/redimensionado y carga múltiple. El conjunto suma 40 suites de modelo y la matriz 31 suites de navegador.

Flip Grid completó las 30 suites de navegador correctamente (`493624b2b9a9b72f7e9c52f292ce3b2c3b0f68a7`), incluida la prueba general del editor. Continúa exclusivamente en `internal-motion-lab`, con despliegues Vercel deshabilitados y sin integrar ramas paralelas. Próximo candidato del HAR: Column Drift.

## Column Drift: tres columnas con flujo opuesto y fuentes repetidas

Se incorpora `column-drift` del HAR de Animos. El catálogo llega a 46 composiciones. Doce imágenes iniciales, rango 6–18 en pasos de tres y ciclo de 12 segundos. Separación 1–8% (3% inicial, paso 0,5), proporción de imagen automática o fija, marco, margen, esquinas, sombra y fondos.

La lista se divide en tres columnas de igual cantidad: izquierda, central y derecha. Las laterales bajan y la central sube. El ancho de tarjeta depende del ancho interior menos dos separaciones; su alto deriva de la proporción elegida. Cada columna recorre exactamente la altura de todas sus tarjetas más sus separaciones por ciclo. Las fuentes se repiten tantas veces como haga falta para llenar el marco, también con pocas imágenes y tarjetas horizontales en un lienzo vertical. El ciclo cierra sin salto y scroll puede recorrerlo en ambos sentidos.

El contenido se recorta en un marco redondeado interior. Cada tarjeta usa el 70% del radio de ese marco, como en la referencia. El renderer y la selección respetan tanto las esquinas de cada copia como el marco y sus márgenes. Cambiar la fuente o su encuadre actualiza todas sus copias, sin recalcular texturas durante el movimiento. Las sombras se limitan al exterior de cada tarjeta para respetar su transparencia. Se reutilizan canvas, Director y reloj; texturas limitadas a 2048 píxeles.

Reducir o ampliar la cantidad conserva las fuentes de cada columna, con recuperación por filas dentro del borrador. Duplicar o eliminar una fuente actúa sobre una fila de tres imágenes —una por columna— para mantener la cantidad válida; las copias reciben identificadores nuevos. Los elementos libres conservan sus operaciones individuales. Incluye reemplazo/carga múltiple, foco/orden, Biblioteca, grupo/escena, guardar/reabrir, historial, JSON/HTML y tiempo/scroll. Movimiento reducido conserva una pose estable independiente del rango o vueltas del scroll.

`nagweb-column-drift-model-test.mjs` contrasta las posiciones/cantidades de copias con la ecuación del HAR, ambas direcciones, 6–18 fuentes, proporciones, recortes/esquinas, texturas estables, cierre, escala, scroll y fábrica exportada. `nagweb-motion-column-drift-smoke.mjs` cubre controles, operaciones por fila/recuperación, píxeles/clics en copias repetidas, márgenes/esquinas del marco y tarjetas, transparencia/sombras, recorte personalizado, reutilización, Biblioteca, grupo/escena, scroll real, guardar/exportar, tiempo/historial y móvil/movimiento reducido. La suite agrega colocación/redimensionado y carga múltiple. El conjunto suma 41 suites de modelo y la matriz 32 suites de navegador.

Orbit Carousel completó su prueba específica y 30 de 31 suites de navegador. La prueba general del editor necesitaba incorporar Orbit Carousel a los resultados esperados de la búsqueda «profundidad»; se actualiza ese resultado sin cambiar el buscador. Continúa exclusivamente en `internal-motion-lab`, con despliegues Vercel deshabilitados y sin integrar ramas paralelas. Próximo candidato del HAR: Spotlight Zoom.

## Spotlight Zoom: grilla con foco expandido por turnos

Se incorpora `spotlight-zoom` del HAR de Animos. El catálogo llega a 47 composiciones. Cuatro imágenes iniciales, rango 2–9 y ciclo de 12 segundos. Separación 0–10% (3% inicial, paso 0,5) y oscurecimiento del fondo 0–80% (45% inicial, paso 5). Incluye proporción del lienzo, margen, esquinas, sombra y fondos; cada tarjeta toma la proporción de su casilla o marco según la etapa.

La grilla utiliza dos columnas para dos o cuatro imágenes y tres para las otras cantidades. Cada imagen se amplía desde su casilla hasta el marco interior durante el primer 22% de su turno, permanece ampliada durante el 56% central y vuelve durante el 22% final. El movimiento usa aceleración y frenado cúbicos. La imagen activa se dibuja delante; las otras mantienen sus casillas y reducen su opacidad según el control de fondo y el avance de la ampliación. Al terminar el turno se recupera la grilla y comienza el siguiente; la última vuelve a la primera sin salto.

Se conservan texturas completas de cada fuente, acotadas a 2048 píxeles, y se adapta el recorte de cobertura a la proporción real de cada etapa. El foco personalizado se aplica al recorte dinámico: la foto no se estira ni reutiliza el recorte de la casilla cuando ocupa todo el marco. Las esquinas crecen hasta 1,4 veces su radio original al ampliarse. La selección respeta la forma redondeada y la prioridad de la imagen activa. La sombra crece con la ampliación y se recorta fuera de la tarjeta para conservar la transparencia de la fuente. Se comparte canvas, Director y reloj, sin asignar nuevas texturas durante el movimiento.

Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo/carga múltiple, foco/orden, Biblioteca, grupo/escena, guardar/reabrir, historial, JSON/HTML y tiempo/scroll. Movimiento reducido conserva una pose completa independiente del rango y vueltas del scroll.

`nagweb-spotlight-model-test.mjs` contrasta grilla, tiempos e interpolación con el HAR, 2–9 fuentes, opacidad y prioridad, radios/sombras, textura estable, cierre, escala, scroll y fábrica exportada. `nagweb-motion-spotlight-smoke.mjs` cubre controles, cantidades/edición/recuperación, píxeles/clics durante ampliación/permanencia/regreso, intensidad del fondo/transparencia, esquinas/sombras, recorte personalizado en ambos formatos, reutilización, Biblioteca, grupo/escena, scroll real, guardar/exportar, tiempo/historial y móvil/movimiento reducido. La suite agrega colocación/redimensionado y carga múltiple. El conjunto suma 42 suites de modelo y la matriz 33 suites de navegador.

Column Drift completó las 32 suites de navegador correctamente (`8eb75832b4f8ec0c52b9034e9f1b9df0ba04c332`), incluida la prueba general del editor. Continúa exclusivamente en `internal-motion-lab`, con despliegues Vercel deshabilitados y sin integrar ramas paralelas. La revisión del HAR identifica veinte presets todavía pendientes: Focus Orbit, Focus Slider, Sphere Wall, Sphere Cascade, Totem Wall, Parallax Totem, Vortex Spin, Card Globe, Orbit Globe, Mosaic Marquee, Grid Zoom Strip, Depth Stack Scroll, Spread Rows, Spread Columns, Sweep Ring, Triple Scene, Collage Reel, Feed Scroll, Fan Shuffle y Scatter Dial. Próximo candidato: Focus Orbit.


## Focus Orbit: órbita con acercamiento, paradas y regreso

Se incorpora `focus-orbit` del HAR de Animos. El catálogo llega a 48 composiciones. Veinte imágenes iniciales, rango 8–28 y ciclo de 12 segundos. Sentido izquierdo/derecho, movimiento suave o pulso (10–90%, inicial 60), zoom 1,5–3,5 (inicial 2,4), superposición o foco aislado, 2–20 paradas (inicial 5), tamaño de órbita 40–95% (inicial 72), giro lateral −70–70 grados, aplicación del giro siempre o durante el zoom, perspectiva 0–80% (inicial 55) y tarjetas de frente o acompañando el giro. El ancho de tarjeta ocupa 10–32% de la unidad del marco (inicial 18). Proporción automática o fija, margen, esquinas, sombras y fondos.

El ciclo recorre una vuelta durante el primer 28%, acerca la cámara durante el siguiente 8%, gira otra vuelta con paradas durante el 52% central y vuelve al conjunto durante el 12% final. Las paradas avanzan durante el primer 45% de cada tramo y mantienen la pose durante el resto. Acercamiento, regreso y avance usan interpolación cúbica. El pulso modifica la primera vuelta y enlaza con el frenado final. La cámara se acerca a la tarjeta superior. Foco aislado atenúa las otras fuentes según distancia angular y avance del zoom, y prioriza la tarjeta enfocada.

Las tarjetas de frente mantienen su textura derecha; las que acompañan el conjunto utilizan proyección de perspectiva del plano inclinado. La geometría de pintura, esquinas y selección comparte la misma homografía e inversa. Las texturas fuente se conservan durante el movimiento, con límite de 2048 píxeles y superficies acotadas al marco. Las sombras se pintan junto a cada tarjeta en orden de profundidad y fuera de su forma, preservando transparencia. Se reutilizan canvas, Director y reloj.

Incluye cantidad/recuperación, duplicar/eliminar dentro de límites, reemplazo/carga múltiple, encuadre/orden, Biblioteca, grupo/escena, guardar/reabrir, historial, JSON/HTML y tiempo/scroll. Movimiento reducido mantiene una pose estable independiente del rango y vueltas de scroll.

`nagweb-focus-orbit-model-test.mjs` contrasta fases, cámara, pulso, paradas y proyección con las ecuaciones del HAR; verifica límites, 8–28 fuentes, inversa de ambas coordenadas, perspectiva, prioridad/opacidad, superficies/texturas, cierre, escala, scroll y fábrica exportada. `nagweb-motion-focus-orbit-smoke.mjs` comprueba controles, cantidades/recuperación, píxeles y selección nativa, direcciones/paradas, transparencia de fuente, esquinas/sombras, recorte personalizado, reutilización, Biblioteca, grupo/escena, guardar/exportar, scroll real, tiempo/historial y móvil/movimiento reducido. La suite agrega colocación/redimensionado y carga múltiple. El conjunto suma 43 suites de modelo y la matriz 34 suites de navegador.

Spotlight Zoom completó las 33 suites de navegador correctamente (`e37087ef736a1715ef6ca2961dad2408ee044ac4`). Continúa exclusivamente en `internal-motion-lab`, con despliegues Vercel deshabilitados y sin integrar ramas paralelas. Próximo candidato del HAR: Focus Slider.


## Focus Slider: zigzag con tarjeta central ampliada

Se incorpora `focus-slider` del HAR de Animos. El catálogo llega a 49 composiciones. Ocho imágenes iniciales, rango 4–12 en pasos de dos y ciclo de 10 segundos. Recorrido horizontal/vertical, tamaño 40–100% (82% inicial, paso 2), escala central 120–260% (200% inicial, paso 5), desvío del zigzag 0–90% (55% inicial, paso 5), zigzag fijo/alternado, separación 1–20% (6% inicial, paso 0,5) y deslizamiento 30–95% del turno (80% inicial, paso 5). Incluye proporción automática o fija, marco, margen, esquinas, sombra y fondos.

La dimensión principal de la tarjeta parte del menor lado interior dividido por la escala máxima. La dimensión transversal deriva de la proporción de imagen y la orientación. La distancia entre centros combina las dimensiones de la tarjeta central y su vecina, más separación. Cada turno avanza una posición con interpolación cúbica durante la fracción de deslizamiento y mantiene el centro durante el resto. El tamaño crece linealmente al acercarse al centro. El desvío transversal depende del lado y distancia al centro, con sentido fijo o alternado mediante el coseno del avance. Las imágenes se ordenan de la más distante a la más cercana.

La cantidad par conserva el sentido del zigzag al cerrar el ciclo. Cambiar cantidad recupera las fuentes retiradas; duplicar o quitar actúa sobre dos imágenes consecutivas y asigna identificadores nuevos a las copias. El encuadre viaja con la fuente al reordenar. Se conservan texturas con esquinas mientras cambia la escala, acotadas a 2048 píxeles, sin asignaciones durante el movimiento. La selección respeta forma, recorte del marco y prioridad. La sombra aumenta hacia el centro, se dibuja junto a la tarjeta y se limita a su exterior para preservar transparencia. Se comparten canvas, Director y reloj.

Incluye reemplazo/carga múltiple, encuadre/orden, Biblioteca, grupo/escena, guardar/reabrir, historial, JSON/HTML y tiempo/scroll. Movimiento reducido mantiene una pose estable independiente del rango y vueltas de scroll.

`nagweb-focus-slider-model-test.mjs` contrasta avance, pausa, zigzag, dimensiones, escala y sombras con las ecuaciones del HAR; verifica 4–12 fuentes pares, ambas orientaciones y proporciones, geometría acotada, texturas estables, cierre, escala, scroll y fábrica exportada. `nagweb-motion-focus-slider-smoke.mjs` comprueba controles, cantidades/edición por pares/recuperación, píxeles y selección durante avance/pausa, transparencia, esquinas/sombras, encuadre personalizado, reutilización, Biblioteca, grupo/escena, guardar/exportar, scroll real, tiempo/historial y móvil/movimiento reducido. La suite agrega colocación/redimensionado y carga múltiple. El conjunto suma 44 suites de modelo y la matriz 35 suites de navegador.

Focus Orbit completó las 34 suites de navegador correctamente (`d81ef2d1707f20ced480fc9797494d0941b2d8f4`). Continúa exclusivamente en `internal-motion-lab`, con despliegues Vercel deshabilitados y sin integrar ramas paralelas. Próximo candidato del HAR: Sphere Wall.


## Sphere Wall: pared curva y paradas de cámara

Focus Slider completó las 35 suites de navegador en `7242541acd44d71b68ec8ad1c12885d45705ddfd`. Se agrega `sphere-wall` del HAR de Animos y el catálogo llega a 50 composiciones. Ocho imágenes iniciales, 4–30 fuentes independientes y duración de 20 segundos. Tamaño 10–50% (20% inicial), inclinación ±45°, margen 0–20% (13% inicial), esquinas 0–12% (0,5% inicial), curvatura −150–150% (−100% inicial), separación 0,5–20% (5% inicial) y atenuación de bordes 0–100%. Proporciones automáticas o fijas, fondos, encuadre por fuente y sombra opcional.

El recorrido continuo proyecta cada tarjeta sobre una esfera en ambos ejes, con movimiento hacia izquierda, derecha o filas alternadas. Las fuentes se repiten según columna y fila. Las paradas usan una permutación reproducible del HAR, 2–12 destinos (5 iniciales), transición suavizada y pausa; permiten zoom 1,2–4× (2,8 inicial), o movimiento sin zoom, con superposición o foco aislado. Los controles dependientes del modo se ocultan. Las paradas utilizan planos tangentes, como la referencia. En continuo, la atenuación oscurece el color y conserva el alfa propio; en las paradas modifica la opacidad.

La misma malla triangular determina proyección y selección nativa. El renderizador reutiliza texturas y un canvas auxiliar, con rasterizaciones acotadas a 2048 px. Recorta al marco, descarta proyecciones degeneradas y mantiene coordenadas finitas en tamaños extremos. Las esquinas se recortan en la textura y los cambios de encuadre se aplican a todas las copias. El recorte de cada triángulo usa franjas alineadas al píxel para evitar que el antialias del modo copy deje costuras; cientos de muestras interiores verifican color y alfa, también en imágenes semitransparentes. Se conserva el Director de Scroll como reloj para Tiempo, Scroll, grupos, escenas y exportación.

La prueba de modelo verifica controles del HAR, cierre, sentido/paridad de filas, destinos y pausas deterministas, zoom y foco, malla/selección/esquinas, distinción entre color y alfa, límites, móvil y scroll. La suite de navegador agrega píxeles en superficies cóncavas/convexas y marcos horizontales/verticales, selección real, transparencia, esquinas, controles condicionales, fuentes/recuperación, texturas reutilizadas, Biblioteca, grupo/escena, guardar/exportar, scroll real, tiempo/historial y movimiento reducido. Se suman colocación/redimensionado y carga múltiple. Son 45 suites de modelo y 36 suites de navegador.

El trabajo continúa sólo en `internal-motion-lab`. Vercel conserva la vista previa única de 43 composiciones; no se realizan nuevos despliegues. Próximo preset del HAR: Sphere Cascade.


## Sphere Cascade: pared curva vertical

Sphere Wall completó las 36 suites de navegador en `f08306569c886338f1148ff955b8a2e65aae5f8d`. Se agrega `sphere-cascade`, preset vertical del HAR de Animos, y el catálogo llega a 51 composiciones. Ocho imágenes iniciales, 4–30 fuentes independientes, duración de 20 segundos. Conserva los controles de tamaño, inclinación, margen, esquinas, proporción, curvatura, separación y atenuación de bordes del HAR. El sentido permite arriba, abajo o columnas alternadas.

La dimensión de tarjeta deriva del ancho útil; la latitud desplaza las filas, mientras la longitud conserva las columnas. Cada fuente se repite por fila y columna según la distribución del HAR. Las paradas de cámara giran alrededor del eje vertical para enfocar columnas, junto al avance de las filas. Utilizan destinos reproducibles, 2–12 paradas, pausa y transición suavizada, con zoom opcional de 1,2–4× y superposición o foco aislado. El recorrido continuo conserva superficies curvas; las paradas usan planos tangentes. El color se oscurece en continuo sin multiplicar el alfa de la imagen; las paradas aplican atenuación a la opacidad.

Los planos tangentes se dibujan una sola vez con su transformación afín, incluidas tarjetas que cruzan los bordes del marco. Se comparte el renderizador de superficies con Sphere Wall: mallas para dibujo y selección nativa, recorte al marco, esquinas en la textura, texturas y canvas auxiliares reutilizados y acotados a 2048 px. El encuadre individual actualiza las copias. Se conservan Biblioteca, carga múltiple, edición y recuperación de fuentes, grupos, escenas, guardar/reabrir, historial, exportación y reloj Tiempo/Scroll. Movimiento reducido mantiene una pose estable.

La prueba de modelo contrasta directamente latitud, longitud, perspectiva y distribución de fuentes con las ecuaciones verticales del HAR, además de sentido/paridad de columnas, cierre, paradas/zoom/foco, selección, extremos y móvil. La prueba de ejecución local ejercita el renderizador real con los tres movimientos y curvaturas; la suite de navegador cubre color/alfa y costuras, selección real, controles, transparencia, esquinas, texturas, Biblioteca, guardar/exportar, scroll, tiempo/historial y móvil. Incluye colocación/redimensionado y carga múltiple. El conjunto llega a 46 suites de modelo y 37 suites de navegador.

Continúa exclusivamente en `internal-motion-lab`, sin integrar ramas paralelas ni realizar otro despliegue Vercel. Próximo preset del HAR: Totem Wall.

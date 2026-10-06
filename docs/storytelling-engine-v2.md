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

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

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

# NAGWEB 01 | Registro verificable de aceptación manual fallida

**16 de octubre de 2026.** Informe recuperado del mensaje textual del usuario (no del formulario efímero). **Estado de V1.0: RECHAZADA; siete recorridos reportados fallidos.** No modificar resultados ni reinterpretar mejoras solicitadas como pruebas superadas. Trabajar solo en `feat/storytelling-engine-v2`. El código y las pruebas actuales son fuente de verdad técnica. Este reporte es la fuente de verdad de **las observaciones del usuario**.

## 1. Redimensionar texto en lienzo: FALLÓ
- **Actual:** con el mouse, cambiar tamaño de un texto modifica solo el cuadro o caja contenedora; las letras permanecen del mismo tamaño.
- **Esperado:** mantener el redimensionado normal de la caja y agregar **Shift mientras se arrastra el tirador** para modificar proporcionalmente cuadro **y tamaño de las letras**, conservando relación de aspecto. El usuario escribió "Shift + Click al cambiar el tamaño"; confirmar gesto práctico como Shift + arrastrar tirador, no un botón extra.
- **Criterio:** caja sola sin Shift; caja + tipografía a escala proporcional con Shift, en escena libre y en elementos de texto pertinentes.

## 2. Arrastrar imagen A → B → C: FALLÓ
- **Actual:** la imagen nace en A, se arrastra a B; al volver a agarrarla desde B para moverla a C, aparece repentinamente en A y el siguiente desplazamiento arranca desde A.
- **Esperado:** la posición A → B persiste y el segundo arrastre comienza exactamente en B, sin saltos ni pérdidas.
- **Prioridad:** bloqueante de edición fundamental; diagnosticar sincronización modelo–DOM–drag, no parchear solo imágenes por cada recurso.

## 3. Hero por capas: orden de TODOS los elementos: FALLÓ / requerimiento de UX
- **Actual:** 'Al frente/Al fondo' solo permite controlar fotografías.
- **Esperado:** manejar orden de apilamiento de **todos** los elementos del Hero (incluidos antetítulo, títulos, descripciones, textos adicionales, imágenes, botones). Preferencia: lista arrastrable estilo Capas de Photoshop en panel derecho, con piezas de arriba superpuestas a las de abajo; alternativa UX equivalente admisible.
- **Criterio:** ordenar cualquier par de capas reales, conservar superposición en escritorio/móvil y exportación, Deshacer/Rehacer.

## 4. Versión móvil / Restablecer: FALLÓ
- **Actual:** sí puede editar móvil y persiste al ir a escritorio y volver. No encuentra 'Restablecer móvil' de los controles contextuales. Ve aviso «Estás editando la versión para celular...», y botón «Este elemento: Vuelve a como está en la compu» que **no restaura el orden de elementos móvil**.
- **Esperado:** control descubrible y claro para restaurar posición/orden de elementos de móvil según escritorio, manteniendo escritorio intacto. Distinguir restauración de pose de una parte del Hero vs restauración de un elemento completo o su orden.
- **No inventar** que el usuario perdió posiciones, dijo específicamente que persistían.

## 5. Historia sticky + escenas: FALLÓ
- **Actual:** en escenas *no libres* no puede mover, ampliar ni rotar las piezas internas; en **Lienzo libre** el widget se desarma: fondo ocupa toda escena y el scroll saca la historia de pantalla en lugar de quedarse fija por capítulo.
- **Esperado:** selección/transformación interna en ambos modos de escena; composición contenida; escenario sticky visible hasta completar la secuencia, incluso en libre.
- **Criterio:** modificar título/imagen interna y navegar capítulos, sticky 0/50/100% en Flow y Free, editor y publicación.

## 6. Director de Scroll: keyframes en la línea de tiempo: FALLÓ
- **Actual:** el panel «Momento en la historia» presenta demasiados datos numéricos, y mover con el mouse un objeto cuando está seleccionado un punto temporal altera el elemento general, NO exclusivamente ese keyframe.
- **Esperado:** interfaz inspirada en After Effects, con lista de **todos los elementos** de la escena en la línea de tiempo y múltiples keyframes por elemento. Cada keyframe fija **posición X/Y, tamaño, rotación/inclinación, escala y otras poses**, editable con mouse al seleccionar ese tiempo, interpolable a lo largo del progreso de scroll. Ejemplo explícito: t=0% -> posición (1,1), 20x20, 0°; t=50% -> (10,10), 40x40, 45°; transición progresiva sin cambiar el estado de t=0%.
- **Criterio:** editar pose del keyframe 50% con manipuladores del lienzo, volver a 0% y conservar pose original; exportación y scrubbing replican la interpolación. No reemplazar por ajustes numéricos.

## 7. Guardar/F5/importar JSON: FALLÓ
- **Actual:** tras F5 reaparece un proyecto anterior, sin los cambios de sesión. El usuario sospecha imagen muy pesada/agotamiento del almacenamiento local. Puede descargar JSON, pero al elegir abrirlo **el proyecto sigue como antes**, aparentemente no restaura el contenido esperado.
- **Esperado:** guardar cambios sin pérdidas silenciosas, avisar y ofrecer respaldo si falla persistencia por imágenes grandes; importar el JSON reemplaza el estado visible y recupera el documento guardado. Testear con imágenes pesadas y fallo de cuota, además del caso pequeño ya automatizado. Evitar declarar éxito por existencia de archivo sin contenido correcto.
- **Prioridad:** bloqueante de integridad de trabajo.

## Otros recursos probados
- **Tarjeta holográfica:** funciona bien. Solicita añadir más textos/imágenes/elementos, **V1.1** por ser expansión, sin bloquear V1.
- **Collage editorial:** confuso su propósito, usuario informa arrastre de fotos incluso publicado; describir composición editorial estática e investigar diferencia entre editor y HTML exportado. Un test automatizado no reprodujo movimiento en HTML; no invalidar la experiencia.
- **Cinta cinética:** se iba de pantalla al avanzar el scroll; se reprodujo y corrigió el caso Lienzo libre en `d1c072`, confirmado en Actions `38943321838`. No asumir aceptación manual hasta que el usuario lo pruebe.

## Protocolo sin pérdida de reportes
1. No pedir al usuario que vuelva a completar checklist; **este documento contiene todo el informe recibido**.
2. No usar formularios de estado local efímero. Incorporar futuros reportes que el usuario envíe en texto o adjuntos aquí.
3. Priorización por riesgo real: **integridad de datos (#7), saltos de arrastre (#2), funcionamiento/edición sticky (#5) y keyframes (#6)**. UX de tipografía, capas y móvil también queda comprometida; no se ignora ni se reclasifica arbitrariamente a V1.1.
4. Corregir causas comunes, acompañar regresiones de navegador con gestos del usuario, guardar cada bloque real con su commit. **No declarar V1.0 aceptada** hasta resolver bloqueantes e invitar al usuario a verificar solo los casos corregidos, sin repetir los siete.

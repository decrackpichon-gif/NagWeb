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

## Avance técnico sobre los reportes (16/10/2026)

**Importante:** corrección implementada no equivale a aceptación manual. La V1.0 sigue **NO ACEPTADA** hasta comprobar los resultados en uso real. La batería completa de GitHub Actions para el último commit funcional se encuentra en <https://github.com/decrackpichon-gif/NagWeb/actions/runs/38952544279> y debe verificarse antes de presentarla como aprobada.

- **#1:** `bb3725a`: Shift + arrastre del tirador de un texto cambia proporcionalmente caja/tamaño de letra; sin Shift modifica caja. Regresión de gesto con Chromium en `.github/nagweb-editor-reported-smoke.mjs` aprobó en ejecuciones intermedias.
- **#2:** `bb3725a`: corregido el atributo `data-x/y/w/rot` del nodo al terminar el arrastre; segundo drag A→B→C probado con punteros reales en Chromium.
- **#3:** `a2fdb90`, `38d29b1`, `26df435`: inspector `Capas del Hero` arrastrable para fotografías y textos, z-index en piezas de texto sin contexto de apilamiento superior, orden móvil independiente y restablecimiento de orden móvil. Regresión en `nagweb-editor-reported-smoke.mjs`; pendiente inspección manual de composición visual.
- **#4:** `3c97c3f`: además de restaurar un elemento, opción `Toda la escena: restaurar diseño celular` que elimina las posiciones móviles de elementos y partes internas, sin tocar desktop. Prueba específica añadida en `635edceb`. El significado del viejo botón individual ahora queda diferenciado.
- **#5:** `2142907`, `3e7ffcb`, `f8a2a09`: corregida geometría sticky de Historia dentro de Lienzo libre mediante el mismo contrato de Cinta cinética; runtime exportado incluye helper. Chromium verificó pantalla pegada y cambio de capítulos en escenas flow/free en ejecuciones anteriores; falta aceptación manual de arrastre interno.
- **#6:** `3f257a9`: seleccionar un keyframe o hacer clic en la línea de tiempo cambia automáticamente a `Momento de la escena`, activando los tiradores existentes que crean o alteran ese momento sin modificar el diseño base. La UI previa tenía este modo pero quedaba en Diseño base, explicando el comportamiento observado. Regresión de timeline actualizada en `aa2db31`. Debe comprobarse visualmente manipulación, rotación y tamaño en momentos 0 y 50%.
- **#7:** `bb3725a`: aviso persistente de fallo de cuota y botón de respaldo JSON directo, indicando que F5 perdería cambios no persistidos. Importar JSON indica proyecto/páginas abiertos y distingue carga en memoria de almacenamiento persistido. Smoke de cuota y exportación aprobó en ejecuciones anteriores, con prueba `release-smoke` adaptada en `3f257a9`. Aun es necesaria aceptación manual con su imagen real grande.

No añadir funciones de catálogo a V1.0. No pedir repetir las siete pruebas: el usuario ya informó todos los resultados completos y este archivo contiene su detalle.

## Protocolo sin pérdida de reportes
1. No pedir al usuario que vuelva a completar checklist; **este documento contiene todo el informe recibido**.
2. No usar formularios de estado local efímero. Incorporar futuros reportes que el usuario envíe en texto o adjuntos aquí.
3. Priorización por riesgo real: **integridad de datos (#7), saltos de arrastre (#2), funcionamiento/edición sticky (#5) y keyframes (#6)**. UX de tipografía, capas y móvil también queda comprometida; no se ignora ni se reclasifica arbitrariamente a V1.1.
4. Corregir causas comunes, acompañar regresiones de navegador con gestos del usuario, guardar cada bloque real con su commit. **No declarar V1.0 aceptada** hasta resolver bloqueantes e invitar al usuario a verificar solo los casos corregidos, sin repetir los siete.

# NAGWEB 01 | Entrega V1.0 del Editor principal

**Política:** [V1.0 primero](https://github.com/decrackpichon-gif/NagWeb/blob/main/POLITICA_DESARROLLO_V1_PRIMERO.md).

**Rama de producto:** `feat/storytelling-engine-v2`. Este documento se limita a **NAGWEB 01**. No incorpora ni fusiona el trabajo independiente de Motion Lab (02), Cámara 3D (03), Interaction Studio (04) o Biblioteca (05).

## Qué incluye el producto esencial

- Crear y organizar páginas y escenas; agregar y editar elementos habituales directamente en el lienzo.
- Usar componentes y partes internas de los recursos ya presentes, con herramientas de disposición y personalización.
- Guardar automáticamente en el navegador, deshacer y rehacer, y **descargar un respaldo JSON** para abrirlo de nuevo.
- Vista de escritorio y móvil, vista previa y **descarga directa de una página HTML**.
- Director de Scroll existente: momentos, keyframes, reproducción/vista previa y comportamiento exportado. Contenedor universal y escenas anidadas existentes.

Esto es un **alcance cerrado para V1.0**. Los recursos adicionales, efectos nuevos, catálogos más grandes y controles opcionales quedan para V1.1+; no bloquean la entrega.

## Cómo ejecutarlo y conservar el trabajo

1. Usar los archivos de **esta rama**, no los de `main`, que son históricos. Es una aplicación web estática: servir el directorio del repositorio, por ejemplo `python -m http.server 8000`, y abrir `http://localhost:8000/`.
2. Trabajar en el lienzo. El proyecto se guarda automáticamente en el almacenamiento local del navegador, que **no se comparte entre dispositivos** ni sustituye una copia de seguridad.
3. En el menú de exportación, elegir **Guardar proyecto** para bajar `proyecto-scrollcraft.json` y **Abrir proyecto** para recuperarlo. Elegir **Descargar index.html** para guardar la página actual. Estos dos botones funcionan sin una API especial de descargas de la aplicación.
4. Para múltiples páginas, **Descargar sitio completo** genera un ZIP con páginas y recursos. Esta función aún carga JSZip desde una CDN pública y, por lo tanto, requiere conectividad al momento de preparar el ZIP. Si no está disponible, la descarga individual `index.html` y el respaldo JSON funcionan por separado.
5. Conservar el proyecto JSON para seguir editando y los HTML/ZIP para publicar o entregar el sitio. El HTML exportado es diferente al archivo JSON editable.

## Incidente de aceptación manual y recuperación

- En el chat del 16/10/2026 el usuario completó siete pruebas principales y sus notas de fallos en controles interactivos que **no enviaban los valores al asistente**. La conversación no recibió esas descripciones; se perdieron. No culpar al usuario ni afirmar que no probó los flujos.
- Los siete casos (crear/editar; historial/recuperación; Hero; responsive; Historia sticky; Director; guardado/exportación) deben tratarse como **reportados fallidos**, aunque algunas pruebas de CI pasen.
- **Prohibidos formularios efímeros para recopilar incidencias.** Recibir informes como mensajes de chat, videos narrados o capturas adjuntas; sintetizar, confirmar y registrar textualmente en el contexto antes de cambios técnicos. No exigir repetir la ronda entera.
- Continuidad recomendada: revisar autónomamente los recorridos visibles y sus fallos de UX, corregir defectos reales agrupados, entregar versión nueva sólo tras validación de casos concretos. Si una diferencia no puede reproducirse sin datos nuevos, pedir **una sola captura/video del caso puntual**, no siete informes.

## Criterio final de aceptación

- [x] Flujo de creación, edición, guardado, historial y exportación ya cubierto por pruebas de navegador existentes.
- [x] Corregida la dependencia del puente privado de descargas: respaldo y HTML disponibles en navegador común (`8c4e318`).
- [x] **Prueba integral V1.0 aprobada**: crear una página, escena y botón, descargar JSON e HTML con un navegador común, recargar e importar el respaldo. Se conservan páginas, escenas, estructura y contenido. GitHub Actions: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38773384278 .
- [ ] **ACEPTACIÓN MANUAL RECHAZADA (16/10/2026): las siete pruebas principales reportadas como fallidas.** Faltan los detalles individuales porque no fueron transmitidos por el formulario efímero. No inventar resultados, no pedir que el usuario complete nuevamente las siete pruebas ni restablecer el cierre por éxito del CI.

**Estado real: V1.0 NO ACEPTADA, pendiente de corregir fallos de uso.** La batería automática de Chromium pasó el 15/10/2026, pero el usuario hizo las siete pruebas manuales del recorrido principal y reportó que **todas fallaron**, con explicaciones que se perdieron porque el asistente creó controles locales que no enviaban sus respuestas al chat. **Las pruebas automáticas no sustituyen la aceptación manual.** No declarar el Editor terminado ni aplazar estos fallos a V1.1. No se hizo merge ni despliegue.

## Trabajo pospuesto para V1.1+

Nuevas plantillas y recursos, pulido individual de animaciones que ya funcionan, más variantes estéticas, opciones avanzadas de mockups y futuras integraciones con las otras cuatro ramas. Ninguno se incorpora automáticamente a V1.0.

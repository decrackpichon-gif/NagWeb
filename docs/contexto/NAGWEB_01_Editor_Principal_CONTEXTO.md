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
- La raíz `.nw-lh` actúa como contenedor de tamaño para unidades `cqw`. Mantener este contrato en edición, guardado, responsive y exportación. El sistema de profundidad/parallax propio del Hero y el Director de Scroll siguen independientes.
- Los cambios funcionales se introdujeron en `js/nagweb-feedback-v16.js` y `js/nagweb-v14-direction.js`, con regresiones en `.github/nagweb-editor-parts-smoke.mjs`. Confirmar los resultados actuales de CI consultando el HEAD de la rama.

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
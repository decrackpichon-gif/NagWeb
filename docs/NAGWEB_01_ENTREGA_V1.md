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

## Criterio final de aceptación

- [x] Flujo de creación, edición, guardado, historial y exportación ya cubierto por pruebas de navegador existentes.
- [x] Corregida la dependencia del puente privado de descargas: respaldo y HTML disponibles en navegador común (`8c4e318`).
- [ ] Aprobación de la **prueba integral V1.0** para crear una página, escena y botón, guardar JSON/HTML, recargar e importar el respaldo. CI: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38773384278 . **No dar por aprobada mientras el run no haya finalizado correctamente**.
- [ ] Revisión final de uso y apariencia de un sitio propio por parte del usuario, si desea aceptarlo visualmente como su V1.0.

**Estado:** candidata V1.0 en validación. No se amplía el alcance por tareas opcionales. Si la prueba nueva falla, corregir ese defecto y repetir solo lo necesario. No mergear ni desplegar en Vercel sin autorización del usuario.

## Trabajo pospuesto para V1.1+

Nuevas plantillas y recursos, pulido individual de animaciones que ya funcionan, más variantes estéticas, opciones avanzadas de mockups y futuras integraciones con las otras cuatro ramas. Ninguno se incorpora automáticamente a V1.0.

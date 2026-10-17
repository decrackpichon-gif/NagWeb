# NAGWEB 03 | Cámara 3D · Entrega V1.0

**Estado actual (17/10/2026): candidato técnico de V1.0, pendiente de aceptación real del usuario.** El alcance permanece cerrado; no hay nuevos bloqueos funcionales demostrados. Las pruebas automáticas no equivalen a aceptación manual.

- **Repositorio:** https://github.com/decrackpichon-gif/NagWeb
- **Rama:** `feat/scroll-camera-v1`
- **Último commit de código y pruebas de V1.0:** [`3088025f9de18c1c13f937f760cba48064f193da`](https://github.com/decrackpichon-gif/NagWeb/commit/3088025f9de18c1c13f937f760cba48064f193da)
- **GitHub Actions:** [camera smoke aprobado](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38774758688) y [41 comprobaciones espaciales aprobadas](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38774758571).
- **Separación de proyectos:** sin merge a `main`, sin cambios en otros NAGWEB ni despliegues a Vercel.

## Qué se puede hacer en V1.0

Crear una escena de **Lienzo libre** con títulos, imagen y objeto GLB/forma 3D; ajustar visualmente la cámara y la profundidad; crear y editar recorridos XYZ/orientación con keyframes; previsualizar con el Director de Scroll (progreso 0→1), seleccionar elementos, Deshacer/Rehacer, guardar y recuperar proyectos, y exportar un sitio HTML.

La opción de cámara **«Crear ejemplo completo»** genera una escena reutilizable de tres capas y cinco encuadres para comenzar sin cargar contenido externo. El resultado se puede editar; no constituye un segundo motor de animación.

## Cómo acceder y usar esta versión sin desplegarla

1. Abrir [la rama de Cámara 3D en GitHub](https://github.com/decrackpichon-gif/NagWeb/tree/feat/scroll-camera-v1). Elegir **Code → Download ZIP**, descomprimir y conservar la estructura del proyecto.
2. Servir la carpeta completa mediante un servidor estático local y abrir su `index.html` (por ejemplo, `http://localhost:4173/index.html`). No abrir archivos de `js/` ni copiar el HTML a otra carpeta. La prueba histórica de cámara usó servidor HTTP; otras pruebas espaciales usaron `file://` con dependencias interceptadas para fixtures. Estas últimas no certifican el ZIP descargado sin conexión ni la carga real de proveedores externos.
3. En el editor, entrar a **Lienzo libre** y a las herramientas de **Cámara 3D**. Usar «Crear ejemplo completo» para empezar, o usar textos, imágenes y modelos propios.
4. Ajustar los elementos y los encuadres de la cámara; recorrer el Director de Scroll y comprobar la vista previa.
5. Usar el guardado del proyecto y, para respaldo transferible, la función **Guardar proyecto** en JSON. Exportar el sitio desde la opción de exportación del editor; conservar los recursos locales que requiera la exportación. El guardado automático en navegador no sustituye un respaldo JSON para trasladar equipos.

## Validaciones realizadas

- **Cámara:** pruebas de modelo, trayectorias y keyframes; edición visual de puntos XYZ; selección, interacción de mouse y Deshacer; consistencia con el Director 0→1.
- **Escena/exportación:** Chromium con geometría WebGL y un GLB real; proyección y sincronización, movimiento reducido, cambios de tamaño, carga de modelos y liberación de recursos.
- **Persistencia de V1.0:** la prueba final pasó la secuencia **Deshacer → localStorage → recarga → capas/keyframes recuperados → generación de HTML**.
- **Ejemplo:** tres capas editables y cinco encuadres, con Deshacer único y sin modificar los elementos anteriores.

Pruebas automáticas realizadas en Chromium/Google Chrome para los escenarios definidos. No se presenta una certificación universal de todos los navegadores, dispositivos, modelos ni archivos externos.

## Límites conocidos de V1.0

La oclusión **HTML→WebGL** cubre las superficies, máscaras y jerarquías compatibles documentadas en [proyección espacial](spatial-projection-v1.md). La oclusión inversa **WebGL→HTML** experimental, que no superó la regresión del 15/10, queda **desactivada por defecto**; el HTML permanece semántico y editable. La composición parcial perfecta entre GLB y cualquier contenido HTML, los recortes CSS arbitrarios, efectos avanzados, nuevos controles y más presets son posibles trabajos **V1.1+**, no requisitos de esta entrega.

Esto es una V1.0 dentro de su **alcance finito**, no una promesa de oclusión universal ni de que todos los efectos 3D imaginables estén implementados.

## Cierre

Se conserva como **candidato técnico**. Para aceptar V1.0 falta comprobar el acceso real del paquete en el equipo del usuario y recibir su confirmación. No se integró con los otros frentes ni se publicó en Vercel. No se agregan funciones opcionales para cerrar esta aceptación.


## Aceptación manual breve y finita

Sobre la carpeta completa servida por HTTP:

1. Crear una escena de **Lienzo libre**, activar **Director de Scroll → Cámara 3D** y pulsar **Crear ejemplo completo**. Deben aparecer dos textos y una imagen, con cinco encuadres.
2. Recorrer **0/25/50/75/100 %**; volver al mismo porcentaje debe recuperar el mismo encuadre. Cambiar X/Y/Z y un ángulo de un encuadre, luego Deshacer: debe recuperar el estado anterior.
3. Añadir una forma 3D o importar un GLB, mantener su anclaje activo y mover su posición/profundidad y giro. Comprobar que acompaña la cámara sin desaparecer ni alterar su recorrido.
4. Guardar proyecto JSON, recargar y recuperar el proyecto. Textos, imagen, modelo y encuadres deben conservarse.
5. Exportar HTML, abrirlo con el mismo servidor y recorrerlo por scroll. Comparar los encuadres con la vista previa.

Si falla un paso, informar ese número y una captura; corregir ese fallo antes de pedir repetir la aceptación. No hace falta evaluar efectos avanzados ni modelos complejos para aceptar el alcance mínimo.

## Revisión del 17/10/2026

- Base revisada: `92a0572`; código, suites y workflows idénticos a `3088025` (comparación Git sin diferencias en `index.html`, `js/`, `tests/` y `.github/`).
- Verificados directamente los registros de [integración espacial](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38774758571): GLB real en preview/exportado, gestos, proyección con posición y orientación, Director, persistencia/recarga/exportación, resize y movimiento reducido aprobados. Es evidencia histórica del mismo runtime, no una ejecución nueva.
- Ejecutados localmente con Node 24 y Three r128: modelo de cámara, runtime exportado, editor/mapa, renderer, proyección, interacción y timing; todos aprobados.
- No se repitió Chromium local: el navegador no está instalado y la descarga de Playwright devolvió un ZIP inválido. No se afirma validación nueva del acceso real ni de hardware físico.
- Cambio preparado únicamente documental; sin cambios de motor, segundo progreso, merge, push ni publicación. La oclusión inversa experimental permanece desactivada. La composición parcial universal GLB→HTML sigue fuera de V1.0.

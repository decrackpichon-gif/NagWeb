# NAGWEB 03 | Cámara 3D · Entrega V1.0

**Estado:** V1.0 estable y utilizable **en su rama exclusiva**, dentro del alcance cerrado acordado el 15/10/2026.

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
2. Abrir el `index.html` del repositorio en un navegador moderno. Las pruebas de Chromium funcionan con `file://`; si un navegador restringe archivos locales, abrir la carpeta con un servidor estático local, por ejemplo Live Server.
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

Se declara **NAGWEB 03 | Cámara 3D V1.0 lista para utilizar desde la rama**. No se integró con los otros frentes ni se publicó en Vercel. Solo reabrir V1.0 ante una regresión real del flujo esencial, pérdida de datos o defecto crítico demostrado; las mejoras y expansiones pertenecen a versiones posteriores.

# NAGWEB 05 | Guía de prueba y alcance

**Rama de código:** `feat/resource-etl-v1`. **Datos:** `resource-vault-data`, conservada aparte. **Vercel:** despliegues automáticos deshabilitados.

## Qué se puede probar hoy

La Biblioteca muestra un catálogo verificado de **6762 recursos**. Su índice clasifica **6041 como insertables/usables de forma nativa**, y **721 como inspeccionables o copiables**. El uso nativo no equivale a personalización universal: SVG, HTML/CSS y efectos CSS tienen adaptadores distintos.

| Familia | Uso disponible |
| --- | --- |
| Lucide y Heroicons | Insertar y editar SVG vectorial, guardar y exportar |
| Uiverse y SpinKit | Insertar HTML/CSS compatible en iframe aislado, personalizar y exportar |
| Magic.css | Aplicar efectos a elementos del lienzo, ajustar tiempos, quitar, deshacer y exportar |
| CSSShake | Aplicar a elementos del lienzo, Hover/Siempre, quitar, deshacer y exportar |
| React, Three.js, GLSL y otros recursos complejos | Vista previa/código según disponibilidad. No declararlos insertables hasta tener adaptador comprobado |

## Prueba manual integrada en el editor

1. Abrir NagWeb desde un servidor local y seleccionar una escena.
2. Abrir la **Biblioteca**. Buscar un ícono Lucide o Heroicons; insertarlo, cambiar tamaño/color/grosor, cerrar y reabrir para confirmar que no se duplica.
3. Insertar un componente Uiverse y un loader SpinKit compatible. Cambiar sus propiedades, confirmar que los elementos no cargan scripts externos ni rompen la composición.
4. Seleccionar un título, aplicar Magic.css. Modificar duración, quitar efecto, deshacer/rehacer. Probar con imagen y SVG dibujado, sin perder posición ni rotación.
5. Aplicar CSSShake a un elemento. En **Hover** debe animar al colocar el cursor; en **Siempre** debe animar sin intervención. Volver a editar, guardar, quitar y deshacer.
6. Seleccionar varios elementos compatibles y aplicar una misma animación. El cambio debe crear una única entrada de historial.
7. Recargar el editor, comprobar persistencia y **exportar el sitio**. Abrir el HTML exportado sin conexión: íconos y estilos de los componentes o efectos usados deben seguir disponibles.
8. En escritorio, el botón **Editar** se activa con Enter al recibir foco. Alt+Enter también se maneja en el editor, pero puede ser reservado por el navegador/SO en ciertas configuraciones de Windows.
9. Probar tamaño móvil; confirmar que la biblioteca no tapa funcionalidades esenciales y que el editor conserva los cambios.
10. Intentar aplicar un recurso marcado **Solo código**. El editor debe impedirlo y ofrecer consulta/copia, sin insertar objetos defectuosos.

## Verificación automática

En la carpeta `tools/resource-etl` se pueden ejecutar `npm test` y `npm run test:browser`, con Node 20+ y Chromium/Playwright instalados. La ejecución oficial `Resource ETL CI` corre pruebas Chromium en Linux y Windows, selftests y smoke de Windows.

**No asumir éxito de toda la CI porque tres de cuatro jobs hayan terminado correctamente.** Confirmar la ejecución más reciente y el commit que revisa.

## Qué falta para alcanzar el objetivo completo

**Cierre de una primera versión estable:** CI verde en ambos sistemas, pruebas manuales representativas y corrección de fallos encontrados. No es necesario esperar a que todos los recursos complejos tengan adaptador para probar la biblioteca real.

**Objetivo completo más amplio:** permitir uso, composición y edición contextual de las familias que hoy son solo código, especialmente React, Three.js y GLSL, además de resolver previsualizaciones/compatibilidad particulares, licencias y otras fuentes como Lottie. Esa parte requiere adaptadores especializados, integración cuidadosa con el editor principal y más pruebas. No confundir el hito estable con el final de esta visión.

**Regla de trabajo:** implementar bloques cohesivos, probar una vez el lote, registrar problemas reales, no inventar nuevos controles sin una necesidad concreta y no desplegar Vercel ni hacer merges.

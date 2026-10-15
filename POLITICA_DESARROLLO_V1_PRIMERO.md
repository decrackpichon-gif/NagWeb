# Política universal de desarrollo | V1.0 primero

**Regla prioritaria permanente, solicitada por el usuario el 15/10/2026.** Se aplica a todos los desarrollos actuales y futuros que hagamos, incluidos los cinco frentes de NagWeb. Solo cambiar esta prioridad por pedido expreso del usuario.

> **Entregar primero un producto V1.0 estable, funcional y utilizable. Mejorar y expandir después.** No convertir el cierre de V1.0 en una lista infinita de opciones, recursos, efectos, microetapas ni refinamientos.

## Contrato de producto y alcance de V1.0

1. **Definir el uso principal y el recorrido mínimo completo**: qué debe poder hacer una persona de principio a fin para que el producto tenga valor real. Acordar una lista **cerrada y finita** de funcionalidades esenciales a partir del objetivo existente, evitando agregar requisitos tácitos.
2. **Reutilizar lo que ya funciona**: comprobar el código y el estado actual antes de trabajar; no reconstruir ni ampliar sistemas completos que ya cumplen el objetivo. Priorizar reutilización, simplificación y resolver causas comunes para varios componentes a la vez.
3. **Priorizar bloqueantes**: resolver primero errores que impiden usar, editar, guardar, recuperar, exportar o ejecutar el recorrido principal, además de problemas importantes de estabilidad, seguridad, integridad de datos y compatibilidad indispensable.
4. **Agrupar avances relevantes**: cada «Avanza» debe acercar visiblemente a V1.0. Evitar microetapas artificiales, rondas redundantes de verificaciones, cambios cosméticos marginales y tareas nuevas inventadas solo porque son posibles.
5. **Congelar el alcance al acercarse al cierre**: ideas nuevas, plantillas, animaciones, controles, funciones opcionales, pulido y optimizaciones que no bloqueen V1.0 van al **backlog V1.1+**. No añadirlas a la lista de tareas para poder «terminar».
6. **Criterio de finalización comprobable**: demostrar el recorrido principal de extremo a extremo, ejecutar las pruebas proporcionales al riesgo, comprobar persistencia y salida/entrega reales, documentar límites no bloqueantes y entregar una V1.0 que se pueda usar. «V1.0» no significa presentar como acabado algo roto o no verificado.
7. **Cerrar y comunicar**: entregar el producto, su acceso/forma de ejecución, qué quedó incluido, las pruebas realizadas, problemas no bloqueantes y mejoras opcionales posteriores. Si existe un bloqueante, explicarlo concretamente y atacar **ese bloqueante**, no sumar alcance.

## Reglas de decisión para cada tarea

- **¿Es imprescindible para que el producto V1.0 funcione bien en su recorrido principal?** Hacerlo ahora, de la forma más directa y robusta.
- **¿Ya existe una solución funcional en el repositorio?** Reutilizarla y no rehacerla.
- **¿Es una mejora agradable, una variante extra o una posibilidad futura?** Posponerla expresamente a V1.1+.
- **¿Una tarea propuesta no reduce el riesgo de cierre ni elimina un bloqueante verificable?** No convertirla en requisito.
- **¿Las pruebas necesarias ya pasaron y el riesgo no cambió?** No repetir auditorías como trámite. Verificar solo al cambiar código o ante un riesgo real.

## Independencia y fuentes de verdad

La prioridad **V1.0 primero** no autoriza a mezclar ramas, proyectos, historiales ni funcionalidades. Cada proyecto conserva su rama, documentación técnica, decisiones previas y criterios específicos de aceptación. El HEAD del código sigue siendo la fuente técnica de verdad. Para NagWeb, no hacer merges ni despliegues de Vercel sin permiso.

Si un documento antiguo pide agregar recursos o continuar iteraciones abiertas, **esta política tiene precedencia sobre esa expansión** hasta cerrar el flujo esencial. No anula requisitos funcionales ya aprobados ni criterios de calidad necesarios.

## Qué se entiende por «terminado»

Una versión 1.0 no es el proyecto con todas las funciones imaginables: es **la primera versión completa del producto dentro de un alcance cerrado, que funciona bien, se puede usar, verificar y entregar**. En ese punto se cierra la etapa. Las mejoras posteriores son un proyecto de evolución separado, no una condición retroactiva para aprobar V1.0.

**Aplicación en chats nuevos:** consultar esta política junto con el contexto técnico del proyecto, o indicar expresamente «V1.0 primero». La existencia del archivo en GitHub no implica que un chat nuevo lo haya leído automáticamente.

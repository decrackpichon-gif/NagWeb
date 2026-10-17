# Política universal de desarrollo | V1.0 primero

**Regla prioritaria permanente, solicitada por el usuario el 15/10/2026.** Se aplica a todos los desarrollos actuales y futuros que hagamos, incluidos los cinco frentes de NagWeb. Solo cambiar esta prioridad por pedido expreso del usuario.

> **Entregar primero un producto V1.0 estable, funcional y utilizable. Mejorar y expandir después.** No convertir el cierre de V1.0 en una lista infinita de opciones, recursos, efectos, microetapas ni refinamientos.

## Protocolo obligatorio de recuperación y aceptación real (16/10/2026)

**Nueva precisión expresa del usuario, prioritaria en TODOS los frentes de NagWeb (01, 02, 03, 04 estable/experimental y 05).** El trabajo acumulado se conserva: «V1.0 primero» significa **hacer funcionar la utilidad esencial**, no simplemente congelar lo existente, ocultar defectos ni anunciar una V1.0 por completar pruebas automáticas.

1. **Recuperar antes de reemplazar.** Partir del HEAD de la rama exclusiva y de los commits que funcionaban; no rehacer lo existente, volver arbitrariamente atrás, fusionar otras ramas ni alterar sus datos. Ante una regresión, localizar la causa y corregirla en el menor cambio coherente, o recuperar selectivamente una implementación comprobada. Documentar qué se conservó y por qué.
2. **Comprobar el acceso verdadero a la entrega.** La validación debe cubrir **el mismo ZIP/carpeta/servidor/iniciador/rutas/navegador que recibirá el usuario**, y el recorrido real de su producto, no solo mocks, fixtures o entornos alternativos. No afirmar que abre bien una pantalla si las pruebas no recorren su botón, iframe, URL y archivos reales. Ejemplo histórico: la Biblioteca de NAGWEB 05 devolvía «Archivo no encontrado» con CI verde porque su nuevo servidor no resolvía el índice de una carpeta.
3. **Recorrer el uso esencial completo.** Probar entrada/creación, interacción/edición, persistencia tras recargar y salida/exportación real en un caso representativo. Verificar dependencias, contenido exportado y experiencia esencial del usuario. Aprovechar pruebas previas válidas y **añadir solamente la comprobación que faltaba** para detectar la regresión concreta; no convertir QA en un proyecto infinito.
4. **Tres estados, sin ambigüedad:** (A) *en desarrollo o bloqueado* si hay un fallo funcional conocido, (B) *candidato técnico* si el código y las pruebas representativas aprobadas permiten iniciar la aceptación, (C) *V1.0 aceptada* solamente tras una **aceptación de uso real confirmada por el usuario** o evidencia explícita equivalente que éste haya aprobado para ese frente. Ningún conteo de tests, commit, etiqueta, documentación o ZIP sustituye el estado C. No renombrar candidatos como «terminado» o «entregado» por comodidad.
5. **Los fallos reportados anulan afirmaciones previas de completitud.** Frente a una captura o paso concreto que no funciona, registrar el frente como no aceptado, diagnosticar y resolver el bloqueo antes de pedir otra prueba. No pedir al usuario repetir de nuevo toda la batería; volver a probar primero **ese flujo** con el artefacto realmente entregado.
6. **Avances de impacto, no cierres ficticios.** Resolver en lotes compactos la causa compartida de fallos, sin microetapas cosméticas, nuevos proveedores ni inventar requisitos ajenos al objetivo existente. Solo posponer mejoras **realmente opcionales** para V1.1+, no funciones fundamentales que aún no sirven.
7. **Trazabilidad por frente.** Tras cada «Avanza», informar: qué función real mejoró, qué se probó exactamente y en qué entorno, URL del commit en la rama correcta, qué aún no se verificó y si el usuario debe hacer algo. Mantener la ficha `docs/contexto/` relevante; actualizarla ante una regresión o cambio importante. No crear despliegues Vercel, merges, tags de «listo» ni cambios en los otros frentes salvo autorización explícita.

**Regla de precedencia:** ante textos históricos del tipo «V1.0 cerrada», «entrega lista» o «CI verde», comprobar si hay aceptación real posterior y si surgieron fallos de uso. Sin evidencia, conservar el estado «candidato técnico» (o «bloqueado» si el usuario reportó un error). Este protocolo aplica a los cinco nombres fijos, la rama experimental de 04 y los futuros chats que los continúen.

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

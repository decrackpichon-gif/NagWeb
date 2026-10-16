# NAGWEB 05 | Contrato cerrado para entregar V1.0

**Directiva prioritaria del usuario (15/10/2026): PRIMERO TERMINAR. DESPUÉS MEJORAR.** Esta ficha sustituye los antiguos planes abiertos y estimaciones por etapas. Fuente técnica de verdad: `feat/resource-etl-v1`; catálogo histórico independiente: `resource-vault-data`. Consultar además `AGENTS.md` y `POLITICA_DESARROLLO_V1_PRIMERO.md` en `main`.

## Qué constituye una V1.0 útil y terminada

Un diseñador debe poder **buscar → previsualizar → elegir un recurso compatible → insertar/aplicar → personalizar → volver a editar → guardar/recuperar → exportar** sin perder objetos, estilos ni datos. Lo que no tiene adaptador comprobado debe seguir siendo consultable/copiable, pero **no presentarse como insertable**.

Se conserva lo implementado hasta ahora, sin eliminar opciones existentes: catálogo, licencias y procedencias verificadas; filtros, favoritos, miniaturas, carga progresiva, caché offline parcial; SVG Lucide/Heroicons; HTML/CSS Uiverse/SpinKit compatibles en aislamiento; efectos Magic.css/CSSShake sobre objetos existentes con historial, edición, persistencia y exportación; responsive y accesibilidad esenciales.

**Conteo confirmado en la reconstrucción del índice:** 6762 registros; 6041 clasificados como de uso nativo según sus adaptadores y 721 como consulta/código. La clasificación **no garantiza personalización universal** ni sustituye las pruebas funcionales. Mantener los cinco snapshots originales, hashes/licencias e independencia de ramas.

## Estado comprobado al 15/10/2026

- HEAD de código antes de esta actualización documental: `5a0d006097fabbac3ec6695911563d508e6e2f47` (política general ya registrada).
- Última ejecución completa de Resource ETL CI para código `d9e229f5b51aa6b4c08131dc6f8d60c5bc5389d9`: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38749872518 . **Falló el job Chromium Windows**; aprobaron Chromium Linux, Self test y Windows smoke.
- El fallo Windows ocurrió en `tools/resource-etl/src/resource-browser-smoke.mjs`, cerca de la línea 860: la prueba disparó un evento sintético de doble clic para personalizar un SVG, pero el diálogo no se abrió. **No está demostrado** que la interacción real del usuario esté rota ni que el defecto sea el atajo Alt+Enter. Verificar la ruta de evento real y la prueba; corregir la causa concreta, no deshabilitar sin más la cobertura.
- Reconstrucción del índice `Resource Vault Verified Browse Index` de `d9e229f...`: https://github.com/decrackpichon-gif/NagWeb/actions/runs/38749871198 — **success** con 6762 recursos y recuentos nativos verificables.
- La guía de aceptación ya existe: `docs/contexto/NAGWEB_05_GUIA_PRUEBA_Y_ALCANCE.md`.

## Únicos pendientes obligatorios para V1.0

1. **Eliminar el bloqueo real de QA.** Reproducir y resolver el fallo de la apertura de personalización SVG en Chromium Windows, separando defecto del producto y defecto de la simulación. Reutilizar el control contextual que funciona; no crear una interfaz nueva. Ejecutar **una CI completa para el bloque corregido**; exigir los cuatro jobs en verde y ninguna regresión importante de uso, seguridad o persistencia.
2. **Aceptar el recorrido principal una vez.** En el editor real, probar un SVG, un componente Uiverse/SpinKit compatible y un efecto Magic.css/CSSShake: buscar, personalizar, insertar/aplicar, reabrir, guardar, recargar, deshacer cuando corresponda y exportar. Revisar al menos un tamaño de escritorio y uno móvil; verificar el HTML exportado y los límites offline. Reutilizar pruebas ya existentes; no repetir auditorías aprobadas.
3. **Preparar entrega y declarar el cierre.** Registrar commit definitivo, versión V1.0, resultados reales de CI y aceptación, cómo abrir/ejecutar, familias utilizables y limitaciones de «solo código». Si la aceptación revela un error que bloquea el recorrido, corregirlo en un lote y volver a comprobarlo. De lo contrario, **cerrar V1.0 sin añadir trabajo**.

Estas son condiciones de aceptación, **no tres proyectos nuevos**. Agrupar los puntos cuando sea posible. No declarar V1.0 completada con CI roja ni presentarla como una integración universal que no existe.

## Postergar expresamente a V1.1+

- Nuevos proveedores, aumento de recursos o snapshots, animaciones y controles adicionales sin necesidad de cierre.
- Adaptadores nativos universales para React, Three.js, GLSL y Lottie, importaciones complejas y personalizaciones particulares por plantilla que hoy solo se exploran/copian.
- Rediseños estéticos, nuevas previsualizaciones, filtros secundarios, optimizaciones marginales y expansión de modo offline más allá del funcionamiento acordado.

Estos temas **no se eliminan de la visión original**: quedan para el desarrollo posterior y no bloquean una primera versión funcional. El usuario podrá recuperar cualquiera expresamente.

## Reglas de ejecución para el próximo «Avanza»

Ir directamente al primer bloqueo pendiente en el HEAD actual; realizar cambios agrupados, una verificación integral proporcional y preferiblemente un commit funcional. Si las pruebas quedan verdes, pasar a aceptación y entrega **sin reabrir alcance**. No reconstruir trabajo hecho, no más recuentos de etapas arbitrarios, no commits ceremoniales. No hacer merges, no desplegar Vercel, no modificar otros proyectos.

## Cierre técnico comprobado (16/10/2026)

- **Código estable de referencia:** `dfcd35edf072b6f4f6362374db0c94691137aec9` (rama exclusiva `feat/resource-etl-v1`).
- **CI integral:** https://github.com/decrackpichon-gif/NagWeb/actions/runs/38777181423 — `success`. Aprobados los cuatro trabajos: Self test, Chromium Linux, Chromium Windows y Windows smoke. Las capturas/informes están adjuntos a esa ejecución. El doble clic SVG, selección sin alterar ancho/historial, menú contextual y recorridos reales ya superan ambos Chromium.
- **Catálogo:** `Resource Vault Verified Browse Index` success https://github.com/decrackpichon-gif/NagWeb/actions/runs/38749871198 . Índice publicado con 6762 recursos, 6041 clasificados como nativos por sus adaptadores y 721 de consulta/código; no se recompilaron ni cambiaron sus cinco snapshots.
- **Resultado:** **V1.0 técnicamente validada y candidata de entrega.** No hay bloqueantes automáticos conocidos. La revisión manual breve en Windows por el usuario, según la guía, sigue pendiente: sin ella no afirmar «aceptación manual completada» ni publicar tag/merge/despliegue como definitivo.
- **Instrucciones y límites de la candidata:** `docs/contexto/NAGWEB_05_ENTREGA_V1.0.md`. No añadir funcionalidades mientras se realiza aceptación; si se confirma, declarar V1.0 entregada en la misma rama y, si se pide, crear etiqueta específica `NAGWEB-05-v1.0` sin mezclar proyectos.

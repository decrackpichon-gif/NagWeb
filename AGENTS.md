# Instrucciones para asistentes de desarrollo de NagWeb (índice central)

## Regla prioritaria e innegociable: V1.0 primero

**Entregar rápido un producto V1.0 estable y usable.** Congelar el alcance a la experiencia esencial, corregir bloqueantes de extremo a extremo, probar lo necesario y cerrar. No agregar recursos, variantes, efectos ni microetapas optativas antes de finalizar. Las ideas nuevas se guardan para V1.1+.

Leer la [política universal](POLITICA_DESARROLLO_V1_PRIMERO.md) para el criterio completo. Esta norma rige los cinco frentes y todos los proyectos futuros del usuario, salvo indicación expresa contraria.

## Corrección obligatoria: aceptación real, no solo CI (16/10/2026)

Antes de marcar un frente como V1.0 terminada, aplicar el [protocolo canónico de recuperación y aceptación](POLITICA_DESARROLLO_V1_PRIMERO.md): respetar el progreso existente, probar **el mismo artefacto e inicio que usará el usuario** y el flujo real de crear/editar/guardar/recargar/exportar. CI verde por sí sola = **candidato técnico**, nunca aprobación final. Si el usuario reporta fallos, registrar **no aceptada**, reparar el camino real y pedir una sola comprobación focalizada. El cierre manual no se inventa. Esto prevalece sobre declaraciones históricas de V1.0 y cubre las cinco ramas y 04 experimental.

## Independencia técnica

El archivo README.md identifica las cinco ramas exclusivas y sus contextos. El HEAD de cada rama y sus pruebas son la fuente de verdad; no interpretar main como implementación actual de todos los frentes. No mezclar ramas, no hacer merges ni desplegar en Vercel sin autorización. Mantener la calidad de V1.0, sin confundir velocidad con omitir validación imprescindible.

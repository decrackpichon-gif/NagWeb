# NAGWEB 05 | Criterios de cierre para versión 1

**Rama exclusiva:** `feat/resource-etl-v1`  
**Fuente de verdad:** el código y los commits de esta rama; datos en `resource-vault-data`.  
**Propósito:** evitar desarrollar eternamente funciones adicionales sin un hito de entrega.

## Qué es la v1 que podemos dar por terminada

Una biblioteca que permita **buscar → ver → personalizar → insertar →
volver a editar → guardar → exportar** recursos que ya cuentan con un
adaptador real para NagWeb. Los recursos que hoy son **solo código**
(React, Three.js, GLSL, etc.) pueden permanecer explorables y copiables,
pero tienen que figurar inequívocamente como **no insertables** hasta
completar su adaptador. No se debe confundir `hay un recurso` con
`puedo utilizarlo plenamente en el editor`.

No es un objetivo de v1 importar más proveedores por cantidad, reescribir
otros proyectos, construir un editor React/Three universal ni automatizar
todos los originales con licencia incierta. Esos son posibles avances
posteriores, si el usuario decide ampliar el alcance.

## Condiciones verificables de cierre

1. **Catálogo confiable:** los 6762 registros actuales conservan identidad,
   licencias, proveedor, fuente y checksum. Búsqueda, filtros, favoritos
   y miniaturas funcionan sin descargar todo el código.
2. **Uso real:** SVG Lucide/Heroicons y HTML/CSS Uiverse compatibles cumplen
   inserción, edición contextual, persistencia, responsive y exportación
   sin duplicados ni pérdidas. Los restantes muestran límites claros.
3. **Rendimiento:** índice compacto, cargas de detalle bajo demanda y
   paquetes Uiverse divididos, sin dependencias de imágenes externas ni
   descargas completas para elegir un elemento.
4. **Pruebas de aceptación:** CI sin fallas en Chromium Windows, Chromium
   Linux, tests internos y Windows smoke, más prueba manual guiada de
   insertar, modificar y exportar componentes representativos.
5. **Entrega y continuidad:** guía corta para abrir/probar la Biblioteca,
   limitaciones visibles y ficha de contexto actualizada, sin exigir
   Vercel ni fusiones de ramas para declarar terminado este frente.

## Bloques pendientes después del empaquetado Uiverse

- **A. UX de compatibilidad:** diferenciar recursos insertables, recursos
  de código/previsualización y casos no soportados con mensajes claros.
- **B. QA de recorridos completos:** seleccionar casos reales de SVG y
  Uiverse en escritorio/celular; confirmar persistencia y exportación.
  Corregir los fallos reales encontrados en un mismo lote.
- **C. Cierre v1:** guía de uso, evidencia resumida de las pruebas,
  checklist de criterios anteriores y lista final de limitaciones.

**Límite de alcance:** no crear controles secundarios ni importar nuevas
familias por inercia entre A, B y C. Abrir otro plan únicamente si aparece
un defecto grave o el usuario pide ampliar funcionalidades.

## Lo que queda fuera del primer cierre

Convertir automáticamente todos los recursos de React, Three.js, GLSL
y Lottie en elementos completamente editables del lienzo. La meta mayor
de NagWeb puede incluirlo, pero esa integración requiere capacidades
específicas y coordinar con los otros frentes sin mezclar ramas.
Tampoco se promete compatibilidad con recursos cuyo uso legal no esté
habilitado.

**Estimación de planificación:** tras empaquetar Uiverse, entre
**3 y 5 bloques de trabajo significativos** para intentar una v1
cerrable, sujeto a que QA no descubra fallos graves. No equivalen a
3-5 microetapas de tamaño fijo ni a un plazo garantizado.

**Estado:** documento de definición de cierre. Tener una casilla aquí no
acredita que esté aprobada; usar CI, commits y prueba manual real.

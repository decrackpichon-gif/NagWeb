# Cámara 3D — cierre de implementación en rama separada

Fecha: 16/10/2026. Rama de trabajo: `feat/scroll-camera-finish-v1`.
Base: `6032ebef5f865bd2a0cda684633d8b4a6a7cdd2a` de `feat/scroll-camera-v1`.
No incorpora avances posteriores o paralelos de la rama original. No fusionar automáticamente.

**Actualización de integración:** al contrastar GitHub el 16/10, la rama original
ya está en `a989eb9d904b60b54f07d87f86ccf5a95b4f7152`, ocho commits por delante
de esta base, y declara su V1.0 entregada. Allí se decidió desactivar la oclusión
inversa experimental (`860bcbb`) y se agregó aceptación de persistencia.
Esta variante NO sustituye esa entrega ni es una condición pendiente para V1.0.
El recorte parcial y el mapa ampliado se ofrecen como cambios opcionales posteriores.
Consultar `docs/NAGWEB_03_CAMARA_3D_V1_0_ENTREGA.md` en la rama original.

## Alcance útil de esta versión

Se conserva lo implementado en la base: cámara optativa, encuadres XYZ y orientación,
curvas y objetivo look-at opcionales, mapa superior/frontal/lateral, edición de objetos
HTML/GLB, deshacer y cancelación, guardado/exportación y adaptación de tamaño.
El Director de Scroll conserva la única evaluación de progreso 0→1. El mapa ampliado
llama a su `scrub`; el renderer consume las poses ya evaluadas y no agrega relojes,
Lenis ni ScrollTrigger para conducir la cámara.

Este lote cierra dos problemas concretos:

- **Composición parcial 3D → HTML:** reemplaza la decisión de ocultar un elemento
  entero mediante 25 rayos (y el límite de 12 capas) por profundidad GPU proyectada
  en cada plano HTML compatible. Conserva las partes visibles, los huecos geométricos
  y el DOM real. El recorte CSS también excluye las zonas ocultas del hit testing.
  La matriz incluye el centrado CSS y la pose evaluada del Director, sin sumarlos dos veces.
  El contenedor estructural del mundo deja pasar el mouse a las capas en profundidad.
- **Mapa ampliable:** el editor espacial puede ocupar la ventana, con inspector,
  vistas XYZ y control del mismo momento del Director. Volver/Escape recupera el
  panel compacto. Cambiar de disposición no modifica el proyecto ni el historial.

## Límites cerrados para v1

La composición inversa admite mallas opacas estáticas y planos HTML compatibles.
No representa transparencias de materiales, alphaTest/alphaMap, esqueletos,
morph targets, desplazamiento, shaders personalizados ni clipping 3D. Se omiten
esos objetos para evitar ocultar HTML que debería verse. Tampoco combina el recorte
inverso con clip-path/mask-image propios del HTML ni con jerarquías CSS que aplanan
el espacio o recortan sus hijos. No equivale a un compositor universal del navegador.

La profundidad se limita a 1024 px en el lado mayor de la escena y cada máscara a
256 px en el lado mayor del elemento: el borde puede ser aproximado en elementos
muy grandes. Se reutilizan profundidad y máscaras cuando las poses no cambian;
planos coincidentes comparten lectura. Una escena con muchas capas distintas que
se mueven puede resultar costosa por la lectura GPU→CPU. No se afirma 60 fps ni
validación en teléfonos físicos/Safari. Si falla la lectura, se restaura el DOM,
se liberan recursos y no se reintenta cada frame hasta reconectar.

## Pruebas y revisión

Validación local en Chromium 153 con WebGL por SwiftShader y bibliotecas locales.
Suite espacial completa: **41 comprobaciones aprobadas** (92 s). Smoke histórico
de cámara: **aprobado**. Prueba adicional del slider ampliado: **aprobada**.

- Renderer real en editor, exportación y bloom; GLB real, proyección compartida,
  HTML delante/detrás, alpha y recortes previos, 14 capas, hueco geométrico,
  movimiento sin atraso de frame, reutilización, fallo de lectura y desmontaje.
- Editor espacial real: arrastre, coordenadas, deshacer, cancelación, mapa ampliado,
  cambio de vista, Escape y ausencia de modificaciones al abrir/cerrar el mapa.
- Suites de luces, bloom, interacción, timing, jerarquías y proyección; compatibilidad con progreso del
  Director, movimiento reducido y resize. Ver comandos reproducibles abajo.
- Prueba histórica `nagweb-camera-smoke.mjs`: aprobada, incluyendo runtime exportado,
  resize mobile, look-at y puente 3D. Se interceptaron CDN con las mismas versiones
  locales para ejecutar sin dependencia de red; no se modificó el smoke histórico.

La prueba antigua de cobertura total situaba el plano desplazado medio tamaño
respecto del ancla: se corrigió su ubicación, conservando la comprobación de cubrir,
apartar el modelo y restaurar el DOM. Se añadió además texto real generado para
no depender únicamente de rectángulos sintéticos.

```bash
node .github/nagweb-spatial-vendors.cjs
NAGWEB_TEST_VENDOR_DIR=work/spatial-vendors node .github/nagweb-spatial-smoke.cjs
node .github/nagweb-camera-smoke.mjs
```

Los runners aceptan `NAGWEB_BROWSER` o `NAGWEB_CHROME_PATH` para elegir Chromium.
El smoke histórico requiere servidor HTTP local en el puerto 4173.
No se presenta ningún resultado local como resultado de GitHub Actions.

## Cómo probar la versión

1. Abrir NagWeb y una escena con Director de Scroll. Activar Cámara 3D.
2. Usar el ejemplo autocontenido de texto/imagen/texto disponible en el panel.
3. Abrir el mapa y pulsar **Ampliar editor espacial**. Cambiar entre vistas,
   mover un encuadre u objeto y recorrer el momento del Director. Probar Deshacer.
4. Añadir una caja/modelo opaco delante de un texto: solo su zona cubierta debe
   desaparecer; al apartarlo, el texto debe reaparecer.
5. Exportar y comparar el recorrido, con y sin bloom. Revisar también una ventana
   angosta. Escape o **Volver al panel** cierra la vista ampliada.

## Integración y próximo bloque

El código está preparado como lote revisable, sin integrar otros frentes. Antes de
fusionar con la rama original, comparar sus avances posteriores a la base indicada;
los puntos sensibles son `placeDepthQuad`/`parentSpace`, la composición de profundidad,
el CSS de eventos del mundo y los manejadores del mapa. Resolver cada diferencia
según el contrato del Director, evitando duplicar evaluadores.

La V1.0 original ya está cerrada; no necesita otro bloque obligatorio. El próximo
paso opcional de esta variante es su revisión por el usuario en su navegador
habitual y, si la aprueba, su integración autorizada. No se agregan nuevas funciones
como condición para cerrar v1. Vercel permanece deshabilitado; merge y publicación
requieren autorización separada.

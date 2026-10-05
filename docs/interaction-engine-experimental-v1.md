# NagWeb Interaction Engine · Experimental V1

Rama de I+D: `feat/interaction-engine-experimental-v1`.

Esta rama nació desde `feat/interaction-engine-v1` en el commit `65b1cdb1e1675f24140cb3be1c263b004b9bcb38`.

## Regla de aislamiento

No mergear automáticamente hacia:

- `feat/interaction-engine-v1`
- `feat/storytelling-engine-v2`
- `main`

Organic Mesh V3 sigue siendo la referencia validada. Todo lo desarrollado aquí debe poder compararse contra V3 antes de considerar integración.

## Referencias estudiadas

### Stretchy Studio

Se tomó como idea:

- generación de pesos por vértice;
- proyección de vértices sobre un eje de hueso;
- zona suave de mezcla alrededor de articulaciones;
- separación entre rest pose y pose deformada;
- generación de malla independiente del renderer.

No se copia el producto completo ni su arquitectura de editor.

### Creature WebGL

Se tomó como referencia conceptual:

- varios huesos relevantes por vértice;
- pesos normalizados;
- mezcla de transformaciones;
- separación entre deformación base y desplazamientos adicionales;
- Dual Quaternion Skinning como posible solución futura a pérdida de volumen.

La licencia de Creature requiere revisión específica antes de reutilizar código literal. En esta rama se implementan conceptos propios.

### threejs-path-flow

Se tomó como referencia conceptual:

- representación de una curva mediante posición + frame local;
- tangentes/normales;
- posibilidad futura de mover el cálculo de deformación al vertex shader.

La implementación V4 actual sigue calculando posiciones en CPU. GPU skinning queda para una etapa posterior.

## V4.0 · virtual bones + weighted vertices

Archivo:

`js/nagweb-interaction-organic-v4.js`

Hipótesis:

> Una malla continua con múltiples huesos virtuales y pesos suaves por vértice puede producir transiciones más naturales que las tres zonas corporales de V3.

Configuración inicial:

- 7 huesos virtuales sobre la spine;
- posiciones no uniformes: más resolución en cabeza/cuello y articulaciones principales;
- flexibilidad creciente desde cabeza hacia la parte trasera;
- kernel compacto de pesos;
- máximo 4 influencias por vértice;
- pesos normalizados a 1;
- misma textura continua WebGL que V3;
- mismo follower y preparación de asset.

V4 no reemplaza la spine. La spine sigue siendo la trayectoria global; los huesos son frames locales que deforman la malla alrededor de esa trayectoria.

## V4.1 · rigid 2D blend

El Linear Blend Skinning clásico mezcla las posiciones finales de varios huesos. Cuando dos transformaciones rotan distinto puede reducir volumen.

V4.1 agrega dos modos:

- `lbs`: Linear Blend Skinning clásico, mantenido como referencia;
- `rigid2d`: mezcla la rotación como orientación 2D normalizada y la traslación por pesos antes de transformar el punto.

El objetivo de `rigid2d` es conservar mejor distancia radial/volumen en transiciones entre huesos sin introducir todavía Dual Quaternion Skinning 3D.

No se asume que `rigid2d` sea superior visualmente. Debe verificarse con assets reales.

## Laboratorio A/B

`experiments/organic-skin-v4.html`

Renderiza simultáneamente:

- izquierda: Organic Mesh V3.2;
- derecha: Organic Skin V4.1.

Ambos reciben:

- el mismo asset preparado;
- el mismo objetivo normalizado del cursor;
- el mismo largo;
- la misma ondulación;
- la misma densidad de malla.

V4 permite variar:

- número de huesos;
- radio de pesos;
- influencias máximas;
- `rigid2d` vs `lbs`.

El rig virtual se dibuja sobre V4 como overlay de diagnóstico.

## QA

Archivos:

- `.github/nagweb-interaction-organic-v4-model-test.mjs`
- `.github/nagweb-interaction-organic-v4-browser-smoke.mjs`

Cobertura actual:

- pesos suman 1;
- máximo de influencias;
- continuidad espacial de weights;
- pose recta conserva geometría;
- deformación curvada produce valores finitos;
- cambio dinámico de huesos/radio/influencias;
- WebGL real en Chromium;
- V3 y V4 siguen simultáneamente el mismo cursor;
- `rigid2d` y `lbs` pueden alternarse en runtime;
- test sintético demuestra pérdida radial de LBS y preservación en `rigid2d`;
- screenshots A/B default y tuned.

Runs verdes iniciales:

- #278: V4.0, modelo + navegador.
- #286: V4.0 con screenshot experimental retenido.
- #296: V4.1 + rigid2d + laboratorio A/B limpio.

## Próximo criterio de decisión

Usar `ponjita.png` en `experiments/organic-skin-v4.html` y comparar:

1. continuidad de cuello;
2. estabilidad de cara/cabeza;
3. volumen de torso;
4. deformación de ropa;
5. giros cerrados;
6. recuperación después de cambios bruscos;
7. sensación general de naturalidad.

No avanzar a auto-rig anatómico, DWPose o GPU skinning hasta saber si el principio de weighted bones aporta una mejora real frente a V3.


## Resultado humano de V4.1

La prueba con `ponjita.png` mostró una falla estructural clara del weighted-bone positional skinning:

- en recorridos curvos y giros cerrados;
- cuando frames/huesos virtuales no vecinos se acercaban;
- especialmente en cuello, torso y ropa;

la malla podía plegarse, comprimirse y formar abanicos/triángulos severos.

V3 se mantuvo visualmente mucho más estable bajo las mismas condiciones.

Conclusión: V4.1 queda congelada como experimento de referencia. No se intenta reparar solamente ajustando weights, LBS o rigid2d porque el problema principal es la ambigüedad de mezclar varias posiciones de huesos sobre una spine que puede replegarse.

## V4-B / V4.2 · Weighted Curve

Archivo:

`js/nagweb-interaction-organic-v4b.js`

Cambio de arquitectura:

- cada columna longitudinal de la malla vuelve a tener una única coordenada `u` sobre la spine;
- no se mezclan posiciones finales de varios huesos;
- los controles virtuales generan un campo continuo de `flex` y `bend`;
- los weights modifican comportamiento, no posición;
- cabeza y zonas iniciales permanecen más rígidas;
- la flexibilidad aumenta gradualmente hacia la parte trasera.

Esto conserva la propiedad que hizo robusta a V3: orden longitudinal único.

### Anti-fold guard

V4-B agrega detección entre segmentos no vecinos de la spine.

El guard:

1. calcula distancia mínima entre pares de segmentos;
2. ignora vecinos cercanos en índice;
3. si dos ramas se aproximan por debajo de un umbral relativo al largo de segmento, desplaza conservadoramente la rama posterior;
4. resegmenta la spine;
5. vuelve a aplicar límites de curvatura;
6. repite pocas iteraciones.

El objetivo no es impedir curvas cerradas, sino evitar cruces y compresiones que generan folds geométricos.

### Laboratorio

`experiments/organic-weighted-curve-v4b.html`

Compara en paralelo:

- V3.2 estable;
- V4-B Weighted Curve.

Expone:

- cantidad de controles virtuales;
- radio de weights;
- anti-fold ON/OFF;
- distancia de protección;
- fuerza de corrección.

El overlay muestra la spine y posiciones de controles de V4-B.

### QA

- test sintético de segmentos que se cruzan;
- validación de que anti-fold aumenta separación no vecina;
- pesos normalizados;
- campos flex/bend continuos;
- pose recta estable;
- una sola frame longitudinal por columna;
- browser smoke Chromium/WebGL;
- recorrido curvo automatizado;
- controles live;
- screenshot A/B.

Run verde inicial: **#368**.

Próxima decisión: prueba humana con `ponjita.png`. V4-B sólo continúa si reduce claramente las rupturas observadas en V4.1 y mantiene al menos la continuidad visual de V3.

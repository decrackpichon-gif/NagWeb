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


## V4-C / V4.3 · Adaptive Curve por silueta

Archivo:

`js/nagweb-interaction-organic-v4c.js`

V4-C mantiene la arquitectura estable de V4-B:

- una sola posición longitudinal `u` por columna;
- sin mezcla posicional de huesos;
- anti-fold guard intacto.

La novedad es que el asset preparado se analiza automáticamente después de ser rotado a su eje y recortado.

### Perfil de silueta

El módulo escanea alpha a lo largo del eje longitudinal y calcula:

- ancho local;
- ocupación alpha;
- centro transversal;
- gradiente de ancho;
- ancho normalizado respecto del máximo.

El perfil se suaviza y se remapea a `u=0..1`, con extremos anclados exactamente a 0 y 1.

### Adaptación

A partir del perfil se derivan automáticamente controles de:

- `flex`;
- `bend`.

Principios actuales:

- zonas anchas reciben más rigidez relativa;
- zonas finas pueden recibir algo más de flexibilidad;
- transiciones bruscas de ancho se estabilizan;
- la región inicial/cabeza conserva un lock adicional;
- el resultado sigue respetando una progresión global de personaje.

No se altera la posición longitudinal ni se introduce skinning multi-bone.

### Presets

La interfaz expone tres presets comprensibles:

- `Personaje`;
- `Criatura`;
- `Forma blanda`.

Los parámetros técnicos siguen disponibles en el módulo, pero el laboratorio no obliga al usuario a manipularlos.

### Diagnóstico

`experiments/organic-adaptive-curve-v4c.html`

El overlay diagnóstico muestra:

- spine;
- controles adaptativos;
- barra transversal proporcional al ancho de la silueta;
- color aproximado de rígido → flexible;
- nodos mayores en transiciones fuertes.

Esto permite verificar visualmente que el análisis automático coincide con la forma del asset.

### QA

- perfil alpha sintético con zonas anchas/finas;
- detección de cambios de grosor;
- adaptación distinta de baseline en múltiples controles;
- wide regions relativamente más rígidas que thin regions;
- `adaptiveStrength=0` recupera baseline;
- presets generan campos diferentes;
- recorrido curvo Chromium/WebGL;
- anti-fold heredado de V4-B;
- diagnóstico ON/OFF;
- screenshot A/B.

El primer run V4-C (#373) falló porque el centro del primer bin de muestreo producía `u=0.0031` en vez de 0. Se corrigió el algoritmo anclando explícitamente los extremos del perfil.

Run verde: **#374**.

Próximo criterio de decisión: comparar con `ponjita.png` contra V3, usando primero preset `Personaje`. V4-C sólo continúa si mantiene la integridad de V4-B y aporta una diferencia visual útil en cuello, torso/ropa o transiciones de volumen.


## Resultado humano de V4-C y V4-C.1

La prueba humana con `ponjita.png` mostró que V4-C mantenía mejoras adaptativas, pero todavía podía romper la textura en curvas muy cerradas.

Las capturas evidenciaron un caso distinto de V4.1:

- la spine central podía seguir siendo válida y no cruzarse;
- sin embargo, el radio de curvatura local podía ser menor que el semiancho visible del personaje;
- en ese caso, el borde interno de la malla se comprimía, invertía o superponía;
- el fallo aparecía especialmente en zonas anchas de ropa/túnica.

Conclusión: el anti-fold de V4-B, basado en separación entre segmentos no vecinos de la spine, no alcanza por sí solo. Hace falta considerar el grosor físico de la silueta.

### V4-C.1 · thickness-aware curvature guard

Versión del módulo:

`4.3.1-alpha.1`

Se agrega un guard geométrico local:

1. obtiene el ancho visible de silueta en cada `u`;
2. lo convierte a semiancho relativo de la malla renderizada;
3. estima el máximo cambio angular seguro por segmento;
4. limita `controlBend` localmente si la curva solicitada excede ese valor;
5. permite que los límites de bend/flex bajen de nuevo en zonas posteriores anchas.

La fórmula se basa en la condición aproximada de offset curve:

`Δθ < segmentLength / localHalfWidth`

con margen configurable.

Opciones nuevas:

- `thicknessGuard`
- `curvatureMargin`
- `minSafeBend`
- `maxSafeBend`

V4-B conserva su comportamiento original por defecto. Sólo V4-C activa `preserveLocalControlDips=true`.

### Diagnóstico actualizado

El laboratorio marca en rojo los controles donde el guard de grosor está limitando la curvatura.

Esto permite distinguir:

- adaptación normal de silueta;
- anti-fold de la spine;
- límite físico por grosor.

### QA

Se agregaron tests que verifican:

- zonas anchas reciben un `safeBend` menor que zonas finas;
- controles marcados como `geometryCapped` nunca superan su límite local;
- V4-B sigue monotónico por defecto;
- V4-C puede conservar dips locales de flex/bend cuando son necesarios por silueta;
- browser smoke confirma activación real del guard en el asset de fallback.

Run verde: **#391**.

Próximo criterio de decisión: repetir con `ponjita.png` las mismas curvas cerradas que rompían V4-C y verificar si desaparecen las inversiones de textura sin volver el movimiento excesivamente rígido.


## Roadmap de producto · Scene Composer

La validación de Organic Adaptive Curve V4-C.1 abre una segunda línea de trabajo que no debe resolverse dentro del renderer del personaje: la composición de escenas interactivas.

El contenido fijo actual del Interaction Studio (título, párrafo y botón) se considera solamente un fixture de laboratorio. No debe convertirse en la UX final.

### Objetivo

Construir un compositor de escena donde el usuario pueda agregar y editar libremente:

- personaje interactivo;
- texto editable;
- imágenes;
- botones;
- fondos;
- formas y bloques;
- contenedores/grupos;
- otros elementos interactivos compatibles con NagWeb.

Cada elemento debe tener posición, tamaño, rotación, escala, orden de capas y propiedades visuales editables.

### Contrato de interacción por elemento

La reacción al personaje no debe estar implícita ni depender de clases CSS prefijadas.

Cada objeto de escena debe poder declarar una configuración de interacción propia, con un contrato serializable similar a:

```js
{
  id: "scene-element-123",
  reactsToCharacter: true,
  influence: {
    mode: "push",
    strength: 0.7,
    radius: 140,
    move: true,
    rotate: 0.25,
    scale: 0.05,
    returnSpeed: 0.8
  }
}
```

El nombre y shape final del schema quedan abiertos, pero debe cubrir como mínimo:

- activar/desactivar reacción;
- fuerza;
- radio;
- desplazamiento;
- rotación;
- escala;
- velocidad de retorno;
- prioridad o peso;
- posibilidad futura de modos alternativos como push / attract / orbit / avoid.

### Separación de responsabilidades

El renderer del personaje no debe conocer la UI del compositor.

Responsabilidades:

**Character Engine**
- deformación;
- follower;
- spine;
- silueta;
- anti-fold;
- thickness guard;
- exposición de geometría corporal útil para interacción.

**Influence Engine**
- calcula proximidad/cuerpo completo;
- swept influence;
- respuesta por target;
- spring return;
- canales move/rotate/scale.

**Scene Composer**
- crea/borra/duplica elementos;
- edita contenido;
- transforma objetos visualmente;
- ordena capas;
- selecciona qué objetos reaccionan;
- configura reacción por elemento;
- serializa/restaura la escena.

### Integración futura

No integrar este compositor directamente sobre la rama principal hasta que:

1. V4-C.1 quede consolidada con varios assets;
2. exista un contrato estable entre Character Engine e Influence Engine;
3. la escena pueda serializarse sin depender de DOM generado manualmente;
4. el compositor funcione primero como laboratorio aislado.

La primera versión del Scene Composer debe ser un experimento separado, no una reescritura del editor principal.

### Criterio UX

La configuración técnica avanzada debe poder existir, pero la interfaz principal debería hablar en términos comprensibles:

- Reacciona al personaje
- Intensidad
- Distancia
- Movimiento
- Giro
- Escala
- Retorno
- Preset de reacción

El usuario no debería necesitar entender springs, segment distances o pesos de vértice para componer una escena.

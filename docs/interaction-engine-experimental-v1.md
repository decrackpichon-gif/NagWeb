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


## Consolidación V4-C.1 · multi-silueta

Además de la validación humana positiva con `ponjita.png`, V4-C.1 ahora se prueba contra perfiles alpha sintéticos de formas distintas:

- humanoide con cabeza fina, torso medio y ropa ancha;
- figura alta y delgada;
- criatura con masa central flexible;
- blob ancho / forma blanda.

El test valida:

- perfiles alpha finitos;
- controles flex/bend finitos;
- activación del thickness guard;
- respeto de `safeBend`;
- campos de curvatura diferentes para siluetas diferentes;
- límite geométrico más estricto en regiones anchas que en regiones finas.

Archivo:

`.github/nagweb-interaction-v4c-assets-model-test.mjs`

Esto no reemplaza la prueba humana con assets reales, pero reduce el riesgo de sobreajustar V4-C.1 únicamente a `ponjita.png`.

## Scene Composer V1 · implementación inicial

El roadmap de Scene Composer ya tiene una primera implementación funcional aislada.

Archivos:

- `js/nagweb-scene-composer-v1.js`
- `js/nagweb-scene-composer-view-v1.js`
- `js/nagweb-scene-composer-app-v1.js`
- `experiments/scene-composer-v1.html`

### Modelo serializable

Schema:

`nagweb-scene-composer` · version 1

La escena conserva:

- tamaño y fondo del stage;
- configuración del personaje;
- colección de elementos;
- posición;
- tamaño;
- rotación;
- escala;
- orden Z;
- opacidad;
- contenido;
- estilo;
- configuración individual de influencia.

Tipos iniciales:

- texto;
- botón;
- imagen;
- forma;
- fondo.

### Interacción por elemento

Influence Engine experimental sube a `1.7.0`.

Cada target puede configurar:

- enabled;
- weight;
- radiusScale;
- move;
- rotate;
- scale;
- returnSpeed.

`radiusScale` permite que dos objetos dentro de la misma escena tengan distancias de reacción distintas sin crear un Influence Field separado para cada uno.

### UI inicial del compositor

El laboratorio permite:

- cargar personaje;
- cambiar tamaño y preset del personaje;
- agregar texto / botón / imagen / forma / fondo;
- seleccionar desde canvas o lista de capas;
- arrastrar elementos;
- editar texto;
- cargar imágenes;
- cambiar tamaño;
- rotar y escalar;
- editar color y fondo;
- editar orden Z y opacidad;
- activar/desactivar reacción;
- configurar intensidad, distancia, movimiento, giro, escala y retorno;
- duplicar;
- eliminar;
- exportar escena a JSON;
- restaurar escena desde JSON.

El personaje usa Organic Adaptive Curve V4-C.1 y los elementos reactivos usan el cuerpo completo como fuente del Influence Field.

### QA Scene Composer

Cobertura actual:

- modelo y roundtrip JSON;
- IDs estables;
- add/update/remove/duplicate;
- atributos DOM de interacción;
- carga real en Chromium;
- V4-C.1 + Influence 1.7;
- agregar y editar texto;
- radio individual;
- activar/desactivar reacción;
- drag;
- duplicado;
- orden Z;
- opacidad;
- export/import JSON;
- reacción física a la cercanía del personaje;
- screenshot automático.

El Composer sigue siendo un laboratorio experimental y no se integra todavía al editor principal.

## Scene Composer V1.1 · reconciliación incremental

El laboratorio conserva ahora los nodos de escena por ID entre ediciones y selecciones. En lugar de destruir y recrear el campo de influencia con cada cambio de inspector, se conserva la instancia y su suscripción de frames. `setTargets()` reconcilia los objetos por referencia DOM, actualiza propiedades de reacción sin borrar la velocidad/posición del resorte en targets retenidos y restaura exclusivamente los objetos eliminados o desactivados.

Las mediciones geométricas se limitan a targets nuevos o cuyo cuadro cambió; el arrastre mide el target desplazado, y `ResizeObserver` conserva la cobertura global de redimensionamiento. El cambio de radio/intensidad global actualiza opciones sobre el campo existente. Se mantiene la separación entre V3 estable y V4-C.1 experimental, sin integración al editor principal.

El browser smoke comprueba identidad estable del campo y del nodo tras selección, edición de reacción, alta y desactivación de targets. La comparación visual V3/V4-C.1 con personajes reales continúa pendiente.


## A/B de recorrido compartido · Organic Review V1

Se extiende el laboratorio existente \`experiments/organic-adaptive-curve-v4c.html\` con \`js/nagweb-interaction-ab-review-v1.js\`. Sin introducir un motor nuevo, los seguidores de V3 y V4-C.1 reciben la misma secuencia de objetivos normalizados mediante \`setTarget\`. Hay dos recorridos: giros cerrados/reversas y curvas suaves, con duración de 4,2 u 8 segundos.

La herramienta muestra progreso, permite detener, exporta un JSON con asset/preset, trayectoria y muestras de ambos motores (finitud de puntos, máximo cambio angular local, mínimo largo de segmento, controles limitados por grosor y conflictos anti-fold). El movimiento real se integra con frames del navegador, de modo que dos repeticiones comparten trayectoria y tiempos objetivo, pero **no garantizan igualdad cuadro por cuadro**. Las métricas sirven para detectar señales de riesgo; no demuestran calidad estética ni ausencia de inversión de polígonos.

El browser smoke reproduce un recorrido de giros cerrados con el fixture SVG interno, captura una imagen intermedia y valida que ambas spines produzcan datos finitos. También prueba la cancelación durante un recorrido suave. La evaluación humana con \`ponjita.png\` y otros PNG reales permanece pendiente: el archivo original no está incluido en la rama ni se agrega al repositorio. Se mantienen ambas ramas de Interaction Studio aisladas, sin integrar cambios al editor principal.

## A/B asset loading · aislamiento de tareas

La carga de personajes del laboratorio V3/V4-C.1 utiliza un objeto `Image` nuevo y un token creciente por selección. Las resoluciones y errores de análisis/preparación anteriores se ignoran, de modo que cambiar rápidamente de archivo no instala una imagen obsoleta ni sobreescribe el preview. La preparación vigente instala ambas variantes sobre el mismo canvas preparado, deteniendo un recorrido A/B activo al cambiar el asset. Se agregó una prueba de navegador con resoluciones asíncronas fuera de orden, que valida que una falla antigua no reemplace el renderer y que la carga más reciente prevalezca.

## V4-C.1 · protección transversal adicional

Se agrega una protección local de las filas de la malla, independiente de la protección de la spine. Si el cambio de normal entre dos columnas amenaza con invertir el desplazamiento del borde interior, el renderer reduce sólo la escala transversal de la región y suaviza las columnas vecinas. La cota considera el ancho visible del perfil alpha. La función es opcional y desactivada por defecto en V4-B, mientras V4-C.1 la activa con `thicknessGuard`. No modifica la trayectoria de la spine ni las UV. El laboratorio A/B exporta las columnas limitadas y la escala mínima como diagnóstico. No garantiza ausencia global de pliegues ni constituye validación visual con personajes reales. Las pruebas incluyen casos sintéticos de curva cerrada y pose recta, y una comprobación de movimiento a lo largo del recorrido que no depende de la posición final.

## A/B visual geometry inspection · Mesh Diagnostics V1

El laboratorio V3/V4-C.1 agrega diagnóstico real de triángulos de la malla de V4-C.1 (no se deduce de la spine): cantidad de triángulos invertidos según el winding longitudinal de referencia, triángulos casi colapsados (menos de 2,5 % del área de celda recta), coordenadas inválidas y área mínima normalizada. La medición se calcula en V4-B sólo cuando se solicita `meshDiagnostic: true`; por defecto queda apagada para evitar trabajo por frame, sin alterar el renderer ni la rama estable. V4-C.1 la expone como `meshDiagnostics` y la activa en el laboratorio A/B, no de manera generalizada en Scene Composer.

El informe JSON del recorrido añade las mediciones por muestra y totales de alertas. Las capturas automatizadas en Chromium se guardan alrededor de 25 %, 50 % y 75 % del recorrido y se agrega el JSON al artefacto visual de GitHub Actions. El kit humano incluye el script A/B, que antes no se copiaba. Los triángulos analizados incluyen zonas transparentes de la textura: son un indicador técnico de riesgo, **no un detector concluyente de defectos visibles** ni una comparación píxel a píxel. V3 permanece como referencia visual sin modificación. Evaluación pendiente con PNG originales (`ponjita.png`), no incluidos en el repositorio.

## Scene Composer V1.2 · manipulación directa

El lienzo editable permite redimensionar mediante un tirador en la esquina inferior derecha y rotar mediante un tirador superior. La selección continúa por canvas o capas, el arrastre existente se conserva y todos los cambios escriben las mismas propiedades `width`, `height` y `rotation` del documento serializable. Manteniendo `Shift` al redimensionar se conserva la relación de aspecto; al rotar ajusta en incrementos de 15°. El inspector numérico refleja los cambios durante el gesto. Los elementos bloqueados no admiten arrastre ni transformaciones y no muestran tiradores; se incorpora la casilla «Bloquear edición sobre el lienzo».

Las transformaciones actualizan el nodo existente sin destruir el campo de influencia ni reiniciar los resortes de los demás objetos. Los tipos, el esquema JSON, el motor orgánico y la rama estable no se modifican. La prueba de navegador comprueba resize, giro, sincronización del inspector, identidad del campo y bloqueo/desbloqueo. **Pendiente:** diseño y prueba humana de los tiradores con personajes PNG reales, y posteriormente ergonomía de zoom en lienzos grandes.

## Scene Composer V1.3 · navegación de lienzos grandes

La escena se puede ampliar al 25–250 %, restablecer al 100 % y encajar en la ventana sin modificar el documento serializado. La barra de navegación incorpora botones ±, `Encajar`, `100 %`; `Ctrl`/`Cmd` + rueda hace zoom alrededor del puntero, `Espacio` + arrastrar o botón central desplaza la superficie sin seleccionar capas. Los tiradores y el arrastre convierten desplazamientos en pantalla a coordenadas lógicas mediante el factor de zoom.

La vista usa `stageSpace` para conservar el área de scroll y `interactionSpace` con transformación inversa para que el motor orgánico y la cámara WebGL sigan midiendo el lienzo en coordenadas lógicas, mientras el cursor se proyecta de pantalla a escena y la fuente del campo de influencia se proyecta de escena a pantalla. El radio se adapta al zoom, manteniendo el mismo alcance proporcional en el lienzo. Esto evita cambios al motor compartido y mantiene V3 estable y el JSON intactos. Las comprobaciones en Chromium cubren zoom, geometría, posición por arrastre, paneo, preservación de escena y campo de influencia.

# NagWeb Interaction Engine V1

Motor aislado para estudiar y estabilizar interacciones de seguimiento antes de integrarlas al editor principal.

## V1.4 — follower + preparación local + campo de influencia

La rama `feat/interaction-engine-v1` sigue sin modificar archivos del editor. El laboratorio puede usar cualquier PNG, JPG, WebP o GIF local.

### Capacidades

- seguimiento con inercia y límite de velocidad;
- seis presets: Suave, Flotante, Ágil, Pesado, Magnético y Personaje;
- dirección frontal del asset: derecha, abajo, izquierda o arriba, o cualquier ángulo numérico por API;
- distancia configurable respecto del cursor;
- orientación opcional hacia el puntero;
- suavizado de giro;
- tilt 3D;
- escala sutil en función de la velocidad;
- idle automático;
- modo de borde libre o contenido, teniendo en cuenta dimensiones reales del recurso;
- salida del puntero configurable: idle, mantener destino o volver al centro;
- pausa de cálculo mientras la pestaña está oculta;
- `ResizeObserver` para reaccionar a cambios reales de tamaño del asset y del área;
- pausa/reanudación y estado de lifecycle consultable;
- targets manuales en coordenadas globales o relativas al área;
- `prefers-reduced-motion`;
- configuración serializable y validada;
- API independiente de globals de NagWeb;
- un único `requestAnimationFrame` compartido por todas las instancias;
- seguidores pausados u ocultos salen del ticker;
- tamaño y límites se actualizan por eventos/observers, no mediante lecturas de layout en cada frame;
- métricas internas `runtimeStats()` para detectar fugas.

### Dirección frontal

`assetForwardAngle` describe hacia dónde mira el archivo sin transformaciones:

- `0`: derecha;
- `90`: abajo;
- `180`: izquierda;
- `-90`: arriba.

El motor compensa ese ángulo al orientar el recurso. Así una ilustración no necesita rotarse previamente en Photoshop.

### Presets

```js
follower.applyPreset('character', {
  assetForwardAngle: -90
});
```

Los presets son puntos de partida. Cualquier edición posterior convierte la configuración en personalizada.

### Persistencia

```js
const json = follower.serialize();
const options = NAGWEB_INTERACTION_ENGINE.deserializeOptions(json);
```

El paquete usa el esquema `nagweb-interaction-follower` versión 1. Datos de runtime como nodos DOM no se serializan.

### API

```js
const follower = NAGWEB_INTERACTION_ENGINE.createFollower(element, {
  area: container,
  preset: 'character',
  assetForwardAngle: 0,
  distanceFromPointer: 54,
  edgeMode: 'contain',
  edgePadding: 10
});
```

## Qué sigue sin integrarse

Esta rama todavía no agrega botones, paneles o tipos de elemento al editor principal. El tamaño del recurso se prueba en el laboratorio pero seguirá siendo una propiedad visual del elemento de NagWeb, no del motor de física.

## QA aislado

La rama incluye `nagweb-interaction-v1-model-test.mjs` y un smoke de Chromium que abre el laboratorio real, mueve el puntero, cambia preset, dirección, tamaño y bordes, prueba pausa/reanudación, crea un segundo follower, serializa la configuración y comprueba `destroy()`. Un workflow propio ejecuta estas pruebas sin lanzar el smoke completo de NagWeb.

## Próxima micro-etapa

Preparación del asset: análisis local de transparencia, dimensiones, silueta y eje predominante para que NagWeb pueda recomendar automáticamente qué tipo de interacción conviene.


## Preparación local del asset

`nagweb-interaction-asset-prep-v1.js` analiza la imagen enteramente en el navegador:

- transparencia y calidad del borde transparente;
- caja real de la silueta;
- centroide;
- eje principal;
- elongación;
- advertencias de resolución/ocupación;
- recomendación inicial entre follower rígido y candidato orgánico.

Si la silueta transparente es confiable, el laboratorio puede recortar automáticamente márgenes transparentes preservando la resolución original. Una imagen opaca no se inventa como transparente: se marca explícitamente como candidata a eliminación de fondo en una etapa posterior.

## Campo de influencia

`nagweb-interaction-influence-v1.js` permite que el follower afecte elementos DOM cercanos mediante desplazamiento, rotación y escala con retorno elástico. Usa el mismo ticker del motor principal, de modo que no crea otro bucle de animación.

El laboratorio lo demuestra sobre letras independientes detrás del recurso. Radio, fuerza y desplazamiento máximo son editables y la configuración se incluye en el paquete JSON portable.

## Estado de integración

Sigue deliberadamente aislado. El PR draft #2 existe sólo como superficie de QA y está marcado **do not merge**. Su workflow prueba el módulo sobre el merge sintético con la rama `feat/storytelling-engine-v2`, por lo que detecta incompatibilidades con el NagWeb que avanza en paralelo sin incorporar estos archivos al producto.


## Preparación automática end-to-end

`nagweb-interaction-preparation-v1.js` une las piezas anteriores en un flujo único pensado para la experiencia final de NagWeb:

1. analiza el asset localmente;
2. puntúa compatibilidad de 0 a 100;
3. si el fondo no está preparado, puede invocar el adaptador IA únicamente cuando está permitido;
4. vuelve a analizar el resultado;
5. recorta transparencia automáticamente cuando la silueta es fiable;
6. genera el perfil portable del asset;
7. recomienda `follower` u `organic` con nivel de confianza.

El pipeline no hace obligatoria la IA. Un PNG/WebP transparente bien preparado pasa por análisis + recorte sin red. Una imagen opaca puede seguir funcionando con `follower`; la IA sólo se usa para mejorar la preparación cuando el usuario lo autoriza.

El laboratorio `experiments/preparation-pipeline-v1.html` expone el flujo como futura experiencia de producto: **subir → preparar automáticamente → revisar compatibilidad → usar**.

### Semáforo de compatibilidad

- **Excelente**: 90–100.
- **Buena**: 72–89.
- **Requiere revisión**: 50–71.
- **No preparada**: menos de 50.

Una puntuación baja nunca bloquea artificialmente el modo rígido. La recomendación segura continúa siendo `follower` cuando no hay una silueta suficientemente fiable para deformar.

### Estado de madurez

El pipeline sigue en laboratorio y no se conecta todavía al editor. Para considerarlo listo faltan pruebas con un banco diverso de assets reales, cancelación del proceso IA, manejo de archivos muy grandes, persistencia del asset preparado y UX de corrección manual de la recomendación.


## Robustez de preparación — V1.1

La preparación automática ahora trata el archivo original como inmutable. Toda operación trabaja sobre una copia lógica o visual y el resultado conserva `originalImage`; un fallo de IA, una cancelación o una recomendación rechazada nunca reemplazan el recurso fuente.

Se agregaron:

- validación temprana de formato y peso;
- advertencia para archivos pesados y límite configurable;
- límite de megapíxeles para evitar picos extremos de memoria;
- copia reducida sólo para la entrada de IA cuando el asset es demasiado grande;
- cancelación cooperativa durante carga/inferencia y también entre etapas locales;
- fallback al original si la IA falla;
- reporte explícito de IA intentada/usada/fallback;
- override manual `auto | follower | organic`;
- advertencia si se fuerza Orgánico sin una silueta confiable;
- botón **Restaurar original** permanente en el laboratorio.

La cancelación de modelos en navegador es cooperativa: JavaScript no puede detener a mitad de instrucción una inferencia ya entregada al backend WebGPU/WASM, pero el resultado posterior se invalida y no se aplica. Esto evita cambios tardíos sobre el asset o la interfaz.


## Calibración visual del eje orgánico — Asset Prep 1.2 / Organic 2.1

Para recursos orgánicos NagWeb ya no presupone que el asset viene horizontal ni que la cabeza está a la derecha.

El análisis propone automáticamente dos anclajes normalizados sobre el eje principal de la silueta:

- **COLA**: extremo trasero;
- **CABEZA**: extremo que lidera.

El laboratorio permite arrastrar ambos puntos directamente sobre la miniatura, restablecer la detección automática o invertir la dirección con un clic. El perfil guarda `trailAnchor`, `leadAnchor`, `axisAngle` y `directionSource` (`auto` o `manual`).

Organic Follower 2.1 usa ese ángulo para rotar una copia del recurso antes de segmentarla. Internamente el extremo de CABEZA queda normalizado hacia la derecha, por lo que el renderer puede mantener una única convención estable aunque el archivo original venga vertical, diagonal o invertido.

Los perfiles V1 antiguos que no contienen anclajes se migran al abrirse: los puntos se reconstruyen a partir del centroide, la caja de silueta y el eje principal guardados.

### QA de cierre de esta micro-etapa

El run **#96** del workflow `NagWeb Interaction Engine V1` pasó:

- todos los model tests;
- smoke de Interactive Follower;
- smoke de Organic Follower 2.1, incluyendo arrastre real de CABEZA/COLA;
- smoke del adaptador IA;
- smoke del pipeline de preparación robusta;
- generación de capturas de laboratorio.

La rama sigue siendo laboratorio y el PR #2 continúa siendo **do not merge**.


## Interaction Studio V1 — flujo unificado

Se agregó `experiments/interaction-studio-v1.html` como laboratorio end-to-end. Su objetivo es probar la experiencia completa antes de cualquier integración con el editor principal.

El flujo cubre:

1. carga de PNG/JPG/WebP o asset demo;
2. validación y preparación automática partiendo siempre del original inmutable;
3. IA de fondo opcional;
4. recomendación automática Follower/Organic;
5. calibración visual CABEZA/COLA para Orgánico;
6. cambio manual de modo y fallback seguro a Follower;
7. presets de movimiento, tamaño, distancia al cursor y orientación frontal del asset;
8. controles orgánicos de flexibilidad/ondas;
9. campo de influencia sobre elementos HTML cercanos;
10. exportación de una configuración portable.

También se agregó `nagweb-interaction-session-v1.js`, que define el contrato `nagweb-interaction-session`. La sesión conserva comportamiento, perfil del asset, reporte de preparación y opciones de influencia, pero **no embebe los bytes de la imagen**. Eso permite desacoplar la configuración del almacenamiento final de assets.

### QA

El run **#102** pasó todos los model tests y browser smokes, incluyendo:

- Interaction Engine;
- Asset Prep 1.2;
- Influence Field;
- Organic Follower 2.1;
- Background AI;
- Preparation Pipeline 1.1;
- Interaction Session V1;
- Interaction Studio V1.

El Studio sigue siendo una superficie de laboratorio. No se agrega navegación ni UI al editor principal hasta alcanzar la etapa de integración final.


## Organic Mesh V3 — estado validado

La línea V2.x basada en slices queda conservada únicamente como referencia y fallback. El motor orgánico principal de laboratorio pasa a ser **Organic Mesh V3**, basado en WebGL y una única textura deformada sobre una malla continua de vértices compartidos.

### V3.0 — malla continua

- textura única, sin rebanadas independientes;
- topología configurable por columnas/filas;
- deformación siguiendo spine;
- cabeza protegida frente a giros cerrados;
- comparación A/B con Slices V2.2 dentro del Studio;
- fallback a V2.2 si WebGL no está disponible.

La prueba humana con un personaje vertical mostró una mejora visual fuerte respecto de V2.2, especialmente en continuidad de bordes y curvas internas.

### V3.1 — zonas corporales

La malla ya no usa una única transición rígido/flexible. Se definen tres regiones suaves:

- cabeza;
- torso;
- parte inferior.

Cada región tiene pesos independientes de flexibilidad y límites de curvatura. Los valores se interpolan para evitar quiebres entre zonas.

El Studio ofrece perfiles `Personaje`, `Criatura flexible` y `Cinta / forma blanda`, más ajuste manual de rigidez. Los límites de cabeza y torso también pueden arrastrarse directamente sobre la miniatura del asset.

La preparación automática recomienda de forma conservadora un perfil inicial a partir de orientación y elongación. La recomendación siempre puede sobrescribirse manualmente.

### V3.2 — robustez WebGL

- adaptación de texturas grandes al menor valor entre el límite configurado y `MAX_TEXTURE_SIZE` de la GPU;
- reescalado con smoothing de alta calidad sin alterar proporciones;
- información diagnóstica de textura disponible en el renderer;
- detección de pérdida de contexto WebGL;
- fallback automático del Studio a Slices V2.2 ante pérdida de contexto.

### V3.3 — persistencia real

Interaction Session V1.2 conserva:

- modo;
- renderer orgánico;
- perfil corporal;
- tamaño visual;
- opciones del follower;
- opciones V3 y límites de zonas;
- campo de influencia;
- perfil del asset;
- reporte de preparación.

El Studio permite generar JSON y volver a aplicarlo sobre el asset actual. El smoke de navegador verifica un ciclo completo de exportación, modificación y restauración.

### QA acumulado

Los runs más recientes pasan model tests + browser smoke para:

- Interaction Engine;
- Asset Prep;
- Influence Field;
- Organic V2.2;
- Organic Mesh V3.2;
- Background AI;
- Preparation Pipeline 1.2;
- Interaction Session 1.2;
- Interaction Studio con zonas visuales, fallback WebGL y restore de sesión.

La integración con NagWeb principal continúa bloqueada intencionalmente hasta completar el laboratorio y la prueba humana final.


## V3.4 · Influencia corporal de contenido real

El campo de influencia deja de tratar al personaje como un único punto.

### Influence Field 1.2

- `sourceMode=body` usa la spine completa del renderer orgánico;
- swept-body conserva el recorrido entre frames para evitar tunneling cuando el personaje cruza un elemento a alta velocidad;
- saltos grandes quedan limitados por `maxSweepDistance` para no empujar toda la página tras un teleport de puntero;
- `sourceRadius` aproxima el grosor físico del asset además del radio de influencia visual;
- el Studio permite comparar cuerpo completo contra cabeza/cursor.

### Influence Field 1.3

Los objetivos pueden declarar `data-nw-influence-weight`.

Esto permite que distintos elementos reaccionen con intensidades distintas sin crear varios campos:

- letras del hero: 1.0;
- palabras de texto corrido: 0.52;
- CTA: 0.72.

El peso escala desplazamiento, rotación, escala y fuerza, conservando el retorno elástico común.

### Interaction Studio 1.8

El escenario de prueba ya no se limita a `MOVE WITH ME`. Incluye un bloque similar a una sección web real con eyebrow, título, párrafo y CTA. Puede alternarse entre:

- sólo título;
- título + contenido.

El QA comprueba cantidad de objetivos, pesos diferenciados, swept body, radio corporal, persistencia del escenario y compatibilidad con Session 1.3.

El run **#197** pasó model tests y browser smokes para esta implementación antes del commit documental.


## V3.5 · Selección visual de objetivos reactivos

El Interaction Studio deja de depender sólo de presets globales de objetivos.

### Influence Field 1.4

Cada objetivo puede tener un ID estable mediante `data-nw-target-id` y su intensidad puede actualizarse en caliente con `setTargetWeight(id, weight)`, sin recrear el campo completo.

La API también expone IDs y pesos activos para QA e integración futura.

### Interaction Session 1.4

La sesión preserva una selección personalizada de objetivos:

- `id`;
- `enabled`;
- `weight` entre 0 y 2.

El escenario puede ser `headline`, `all` o `custom`. La selección se normaliza, limita y deduplica antes de persistirse.

### Interaction Studio · editor visual de objetivos

Se agregó un modo **Editar objetivos visualmente**:

1. el personaje y el campo de influencia vuelven a reposo y se congelan;
2. los candidatos aparecen delineados;
3. clic sobre un elemento lo selecciona;
4. el panel permite activar/desactivar su reacción;
5. la intensidad se ajusta de 0% a 200%;
6. al salir, la física vuelve a activarse desde el layout limpio.

Los estados activo, inactivo y seleccionado se distinguen visualmente. Los presets `Sólo título` y `Título + contenido` siguen existiendo como punto de partida y cualquier edición pasa a `Selección personalizada`.

Los IDs de laboratorio son deterministas; la integración futura deberá usar los IDs reales de los elementos de NagWeb.

### QA

El run **#213** pasó model tests, browser smokes, edición visual por clic, cambio de enabled/peso, reactivación de física, exportación de JSON y restauración exacta de la selección personalizada.


## V3.6 · Comportamiento por objetivo

La selección visual validada en V3.5 se amplía para configurar **cómo** reacciona cada elemento, no sólo si reacciona.

### Influence Field 1.5

Cada target conserva una respuesta independiente para tres canales:

- `move`: desplazamiento;
- `rotate`: rotación;
- `scale`: escala.

El motor expone `setTargetResponse()` / `getTargetResponse()` y aplica los canales después del peso general. Desactivar un canal no afecta los demás.

### Influence Field 1.6

Cada target puede usar además un `returnSpeed` propio entre 0.25 y 2. El valor escala el resorte de retorno sin alterar la configuración global del campo.

Esto permite, por ejemplo:

- título estable con retorno rápido;
- copy con retorno más flotante;
- CTA con desplazamiento + inclinación + escala y retorno intermedio.

### Interaction Session 1.6

La selección persistida de cada objetivo contiene:

- `id`;
- `enabled`;
- `weight`;
- `response.move`;
- `response.rotate`;
- `response.scale`;
- `returnSpeed`.

Las sesiones antiguas migran con todos los canales activos y retorno 1.

### Interaction Studio · edición múltiple

El editor visual admite ahora:

- clic para selección individual;
- **Shift + clic** para sumar o quitar objetivos;
- activar/desactivar toda la selección;
- cambiar intensidad de toda la selección;
- configurar Mover / Rotar / Escalar;
- cambiar Retorno para el grupo.

Los cambios grupales modifican sólo las propiedades editadas, por lo que objetivos con configuraciones distintas pueden compartir un nuevo retorno sin perder sus canales individuales.

### QA

El run **#239** pasó model tests y browser smokes con:

- respuesta por canales;
- retorno individual;
- edición visual;
- selección múltiple con Shift;
- reactivación de física;
- exportación y restauración de sesión.


## V3.7 · Perfiles de reacción y preview en edición

La capa de comportamiento por target ya tiene perfiles reutilizables sin duplicar lógica física.

### Reaction Profiles 1.1

El catálogo canónico vive en `js/nagweb-interaction-reaction-profiles-v1.js`.

Perfiles actuales:

- `gentle` · Apartarse suave;
- `shift` · Desplazar;
- `tilt` · Inclinar;
- `pulse` · Pulso;
- `elastic` · Elástico;
- `heavy` · Pesado;
- `floating` · Flotante.

Cada perfil es una receta de `weight + response(move/rotate/scale) + returnSpeed`. No son motores distintos.

Los IDs legacy `soft` y `displace` migran a `gentle` y `shift`.

### Arquitectura limpia

El catálogo de presets quedó desacoplado de Influence Field:

- Reaction Profiles define recetas;
- Influence Field ejecuta física;
- Session guarda IDs y parámetros;
- Interaction Studio presenta y edita la configuración.

Esto evita dos fuentes de verdad para un mismo preset.

### Influence Field 1.9

Se incorporó broadphase para la influencia corporal. Antes de calcular distancia exacta contra la spine, los targets claramente fuera del área relevante se descartan mediante bounds del recorrido actual/swept.

El renderer expone estadísticas de targets evaluados y descartados para QA/performance.

### Influence Field 1.10

Se agregó un impulso físico reusable por target mediante `impulseTarget()`, junto con `getTargetState()`.

El impulso respeta:

- weight;
- move;
- rotate;
- scale;
- returnSpeed.

No modifica el perfil ni la configuración persistente del target.

### Preview dentro del editor visual

Mientras `Editar objetivos visualmente` está activo aparece **Probar reacción**.

La prueba crea un Influence Field temporal sólo para los targets seleccionados, les aplica un impulso y los deja regresar mediante la misma física real del runtime. Al terminar se destruye el campo temporal y los elementos vuelven al layout limpio.

Esto permite comparar perfiles sin salir del modo de edición ni mover el personaje manualmente.

### QA

La tanda final pasó model tests y browser smoke completos, incluyendo el preview físico dentro del editor.


## Influence 1.9–1.10 · performance para composiciones grandes

El campo de influencia mantiene el mismo resultado visual, pero evita trabajo innecesario cuando una composición contiene muchos objetivos reactivos.

### Influence 1.9 · broadphase

Antes de calcular la distancia precisa de cada target contra todos los segmentos de la spine:

- se calcula una caja de influencia expandida alrededor del recorrido corporal;
- se incluye el recorrido anterior sólo cuando el swept-body es válido;
- los targets claramente lejanos se descartan antes del cálculo point-to-polyline;
- la distancia media entre spine actual/anterior se calcula una sola vez por frame;
- el field expone métricas de targets evaluados y descartados.

El browser smoke usa 120 objetivos y exige que la mayoría de los elementos lejanos queden fuera de la fase geométrica precisa.

### Influence 1.10 · sleep / wake

Un target que está fuera de influencia y ya regresó completamente a su posición de reposo entra en estado dormido:

- no ejecuta el spring mientras no haya una reacción que aplicar;
- no escribe `translate`, `rotate`, `scale` ni variables CSS cada frame;
- se despierta automáticamente cuando el cuerpo vuelve a entrar en su zona;
- un target previamente desplazado continúa animando su retorno antes de dormirse.

Las métricas del field incluyen DOM writes, writes evitados, wakes, sleeps y cantidad de targets dormidos.

El browser QA prueba el ciclo completo:

`activo → cuerpo lejos → todos dormidos → cero writes → cuerpo vuelve → objetivos cercanos despiertan`.

### Carriles paralelos

La línea estable de este documento continúa en `feat/interaction-engine-v1`.

La investigación de deformación weighted-bone / Organic Skin V4 vive separada en `feat/interaction-engine-experimental-v1` y no se integra automáticamente. La comparación V3/V4 se hará cuando el prototipo experimental tenga suficiente madurez.


## V3.8 · selección por área y multiselección honesta

Interaction Studio incorpora selección rectangular de objetivos reactivos.

### Selection Geometry 1.0

La geometría reusable vive en `js/nagweb-interaction-selection-v1.js` y no depende del Studio.

Expone:

- normalización de rectángulos;
- área de intersección;
- detección de targets por centro o porcentaje de solapamiento;
- composición de selección en modos `replace`, `add`, `subtract` y `toggle`.

En el Studio:

- clic selecciona un target;
- Shift + clic alterna targets individuales;
- arrastrar desde espacio vacío crea un marquee;
- Shift + arrastre suma;
- Alt/Option + arrastre quita;
- el rectángulo nunca reemplaza la semántica de clic cuando el gesto empieza sobre un target.

El API del laboratorio expone `selectTargets(ids, mode)` y `marqueeActive` para integración/QA.

### Valores mixtos

Cuando la selección contiene configuraciones diferentes, el panel deja de fingir que todos los targets tienen los valores del elemento primario:

- checkboxes usan estado indeterminado;
- intensidad y retorno muestran `Mixto`;
- perfil muestra `Mixto` cuando corresponde.

Editar un canal modifica únicamente ese canal. Por ejemplo, cambiar `rotate` ya no pisa `move` ni `scale` de los demás targets.

El browser smoke valida selección rectangular real con Pointer Events y preservación de canales heterogéneos.

## Influence 1.11 · lifecycle dinámico de targets

Influence Field ahora administra targets incrementalmente.

API nueva:

- `hasTarget(ref)`;
- `addTarget(element)`;
- `removeTarget(ref)`;
- `setTargets(list)` diferencial.

`setTargets()` conserva estado físico y configuración de los elementos retenidos, agrega sólo los nuevos y restaura los estilos de los removidos.

También se corrigió `impulseTarget()` para despertar explícitamente un target dormido antes de iniciar su retorno físico.

### Target Registry 1.0

`js/nagweb-interaction-target-registry-v1.js` es un adaptador DOM opcional, separado de la física.

Usa `MutationObserver` para detectar altas, bajas y cambios de activación bajo un root configurable, agrupa mutaciones cercanas y puede enlazarse directamente a un Influence Field mediante `bindField()`.

Además informa IDs duplicados, algo importante para sesiones persistentes.

El browser QA comprueba:

- habilitar un target existente;
- agregar nodos nuevos;
- conservar el peso de targets ya activos;
- borrar nodos y liberar su estado;
- detectar IDs duplicados;
- sincronizar automáticamente el field sin reconstruir los targets retenidos.


## Studio · registro dinámico conectado

El Studio usa Target Registry 1.1 para observar objetivos activos e inactivos. Altas, bajas y cambios de atributos actualizan el field existente de forma diferencial. Ajustar la fuente o un perfil tampoco reconstruye la física de los objetivos retenidos. Entrar en edición sigue pausando el personaje y separando la prueba de reacción del field principal.

Cuando se elimina un objetivo seleccionado, desaparece de la selección y del panel. La vista previa libera los objetivos eliminados y termina si no queda ninguno. La exportación JSON y los controles usan el mismo parser que el field, incluidos los valores por defecto de un objetivo nuevo. Se corrigió el retorno sin atributo para que sea 100%, coherente con los controles y las sesiones.

El browser smoke comprueba alta, configuración, desactivación y baja dentro del Studio, conservación exacta del estado físico con el field pausado, identidad del field al cambiar fuente, exportación de valores por defecto y eliminación durante una vista previa. Trabajo aislado en `feat/interaction-engine-v1`; sin integración al editor principal ni V4.

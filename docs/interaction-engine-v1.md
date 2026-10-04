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

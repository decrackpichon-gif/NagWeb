# NagWeb Interaction Engine V1

Motor aislado para estudiar y estabilizar interacciones de seguimiento antes de integrarlas al editor principal.

## V1.1 — configuración de producto

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
- `prefers-reduced-motion`;
- configuración serializable y validada;
- API independiente de globals de NagWeb.

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

## Próxima micro-etapa

Robustez de entrada y lifecycle: teclado/touch, seguimiento relativo al área, salida/reentrada del puntero, visibilidad de pestaña, resize del asset, múltiples seguidores simultáneos y batería de pruebas de lifecycle.

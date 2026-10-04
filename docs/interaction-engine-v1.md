# NagWeb Interaction Engine V1

Primera etapa aislada del nuevo sistema de interacción.

## Objetivo

Permitir que cualquier recurso visual (PNG/JPG/WebP/GIF o un elemento DOM) siga al cursor con una respuesta de calidad sin exigir preparación especial del asset.

## Alcance V1

- seguimiento con inercia y límite de velocidad;
- orientación opcional hacia el puntero;
- suavizado de giro;
- tilt 3D configurable;
- escala sutil en función de la velocidad;
- idle automático sobre trayectoria orgánica;
- soporte de pointermove/pointerdown;
- respeto por `prefers-reduced-motion`;
- API independiente de los globals del editor;
- laboratorio aislado con carga local de imágenes;
- modelo testeable sin DOM.

## API mínima

```js
const follower = NAGWEB_INTERACTION_ENGINE.createFollower(element, {
  area: container,
  follow: 0.09,
  damping: 0.82,
  maxSpeed: 34,
  rotateToTarget: true,
  turnSmoothing: 0.18,
  tilt: 8,
  speedScale: 0.05,
  idle: { enabled: true, delay: 2600 }
});
```

La integración con los paneles de NagWeb queda deliberadamente fuera de esta rama inicial. Esta V1 valida el motor y su contrato antes de acoplarlo al editor.

## Próximo paso

Agregar presets de comportamiento, persistencia serializable y un adaptador para elementos reales del lienzo de NagWeb sin duplicar motores de animación existentes.

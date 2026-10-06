# Cámara de escena: primera etapa

Rama: `feat/scroll-camera-v1`.
Base: `feat/storytelling-engine-v2` en `ed98713506b669bed1f0fedaf5731594880ff577`.
No integrar automáticamente con main, Motion Lab ni interaction-engine.

En el panel de escena, activar Director de scroll y luego Cámara 3D.
La cámara está apagada por defecto; apagarla conserva ambos encuadres.
Configurar posiciones inicial/final X/Y/Z y usar Previsualizar momento.
X positivo desplaza la cámara a la derecha, Y hacia abajo y Z hacia delante.
Se usa el ritmo del Director y su mismo progreso, también en exportación.
Movimiento reducido deja la cámara en posición neutral.

Implementación aislada en js/nagweb-scroll-camera.js; hooks mínimos en el
Director y una etiqueta script en index.html. No se modifica story-editor,
Motion Lab ni los motores de personajes. Resolver estos hooks al integrar.

Alcance: cámara CSS 2.5D sobre .inner, dos encuadres, sin reloj adicional.
Pendiente: pista de múltiples keyframes, rotación, editor visual del recorrido,
profundidad estática por capa y composición de perspectiva con los efectos
2.5D existentes. No constituye una cámara Three.js: los objetos WebGL y sus
anclas requieren una integración posterior. Los nodos fuera de .inner no se
mueven con esta cámara. La cámara puede acercarse hasta atravesar el plano.

Verificación: node .github/nagweb-camera-model-test.mjs y
node .github/nagweb-depth-model-test.mjs. Se verifican neutralidad, opt-in,
recorrido, signos, serialización de fábrica y movimiento reducido.
Falta prueba visual en navegador de layout, interacción y exportación completa.
No se solicitó despliegue en Vercel para esta etapa aislada.

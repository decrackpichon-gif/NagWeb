# Cámara de escena: encuadres y orientación

Rama: `feat/scroll-camera-v1`.
Base: `feat/storytelling-engine-v2` en `ed98713506b669bed1f0fedaf5731594880ff577`.
No integrar automáticamente con main, Motion Lab ni interaction-engine.

En el panel de escena, activar Director de scroll y luego Cámara 3D.
La cámara está apagada por defecto; apagarla conserva todos los encuadres.
Elegir un momento con Previsualizar momento y pulsar Agregar encuadre aquí.
Seleccionar su botón ◇ para editar X/Y/Z, orientación, porcentaje y ritmo hacia el siguiente.
Orientación: inclinar arriba/abajo (X), mirar izquierda/derecha (Y) y girar
el horizonte (Z). Los ángulos admiten vueltas completas: 0 → 360 recorre
una vuelta, sin acortar el recorrido. Cada ángulo se limita a ±3600°.
Al agregar un encuadre se captura también su orientación interpolada.
Los encuadres antiguos usan orientación cero, conservando su movimiento.
Los encuadres se ordenan por porcentaje. No se permite reemplazar otro encuadre
al moverlo a un porcentaje ocupado. Se conservan al menos dos encuadres.
Los proyectos de la primera etapa conservan sus posiciones inicial/final hasta
la primera edición, cuando se convierten automáticamente al formato múltiple.
X positivo desplaza la cámara a la derecha, Y hacia abajo y Z hacia delante.
Se usa el mismo progreso del Director, también en exportación. Cada tramo
puede tener su propio ritmo; los antiguos encuadres heredan el del Director.
Movimiento reducido deja la cámara en posición neutral.

Implementación aislada en js/nagweb-scroll-camera.js; hooks mínimos en el
Director y una etiqueta script en index.html. No se modifica story-editor,
Motion Lab ni los motores de personajes. Resolver estos hooks al integrar.

Alcance: cámara CSS 2.5D sobre .inner, hasta 128 encuadres, sin reloj adicional.
Pendiente: arrastre visual de puntos en una pista, editor visual del recorrido,
profundidad estática por capa y composición de perspectiva con los efectos
2.5D existentes. No constituye una cámara Three.js: los objetos WebGL y sus
anclas requieren una integración posterior. Los nodos fuera de .inner no se
mueven con esta cámara. La cámara puede acercarse hasta atravesar el plano.

Verificación: node .github/nagweb-camera-model-test.mjs y
node .github/nagweb-depth-model-test.mjs. Se verifican neutralidad, opt-in,
recorrido, signos, serialización de fábrica, movimiento reducido, segmentos,
edición independiente, cambio de momento, colisiones, borrado e historial.
La orientación usa el orden inverso Rz(-Z) Ry(-Y) Rx(-X) T(-x,-y,z);
las pruebas cubren giro sin traslación, vueltas completas y orientación neutra
con movimiento reducido.
Falta prueba visual en navegador de layout, interacción y exportación completa.
vercel.json desactiva despliegues Git para feat/scroll-camera-v1.
No desplegar manualmente hasta que el usuario lo solicite.

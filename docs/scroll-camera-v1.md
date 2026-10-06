# Cámara de escena: pista, orientación y planos de profundidad

Rama: `feat/scroll-camera-v1`.
Base: `feat/storytelling-engine-v2` en `ed98713506b669bed1f0fedaf5731594880ff577`.
No integrar automáticamente con main, Motion Lab ni interaction-engine.

En el panel de escena, activar Director de scroll y luego Cámara 3D.
La cámara está apagada por defecto; apagarla conserva todos los encuadres.
Elegir un momento con Previsualizar momento y pulsar Agregar encuadre aquí.
Seleccionar su punto ◆ en la pista para editar X/Y/Z, orientación, porcentaje
y ritmo hacia el siguiente. La pista tiene clic para recorrer y una barra
accesible para elegir el progreso. Arrastrar un punto cambia su momento al
soltarlo; Escape, cancelación del puntero o pérdida de captura anulan el gesto
sin guardar cambios. Las flechas ajustan 1%; Shift + flecha ajusta 10%.
Un arrastre confirmado produce una sola entrada de deshacer.
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
Movimiento reducido deja la cámara y la profundidad fija en posición neutral.

## Profundidad fija por elemento
Con la cámara activada, seleccionar un texto, imagen u otro elemento suelto
y ajustar Profundidad fija (px) en Momento en la historia. Negativo aleja,
cero conserva el plano y positivo acerca. Se suma al Z animado del elemento.
Desactivar la cámara conserva el valor guardado pero deja de aplicarlo.
Los planos usan la perspectiva común de la cámara, evitando sumar otra
perspectiva individual. Los elementos fuera de este modo mantienen el
comportamiento anterior. Los planos se limitan a ±4000 px.
No incluye hijos de contenedores, contenedores, elementos fijos, composiciones
MotionLab ni objetos Three.js. La perspectiva compartida todavía requiere
verificación visual en navegador.

Implementación aislada en js/nagweb-scroll-camera.js; hooks mínimos en el
Director y una etiqueta script en index.html. No se modifica story-editor,
Motion Lab ni los motores de personajes. Resolver estos hooks al integrar.

Alcance: cámara CSS 2.5D sobre .inner, hasta 128 encuadres, sin reloj adicional.
Pendiente: editor visual del recorrido espacial,
profundidad de grupos y compatibilidad visual con los efectos
2.5D existentes. No constituye una cámara Three.js: los objetos WebGL y sus
anclas requieren una integración posterior. Los nodos fuera de .inner no se
mueven con esta cámara. La cámara puede acercarse hasta atravesar el plano.

Verificación: node .github/nagweb-camera-model-test.mjs y
node .github/nagweb-depth-model-test.mjs. Se verifican neutralidad, opt-in,
recorrido, signos, serialización de fábrica, movimiento reducido, segmentos,
edición independiente, cambio de momento, colisiones, borrado e historial.
La orientación usa el orden inverso Rz(-Z) Ry(-Y) Rx(-X) T(-x,-y,z);
las pruebas cubren además arrastre, cancelación, Escape, colisiones, pérdida
de captura, clic y barra de progreso; giro sin traslación, vueltas completas y orientación neutra
con movimiento reducido.
Falta prueba visual en navegador de layout, interacción y exportación completa.
vercel.json desactiva despliegues Git para feat/scroll-camera-v1.
No desplegar manualmente hasta que el usuario lo solicite.

Pruebas adicionales: profundidad por elemento, suma con Z animado, selección
de capas admitidas, perspectiva compartida, JSON y conservación al desactivar.

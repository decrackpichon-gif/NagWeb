# Cámara de escena: pista, mapa espacial y planos de profundidad

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

## Pausas, copias y recorridos rápidos
Abrir Pausas y recorridos rápidos. Mantener este encuadre crea una copia con
la misma posición y orientación al final de una permanencia (en porcentaje
del recorrido). El tramo queda quieto; los encuadres posteriores no cambian de
momento. Se rechaza una permanencia que alcance otro encuadre o supere 100%.
Copiar encuadre al momento actual duplica el seleccionado en el porcentaje
elegido con la barra. No sobrescribe un encuadre existente.
Hay cuatro recorridos: Acercamiento con pausa, Viaje lateral, Ascenso y descanso,
y Visita con profundidad. Se elige uno y se pulsa Aplicar recorrido: reemplaza
solo los encuadres de cámara, conserva los elementos y sus animaciones, y crea
una entrada de Deshacer. Los puntos del recorrido siguen editables.

## Mapa del recorrido
Abrir el panel plegable Mapa del recorrido. La vista Desde arriba muestra X/Z;
De frente muestra X/Y. Elegir el encuadre desde la pista y arrastrar el punto
resaltado. El mapa se ajusta al alcance del recorrido después de guardar.
Se cambia solamente la posición de ese encuadre; momento, orientación, ritmo
y los demás encuadres se conservan. La línea muestra la conexión entre puntos.
El cambio se confirma al soltar, con una sola entrada de deshacer. Escape,
cancelación del puntero o pérdida de captura cancelan el gesto. Las flechas
mueven 25 px y Shift + flecha 100 px. Las coordenadas siguen editables por número.
El mapa es una proyección del recorrido, no una previsualización de los objetos.
El círculo indica la posición actual durante la reproducción o el scroll;
el rombo es el encuadre seleccionado para editar. Debajo se muestran porcentaje
y coordenadas actuales. La línea se actualiza durante el arrastre y vuelve al
estado original si se cancela. Movimiento reducido también neutraliza el cursor.

## Profundidad fija por elemento
Con la cámara activada, seleccionar un texto, imagen u otro elemento suelto
y ajustar Profundidad fija (px) en Momento en la historia. Negativo aleja,
cero conserva el plano y positivo acerca. Se suma al Z animado del elemento.
Desactivar la cámara conserva el valor guardado pero deja de aplicarlo.
Los planos usan la perspectiva común de la cámara, evitando sumar otra
perspectiva individual. Los elementos fuera de este modo mantienen el
comportamiento anterior. Los planos se limitan a ±4000 px.
En Lienzo libre también incluye contenedores raíz, incluidos los universales:
su profundidad se aplica a todo el conjunto, conservando la jerarquía interna.
El runtime los coloca dentro del mundo de cámara sin modificar los estilos
de posición y tamaño ni los datos guardados. Al apagar la cámara, la siguiente
previsualización/exportación vuelve al markup original.
En escenas apiladas admite contenedores raíz tanto con distribución automática
(stackDir) como absolutos. Los de flujo permanecen dentro de .inner; los absolutos
que estén junto a .inner se incorporan al mundo de cámara conservando hijos,
estilos de posición y jerarquía.
No incluye profundidad fija independiente para hijos de contenedores, elementos
fijos, composiciones MotionLab ni objetos Three.js. Los hijos conservan, sin embargo,
sus animaciones Z/rotateX/rotateY del Story Model dentro del mismo mundo de cámara:
el contenedor raíz usa preserve-3d y esos hijos reutilizan la perspectiva compartida,
evitando sumar una segunda perspective(). La verificación visual sigue pendiente.

Implementación aislada en js/nagweb-scroll-camera.js; hooks mínimos en el
Director y una etiqueta script en index.html. No se modifica story-editor,
Motion Lab ni los motores de personajes. Resolver estos hooks al integrar.

Alcance: cámara CSS 2.5D sobre .inner, hasta 128 encuadres, sin reloj adicional.
Pendiente: verificación visual del mapa espacial y compatibilidad visual con los
efectos 2.5D existentes. No constituye una cámara Three.js: los objetos WebGL y sus
anclas requieren una integración posterior. Los contenedores raíz admitidos
se incorporan a .inner; el resto de nodos externos permanece fuera de la cámara. La cámara puede acercarse hasta atravesar el plano.

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

Pruebas de contenedores: traslado de raíz a mundo de cámara en Lienzo libre y
escenas apiladas, conservación de hijos y estilos de posición, contexto preserve-3d,
exclusiones, fábrica exportada y edición aislada.

Pruebas del mapa: proyección X/Z y X/Y, límites, ejes independientes,
transacción de arrastre, Escape, teclado y fábrica exportada.

## Verificación de la tanda de herramientas
`node .github/nagweb-camera-runtime-test.mjs` carga el Director real, obtiene
su script exportado y lo ejecuta en un entorno aislado con un DOM simulado.
Cubre paridad preview/export, cálculo del progreso a partir del scroll,
mensajes del editor, permanencias, planos de profundidad, contenedores,
herencia de perspectiva 2.5D, movimiento reducido y comportamiento con cámara desactivada. No renderiza
CSS ni verifica layout o interacción real del navegador. Las pruebas del
modelo cubren también pausas, copias, recorridos y cursor del mapa.

## Escenas apiladas y preparación del recorrido
Las pruebas cubren profundidad compartida en contenedores con auto layout y
absolutos, conservación de jerarquía y estilos, reubicación de raíces absolutas,
restauración desde JSON y exclusión de raíces no admitidas. Las escenas
horizontales no activan esta cámara.
El runtime prepara el track de cámara una vez por escena y reutiliza sus
fotogramas normalizados en cada paint. Los resultados coinciden con el
cálculo anterior, evitando repetir esa preparación durante la reproducción.

## Adaptación opcional a pantallas angostas
Adaptar recorrido al ancho está apagado por defecto. Al activarlo, el ancho
de referencia (1000 px por defecto, configurable entre 320 y 2400) define la
escala. Por debajo de ese ancho se reducen X/Y/Z de cámara, la perspectiva
compartida y la profundidad Z de los planos admitidos en la misma proporción.
Los ángulos conservan sus valores. Por encima no se amplifica el recorrido.
Los datos guardados y el mapa usan las coordenadas del ancho de referencia.
Las animaciones X/Y de los elementos y las capas excluidas siguen usando sus
valores originales. No sustituye los ajustes de diseño móvil de la app.
El runtime recalcula esta escala al cambiar el ancho, conservando un momento
pausado. Volver al primer encuadre navega al primer punto sin cambiar el proyecto.
Pruebas: exportación con ancho angosto, resize en pausa, perspectiva neutral,
opción desactivada, serialización, ángulos estables y navegación sin historial.
La verificación visual en celular sigue pendiente.

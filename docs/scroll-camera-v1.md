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
evitando sumar una segunda perspective(). La combinación ya se verifica en Chromium
con preview/export y matrices 3D reales.

Implementación aislada en js/nagweb-scroll-camera.js; hooks mínimos en el
Director y una etiqueta script en index.html. No se modifica story-editor,
Motion Lab ni los motores de personajes. Resolver estos hooks al integrar.

Alcance: cámara CSS 2.5D sobre .inner, hasta 128 encuadres, sin reloj adicional.
El mapa espacial y la compatibilidad con efectos 2.5D ya se verifican en Chromium,
incluida la exportación real. No constituye una cámara Three.js: no rota ni traslada la
cámara WebGL. Sin embargo, los objetos Three.js vinculados con NAGWEB_3D_ANCHOR sí
siguen la cámara de escena porque su posición se recalcula desde el rectángulo DOM
transformado. El Director fuerza además un refresh de esas anclas dentro del mismo
paint de cámara para que el scrub manual no tenga un frame de retraso. Los contenedores raíz admitidos
se incorporan a .inner; el resto de nodos externos permanece fuera de la cámara. La cámara puede acercarse hasta atravesar el plano.

Verificación: node .github/nagweb-camera-model-test.mjs y
node .github/nagweb-depth-model-test.mjs. Se verifican neutralidad, opt-in,
recorrido, signos, serialización de fábrica, movimiento reducido, segmentos,
edición independiente, cambio de momento, colisiones, borrado e historial.
La orientación usa el orden inverso Rz(-Z) Ry(-Y) Rx(-X) T(-x,-y,z);
las pruebas cubren además arrastre, cancelación, Escape, colisiones, pérdida
de captura, clic y barra de progreso; giro sin traslación, vueltas completas y orientación neutra
con movimiento reducido.
La prueba de navegador en Chromium cubre layout, interacción del mapa, edición por
teclado, exportación y matrices 3D reales. La suite completa de NagWeb también pasó
con esta cámara activa.
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
El workflow `.github/workflows/nagweb-camera.yml` ejecuta un smoke específico de
cámara (modelo + runtime + Chromium) sin disparar Vercel y conserva capturas como
artefactos temporales.

## Puente con objetos Three.js anclados
La cámara CSS y la cámara de Three.js siguen siendo sistemas distintos. Un objeto 3D
con anclaje activo usa NAGWEB_3D_ANCHOR para proyectar la posición de su ancla DOM al
mundo WebGL. Como esa ancla vive dentro del mundo de cámara, getBoundingClientRect()
ya contiene el movimiento visual de la cámara y el objeto 3D acompaña ese recorrido.
La prueba de navegador comprueba el cambio de rectángulo, la nueva posición proyectada,
la limpieza del binding y el refresh sin esperar al siguiente requestAnimationFrame.
La adaptación a ancho angosto ya se verifica en Chromium redimensionando la misma
exportación pausada de 1000 px a 390 px: X/Y/Z de cámara, perspectiva y profundidad
de capas se escalan en vivo, los ángulos permanecen estables y los datos guardados no
se modifican. El smoke guarda además una captura mobile.


## Trayectoria curva opcional
La cámara conserva `Por tramos` como comportamiento compatible por defecto. El modo
`Curva suave` convierte las posiciones XYZ de los mismos encuadres en una trayectoria
Catmull-Rom continua, sin cambiar el timing existente de los ángulos ni los easings.
Los encuadres siguen siendo puntos exactos de paso y dos posiciones consecutivas
idénticas conservan una permanencia real. El mapa espacial muestra muestras de la
curva efectiva en vez de unir únicamente los puntos con segmentos rectos.

Esta primera versión toma de las referencias de edición de cámara la idea de separar
la trayectoria espacial de la orientación. La parametrización uniforme por longitud
de arco, la orientación por punto de interés y el damping dependiente de deltaTime
quedan como evoluciones separadas para no mezclar tres cambios de comportamiento en
una sola etapa.


## Orientación por punto de mirada
La orientación conserva `Ángulos manuales` como modo compatible por defecto. El
modo opcional `Mirar hacia` separa la posición de cámara del objetivo visual:
`sdCameraFrames` sigue describiendo dónde está la cámara y
`sdCameraLookFrames` describe qué punto XYZ mira en cada momento.

La trayectoria del objetivo tiene timing y modo de interpolación propios
(`sdCameraLookPathMode`: por tramos o curva suave), por lo que puede cambiar de
dirección en momentos distintos a los encuadres de posición. Pitch y yaw se calculan
desde cámara → objetivo; el giro del horizonte (roll) continúa usando el ángulo manual
del encuadre. Volver a Ángulos manuales conserva los objetivos guardados.

Al activar Mirar hacia por primera vez, NagWeb genera objetivos delante de cada
encuadre a partir de la orientación manual existente para evitar empezar desde datos
vacíos. El mapa espacial muestra la trayectoria del objetivo con línea punteada y su
posición actual con un punto sólido. Preview y exportación usan el mismo cálculo.

Reduced motion sigue neutralizando toda la cámara, y la adaptación responsive no
cambia los ángulos porque cámara y objetivo comparten la misma escala espacial.
La prueba Chromium cubre UI, trayectoria independiente y matriz exportada.


## Edición espacial de objetivos de mirada
Con `Mirar hacia` activo, el mapa espacial muestra el objetivo seleccionado como
un control `●` independiente del encuadre `◆`. El objetivo puede arrastrarse en
las vistas X/Z y X/Y sin modificar la posición de cámara ni los otros ejes.

El arrastre es transaccional: durante el gesto solo cambia la previsualización del
mapa; al soltar se guarda una única operación de Deshacer. Escape o pérdida de captura
cancelan el gesto sin tocar el proyecto. Las flechas desplazan 25 px y Shift + flecha
100 px, incluso cuando el mapa amplía automáticamente su rango por coordenadas grandes.
La trayectoria punteada se recalcula en vivo mientras se arrastra el objetivo.

La prueba de Chromium cubre teclado, arrastre real con Pointer Events, un único undo y
cancelación con Escape.


## Mirar un elemento
Cada objetivo `●` puede seguir siendo un `Punto XYZ` manual o vincularse a un
elemento raíz compatible del **Lienzo libre**. El vínculo se guarda por `targetId`;
no se hornean coordenadas de pantalla.

En la primera versión son elegibles los elementos raíz que ya pertenecen al mundo de
cámara. Se excluyen elementos anidados, fijos, modales, instancias MotionLab,
`shape3d`, `light3d` y otros nodos fuera del plano de cámara. Esta limitación hace
que la conversión espacial sea determinista antes de ampliar el sistema a jerarquías.

La posición objetivo parte del centro authored del elemento (X/Y porcentual respecto
del centro de la escena), suma su profundidad fija y, en cada progreso, suma también
sus keyframes X/Y/Z del Director. Por eso la cámara puede seguir un elemento que se
mueve durante la narración. Preview y exportación resuelven esas coordenadas usando el
tamaño de referencia de la escena, de modo que el LookAt conserva su dirección al
adaptarse a pantallas angostas.

Mientras un `●` está vinculado, sus campos XYZ manuales se ocultan y el control del
mapa queda bloqueado. Al volver a `Punto XYZ`, se conserva el último XYZ como punto
editable. Si el elemento vinculado deja de existir o deja de ser elegible, el runtime
usa ese XYZ guardado como respaldo en vez de romper la cámara.

La prueba de Chromium vincula un título desde la UI, verifica que sus keyframes X/Z
cambien el yaw de cámara, compara la matriz exportada y repite el cálculo a ancho
responsive.


## Selección directa y bloqueo por eje
El mapa espacial ya no obliga a volver a la pista temporal para cambiar de punto.
Los círculos SVG de los encuadres y objetivos son seleccionables directamente; además,
un clic cerca de un punto busca el keyframe espacial más próximo dentro de una zona de
captura. Si varios puntos coinciden, clics sucesivos ciclan entre los puntos superpuestos.

Los controles seleccionados `◆` y `●` conservan el arrastre libre. Mantener Shift
durante el arrastre bloquea el gesto al eje dominante, siguiendo una convención de
editores 2D/3D: X o Z en vista superior, X o Y en vista frontal. Un clic sin movimiento
sobre un control seleccionado también permite ciclar a otro punto que esté debajo.

Las flechas siguen moviendo 25 px y Shift + flecha 100 px. Escape cancela el gesto y
cada arrastre confirmado crea una sola operación de Deshacer. La prueba Chromium cubre
selección física de círculos SVG, puntos coincidentes, Shift-arrastre y el cursor de
posición actual cuando se superpone a un keyframe.


## Tensión por tramo de la curva
En `Curva suave`, cada encuadre salvo el último puede controlar la forma XYZ del
tramo que sale de él mediante `Tensión hacia el siguiente (%)`.

El valor `0%` reproduce exactamente la curva Catmull-Rom que ya usaba NagWeb, por
lo que los proyectos existentes conservan su recorrido sin cambios. Los valores
positivos reducen las tangentes del tramo y hacen que la curva se ajuste más entre
los dos encuadres; `+100%` deja las tangentes del tramo en cero. Los valores
negativos aumentan esas tangentes y producen una trayectoria más suelta. El rango se
limita a -100..100.

La tensión solo modifica la posición espacial X/Y/Z del tramo que parte del
encuadre seleccionado. No cambia el momento del keyframe, sus ángulos, su easing ni
los demás tramos. Los encuadres siguen siendo puntos exactos de paso y las
permanencias con posiciones idénticas siguen siendo pausas reales.

El mapa espacial vuelve a muestrear la curva al modificar la tensión. Preview y
exportación usan la misma interpolación. Cambiar temporalmente a `Por tramos` no
elimina la tensión guardada; al volver a `Curva suave` reaparece el mismo valor.

Las pruebas cubren compatibilidad exacta de 0%, límites, tensión positiva/negativa,
historial del editor, actualización del mapa y matriz 3D real en la exportación de
Chromium.


## Vista de tangente de salida
En `Curva suave`, el mapa muestra para el encuadre seleccionado una tangente de
salida `◯` unida al `◆` por una línea punteada. No es una aproximación visual:
la posición del círculo corresponde al control Hermite/Bezier equivalente de la
misma tangente que usa el interpolador espacial.

Con tensión `0%`, la tangente representa exactamente el Catmull-Rom histórico.
Al aumentar la tensión se retrae hacia el encuadre y en `+100%` coincide con él.
Con tensión negativa se alarga. Una permanencia real no muestra tangente de salida,
porque ese tramo mantiene la misma posición.

El mapa incluye las tangentes en su cálculo de escala para evitar recortarlas cuando
la curva es más suelta. Durante el arrastre del `◆`, la tangente se recalcula y se
mantiene unida al encuadre. En modo `Por tramos` no se muestra.

Esta primera etapa es solo visual. La edición continúa mediante el campo de tensión;
la siguiente etapa puede convertir el `◯` en handle arrastrable sin cambiar el
modelo matemático.


## Edición directa de la tangente
La tangente `◯` del encuadre seleccionado ya es interactiva. Arrastrarla no crea
otro punto XYZ: el movimiento del mouse se proyecta sobre la dirección matemática de
la tangente y se convierte en un único valor de tensión del tramo entre -100 y +100.

Acercar el handle al `◆` aumenta la tensión; alejarlo reduce la tensión y alarga la
curva. El círculo continúa representando el control Hermite real, por lo que su
posición coincide con la forma que usa preview y exportación.

El gesto es transaccional. Mientras se arrastra se actualizan en vivo el handle, la
línea de tangente, el valor numérico y la curva del mapa, pero el proyecto se guarda
una sola vez al soltar. Cada gesto confirmado crea una sola entrada de Deshacer.
Escape, pointer cancel y pérdida de captura restauran el valor original sin modificar
el historial.

El handle también acepta teclado: flechas ajustan 5 puntos de tensión, Shift + flecha
20 puntos y Home restaura 0. En +100% la tangente coincide con el `◆`; el encuadre
queda por encima en el orden visual, por lo que la posición de cámara sigue siendo
arrastrable y la tensión puede liberarse desde el campo numérico o teclado.

Las pruebas cubren la conversión handle → tensión, clamps, arrastre físico en Chromium,
un único undo y cancelación con Escape.


## Inserción directa sobre la trayectoria
El mapa espacial permite crear un nuevo encuadre `◆` con doble clic sobre la
trayectoria de cámara. NagWeb proyecta el clic contra los tramos muestreados del
recorrido, encuentra el punto visual más cercano y recupera su momento narrativo
`at`. El nuevo keyframe captura la pose XYZ y orientación que tenía la cámara en
ese instante, además del easing del tramo de origen.

La captura admite una tolerancia de 14 px respecto de la trayectoria. Antes de crear
un punto, una zona más pequeña de 8 px alrededor de cada keyframe existente tiene
prioridad: un doble clic allí selecciona el `◆` existente en lugar de crear un
vecino casi duplicado. El porcentaje final se redondea a 0,1%, igual que el resto de
la pista de cámara.

La operación crea una sola entrada de Deshacer y selecciona inmediatamente el nuevo
encuadre para editarlo. Se mantiene el límite de 128 keyframes. Borrar el punto recién
insertado restaura los datos originales del recorrido.

En Curva suave, el punto se captura exactamente sobre la trayectoria existente en el
momento de inserción. Al convertirse en un nuevo control de la spline, su presencia
puede recalcular las tangentes vecinas, igual que al agregar un nodo nuevo a una curva.
Las pruebas verifican la búsqueda proyectada, captura XYZ, prevención de duplicados,
historial, interacción física por doble clic en Chromium y restauración tras borrar.


## Inserción directa en la trayectoria de mirada
Con `Mirar hacia` activo, la línea punteada del objetivo tiene una zona de captura
invisible más ancha. Un doble clic sobre esa trayectoria crea un nuevo objetivo
`●` en el momento narrativo correspondiente, sin confundirlo con la línea de cámara.

La regla del mapa queda diferenciada visualmente:
- doble clic sobre la trayectoria normal: nuevo `◆` de cámara;
- doble clic sobre la trayectoria punteada: nuevo `●` de mirada.

NagWeb proyecta el clic sobre la trayectoria de mirada, recupera su `at`, resuelve
la posición XYZ real del objetivo en ese instante y crea un punto manual. Si el
recorrido provenía de elementos vinculados, el nuevo punto no hereda automáticamente
el `targetId`: captura la posición resuelta como XYZ para evitar vínculos implícitos.

La misma protección anti-duplicados usa 8 px alrededor de los objetivos existentes
y 14 px de tolerancia para la trayectoria. La operación crea una sola entrada de
Deshacer, selecciona el nuevo objetivo y respeta el límite de 128 puntos.

Las pruebas cubren inserción manual, captura XYZ, prevención de duplicados, historial,
zona de hit ampliada y doble clic físico sobre la línea punteada en Chromium.

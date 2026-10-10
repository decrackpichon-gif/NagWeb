# Origen de layout de anclas espaciales

El renderizador ya componía los contenedores, pero omitía el desplazamiento del
mundo CSS `.inner` respecto de la stage. Una cámara correctamente sincronizada
no podía compensar ese error de posición del objeto.

Ahora la colocación incluye ese offset sin usar su rectángulo transformado por
la cámara. Las anclas directas dentro del mundo incluyen además su borde y
scroll; las anclas anidadas conservan la composición de sus padres y suman el
origen del mundo una sola vez. Las anclas directamente en la stage conservan
su sistema de coordenadas. No se agrega reloj ni evaluador del progreso.

## Verificación

La prueba de herencia ejecuta los sitios realmente generados en diseño,
exportación, bloom y cámara rotada. Desplaza `.inner` 27/19 px, agrega un borde
de 4 px y compara la posición proyectada de una forma y un GLB cargado contra
marcadores CSS independientes. Restaura el fixture después de la comparación.
También conserva sus comprobaciones de opacidad heredada, planos de edición,
resize, movimiento reducido y aislamiento. Las integraciones con Three r128
comprueban border/scroll sin necesitar una segunda fuente de progreso.

Los límites de aplanamiento CSS, clipping y filtros siguen vigentes. No se
promete paridad para stages con transformaciones CSS externas o bordes propios,
ni para estructuras fuera de la jerarquía admitida.

Resultado local de la ronda seleccionada: 33 comprobaciones aprobadas en 43 s,
con Node 24, Chrome/SwiftShader y Three r128. No se repiten luces, timing y bloom
como grupos independientes: no se cambiaron, y el fixture de herencia sí incluye
una exportación con bloom.

## Validación agrupada

Se incorpora un único comando para las siete parejas espaciales, el flujo
acotado del editor, modelo/runtime/foco y sintaxis. Usa las dependencias y
variables de entorno documentadas en `scroll-camera-v1.md`.

```sh
node .github/nagweb-spatial-smoke.cjs
```

Para un bloque que sólo toca colocación, proyección e interacción, se pueden
seleccionar grupos y evitar repetir pruebas ajenas al cambio:

```sh
node .github/nagweb-spatial-smoke.cjs renderer hierarchy projection interaction editor
```

Cada grupo ejecuta integración y navegador; todos terminan con una ronda de
sintaxis. El comando informa los fallos de todos los grupos y devuelve estado
de error si alguno falla. No sustituye el smoke completo histórico del editor.

## Diagnósticos del smoke histórico

El [CI de `6a93eb3`](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38021284990) pasó la creación/arrastre/Undo/selección y se detuvo más
adelante, al comprobar que las lecturas XYZ de un `<details>` cerrado no fueran
visibles. Se cambia esa referencia visual de `getClientRects()` a
`checkVisibility()` cuando está disponible: un elemento en contenido omitido
puede conservar rectángulos sin estar visible. El flujo acotado del editor
verifica abrir/cerrar, altura ocupada y persistencia de este panel sin cambios
en los datos de cámara. El CI completo debe volver a comprobarse; no se da
por aprobado por esta corrección aislada.

No hay despliegue en Vercel ni integración a main.

## CI de las integraciones espaciales

El workflow `nagweb-spatial.yml` ejecuta el comando completo cuando cambia
código o pruebas de esta rama, con permisos de lectura. Usa dependencias de
prueba fijadas (Three 0.128.0, GSAP 3.12.5 y Playwright 1.62.1), Chrome del
runner y fixtures offline preparados desde esos paquetes. Conserva el smoke
histórico independiente; no oculta su resultado. Cancela ejecuciones antiguas
de este workflow al llegar un commit nuevo para evitar trabajo duplicado.

La regresión del panel técnico ahora reproduce una apertura y un cambio de
plano en la misma tarea JavaScript. Antes perdía el estado abierto porque el
evento nativo `toggle` aún no se había entregado. El editor guarda el estado
sincrónicamente al activar el resumen, manteniendo apertura/cierre y teclado.
No modifica datos ni historial de la cámara.

El [primer CI espacial completo](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38022459387)
pasó 39 comprobaciones en 96 segundos con Node 22 y Chrome en Ubuntu. Incluye
las siete parejas espaciales y el flujo acotado del editor.

El smoke histórico ya pasó los diagnósticos; después se detuvo al hacer clic
en el checkbox de conos de visión. La prueba acotada verifica ahora ese control
por puntero y teclado después de cambiar perspectiva y renderizar el panel,
además de persistencia entre planos e historial intacto. El smoke histórico usa
activación por teclado para ese checkbox, conservando sus aserciones de conos,
posición y estado. No se modifica la lógica del control ni se afirma que el
fallo de clic original sea un error del producto. La ronda local del editor
pasó sus 25 comprobaciones; falta comprobar el nuevo smoke completo en CI.

El siguiente CI pasó los toggles y llegó a los medidores de cobertura. Su
referencia usaba `NaN` dentro de un objeto devuelto desde el navegador; ese
valor no conserva su identidad al serializarse como JSON. La ausencia de
barra se representa ahora con `null` y se verifica además que el elemento de
relleno no exista. Se conserva la comprobación del estado «no evaluable»;
no se cambia el cálculo de cobertura del producto.

Se aplica la misma activación accesible por teclado a los otros checkboxes del
smoke (ritmos, áreas exclusivas y objetos de la escena), después de verificar
en el HTML que son inputs nativos. Se agrupa esta corrección del driver para
evitar resolver cada clic inestable con una nueva ejecución completa. Sus
aserciones de geometría, selección, visibilidad y datos se conservan.

# Herencia de contenedores para objetos 3D — v1

## Cambio comprobado

El HTML generaba todas las anclas `shape3d` como hijas directas de la stage,
aunque el objeto tuviera un `parent` guardado. Sus porcentajes se resolvían
contra toda la escena; el movimiento y la opacidad de su contenedor no llegaban
al objeto WebGL.

En escenas de Lienzo libre con cámara espacial, el Director valida la cadena
de padres y coloca el ancla dentro de su contenedor antes de instalar la cámara.
Participan contenedores libres comunes, hasta siete niveles, incluyendo padres
anidados. Se excluyen auto layout, listas CMS, instancias MotionLab, fixed,
modales, sticky y escenas universales; también cadenas incompletas o cíclicas.
Si el padre no se generó, se conserva el ancla en su ubicación anterior.
Las escenas apiladas, horizontales y sin cámara conservan su ruta anterior.

El renderizador compone el layout y las transformaciones CSS ya evaluadas de
los padres: origen de transformación, translate, rotate, scale y transform,
incluyendo bordes, scroll local y escalas no uniformes. Convierte esa matriz
al espacio Three y agrega la pose propia del Director. La matriz completa se
conserva, incluso cuando la composición contiene shear. La transformación del
mundo de cámara se excluye: `bindThreeCamera` ya entrega la vista correspondiente.
No se añade otro lector de scroll, evaluador de keyframes ni reloj de progreso.

La opacidad efectiva multiplica la pose propia por las opacidades de los padres
y por el alpha original del material. Un padre oculto, transparente o con matriz
singular oculta la geometría y bloquea el picking. El radio de un GLB tardío se
mide en el espacio local de su Group, independiente de escalas heredadas o de
una matriz singular anterior.

`anchorPoint` usa el plano transformado del contenedor y devuelve coordenadas
locales. El arrastre de diseño guarda porcentajes de ese padre real. La cámara,
los materiales, el bloom y los marcos proyectados siguen usando el adaptador
existente.

## Validación reproducible

Usar las dependencias y variables de entorno de `scroll-camera-v1.md` y los diez
fixtures de `spatial-bloom.browser.cjs`:

```sh
node tests/spatial-hierarchy.integration.cjs
node tests/spatial-hierarchy.browser.cjs
node .github/nagweb-camera-model-test.mjs
node .github/nagweb-camera-runtime-test.mjs
node tests/spatial-focus-map.integration.cjs
node --check js/nagweb-spatial-renderer.js
node --check js/nagweb-scroll-director-v16.js
```

La integración admite el build UMD r128 de Three como primer argumento. Usa
geometrías, matrices, cámaras y Raycaster reales; el CSSOM es un fixture.
Comprueba composición anidada, escala no uniforme, bordes y scroll local, alpha
multiplicado, inversión del plano, picking oculto, matrices singulares y su
recuperación, tamaño nativo de geometría tardía y limpieza al desconectar.

Chrome/WebGL con SwiftShader carga una forma y un GLB mínimo reales, dentro de
dos contenedores. Verifica diseño, exportación y bloom; movimiento heredado,
aislamiento de objetos externos, opacidad en píxeles, visibilidad/picking/marcos,
ausencia de tweens rivales, reduced-motion, resize y arrastre real del mouse con
porcentajes guardados en el padre. Verifica además que los tipos de contenedor
excluidos, una cámara desactivada y una escena apilada no generen reubicaciones.

Una referencia DOM independiente comprueba el centro sin animación y la matriz
afín 3D con cámara trasladada. Para esta segunda comparación, la prueba desactiva
temporalmente overflow, filtros y will-change del fixture: aísla la composición
afín del aplanamiento CSS y restituye esos estilos al terminar. No modifica esos
estilos en el producto. La prueba con cámara rotada valida la ruta Three y la
inversión del plano, pero sólo registra la diferencia DOM/Three; no afirma paridad.

Las cinco parejas anteriores de renderer, luces, bloom, interacción y timing
también se ejecutan. El harness del runtime ahora simula `window.dispatchEvent`
y verifica el anuncio real `nagweb:spatial-ready`, que antes faltaba en ese mock.
Se comprueba la sintaxis de los scripts inline del editor y los módulos editados.
Los fixtures y HTML de prueba quedan en `work/`, sin versionarse.

## Límites vigentes

- La herencia es afín en WebGL. No reproduce clipping, radio de borde, filtros,
  desenfoque ni aplanamiento de capas CSS. Opacity, filter y ciertos valores de
  overflow pueden forzar un contexto CSS plano según
  [CSS Transforms 2](https://www.w3.org/TR/css-transforms-2/#grouping-property-values).
  Por eso una malla y un hijo DOM con inclinación 3D pueden verse distintos en
  un contenedor que agrupa o recorta su contenido.
- El puente de cámara existente presenta una diferencia de proyección entre
  CSS y Three con rotaciones combinadas. En el fixture a 60%, con giro de cámara
  y padres inclinados, el centro DOM fue aproximadamente (707, 295) y el de
  Three (796, 257) px. Esa diferencia se registra; corregir el pivote y la
  convención de rotación compartida queda para una etapa específica.
- Se conservan las exclusiones de contenedores especiales. No se integra su
  timing de grupo ni la combinación con transiciones entre escenas.
- Los objetivos de «Mirar hacia» publicados en paralelo siguen cubriendo
  objetos 3D de raíz; esta etapa no habilita objetos anidados como objetivos.
  Su alcance está en [Objetivos de mirada 3D](spatial-look-targets-v1.md).
- No se valida aquí hardware móvil, rendimiento con muchas jerarquías, todos
  los materiales ni deformaciones skeleton/morph. Continúa sin oclusión DOM/WebGL.
- No se despliega en Vercel ni se integra a main. `vercel.json` conserva
  deshabilitado el despliegue Git de `feat/scroll-camera-v1`.

## Actualización posterior: vista compartida

La diferencia de proyección por giro de cámara queda corregida en
[Proyección compartida CSS / Three v1](spatial-projection-v1.md).
La comparación del fixture anidado ahora exige paridad también con cámara
rotada. Los límites de clipping, filtros y aplanamiento CSS siguen vigentes.

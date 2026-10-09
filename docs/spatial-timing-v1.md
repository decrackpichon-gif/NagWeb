# Timing individual de objetos espaciales — v1

## Cambio comprobado

Las anclas de shape3d ya participaban en el modelo del Director, pero el
renderizador espacial sólo leía su layout base. El movimiento, tamaño,
profundidad, inclinación y opacidad evaluados quedaban en un div invisible.
Además, el runtime anterior creaba sus propios ScrollTriggers sobre el Group.

Ahora el Director publica un snapshot inmutable `node.__nwSpatialPose` después
de evaluar cada elemento de una escena con cámara espacial. Contiene `x/y/z`,
`scale`, `rotate`, `rotateX/Y`, `blur` y opacidad efectiva en rango 0–1,
incluyendo la opacidad CSS base capturada. Es un puente de valores evaluados:
el renderizador no lee scroll ni evalúa keyframes o progreso. Al conectar o
cargar geometría tarde, toma el último snapshot disponible. La cámara sigue
recibiéndose mediante `nagweb:spatial-camera` / `bindThreeCamera`.

El holder combina el layout del ancla con esos desplazamientos, escala y giro.
Las unidades son CSS px; Y invierte signo, Z positivo acerca el objeto al
observador y las rotaciones locales usan el orden ZXY de la composición CSS.
El tamaño propio del Group y el giro manual del usuario siguen componiéndose
dentro del holder. Un tamaño o una opacidad de cero ocultan la geometría.

La opacidad se aplica durante cada pasada con copias de material privadas por
objeto, reutilizadas y liberadas al desconectar. Multiplica la opacidad original
del material; ajusta también `alphaTest` para conservar el umbral de recorte
durante el fade. Los materiales fuente y los arrays de materiales se restituyen
al terminar la pasada, también cuando falla el render. Las copias no escriben
profundidad mientras el fade está activo. El bloom recibe la misma geometría
atenuada, por lo que respeta tanto el fade como la desaparición completa.

Los objetos anclados elegibles en escenas con cámara espacial dejan de crear
los ScrollTriggers históricos de entrada/giro/movimiento. También dejan de
flotar, girar automáticamente o deformar la onda según el reloj del renderer.
La entrada/salida y los keyframes del Director son la fuente de movimiento.
El giro manual sigue siendo una interacción local del usuario.

El picking y los marcos de diseño usan el umbral 0.025 del Director. El snapshot
oculto impide iniciar un gesto incluso antes del próximo render. Si el objeto
sale de escena durante un giro, se cancela el gesto y se borra su inercia.
Mover/redimensionar desde el marco de diseño también termina si se oculta.

## Validación reproducible

Usar Three.js **r128** y Playwright como en `scroll-camera-v1.md`:

```sh
node tests/spatial-timing.integration.cjs
node tests/spatial-timing.browser.cjs
node --check js/nagweb-spatial-renderer.js
node --check js/nagweb-scroll-director-v16.js
```

La integración acepta el build UMD de Three como primer argumento. Verifica
poses y orden de rotación, materiales compartidos y arrays, opacidades
independientes, recorte alpha, restitución ante errores, reutilización,
geometría tardía, invisibilidad/picking y liberación de copias. También analiza
la sintaxis de todos los scripts inline del editor y los módulos modificados.

La prueba de navegador usa Chrome/WebGL con SwiftShader y el sitio generado en
diseño, exportación y exportación con bloom. Carga un GLB mínimo real con alpha
original 0.6. Mide píxeles: el fade 0.5 del Director da alpha 0.3 en render directo;
para bloom compara distintos fades manteniendo la misma pose (el resplandor
puede saturar el alpha final). Comprueba entradas/salidas, keyframes 3D,
movimiento de cámara, ausencia de tweens rivales y deriva temporal, aislamiento
entre secciones, actualización en vivo, reduced-motion, resize y scroll real.
Verifica además marcos ocultos y cancelación de giro al salir de escena.

Los fixtures opcionales de `NAGWEB_TEST_VENDOR_DIR` son los diez usados en
`spatial-bloom.browser.cjs`. El HTML generado queda en `work/`, sin versionar.
Las cuatro parejas de pruebas anteriores de renderer, luces, bloom e interacción
también se ejecutan. Sus fixtures fijan `sdEnter:'none'` para mantener objetos
visibles cuando están comprobando cámaras/luces y no timing.

## Límites vigentes

- El desenfoque individual se evalúa pero todavía no se aplica en WebGL.
  Las entradas/salidas «blur» sí respetan su fade de opacidad.
- El alcance es el timing propio de anclas elegibles de la escena. No se integra
  la herencia de transformaciones de contenedores o instancias de movimiento,
  ni su timing de grupo, ni las transiciones entre escenas con WebGL.
- No se agregan objetivos 3D de «Mirar hacia», oclusión DOM/WebGL, animación
  interna de GLB, skeleton/morph ni nuevos controles de deformación de ondas.
- Los materiales estándar y el GLB mínimo están comprobados. Shaders propios,
  todos los modos de blending, transparencias complejas y modelos grandes no
  tienen cobertura visual completa. Los fades siguen el orden de transparencia
  de Three.js; no implementan transparencia independiente del orden.
- Los marcos de diseño usan bounds aproximados. No se valida aquí toda la
  edición de tamaño de modelos complejos con inclinaciones locales grandes,
  ni rendimiento/hardware móvil.
- Las escenas sin cámara espacial y los objetos sin ancla conservan la ruta
  histórica. No se despliega en Vercel ni se hace merge a main.

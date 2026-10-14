# NAGWEB 02 · Referencias originales verificadas (14/10/2026)

> **Alcance:** informe técnico original generado a partir de los archivos originales que el usuario había adjuntado en chats anteriores. Complementa, no reemplaza, `docs/contexto/NAGWEB_02_Motion_Lab_CONTEXTO.md`, ni la documentación técnica ni la rama actual. Esta es una fotografía; comprobar siempre el último HEAD.

## Fuentes efectivamente abiertas

| Archivo exacto (Biblioteca de ChatGPT) | Inspección realizada | Qué aporta |
|---|---|---|
| `animos har.har`, original 02/10/2026, 3 514 246 bytes | JSON HAR decodificado; 24 solicitudes; scripts, HTML, CSS, imágenes y archivos externos catalogados | 64 nombres e identificadores de presets observados en el bundle público de Animos |
| `Grabación de pantalla 2026-10-04 122158.mp4` | Video H.264 1918×946, ~11,07 s; muestreo en varios instantes | Editor Animos en tema oscuro, panel de presets, composición Showcase Stream de anillo de tarjetas y control temporal |
| `Grabación de pantalla 2026-10-04 122504.mp4` | Video H.264 1612×808, ~48,63 s; inspección de panel y estados a lo largo del video | Interacción de inspector: fondo, colores/degradados y ajustes geométricos de Showcase Stream |
| `animo-showcase-stream-720p.webm` | Video VP9 1280×720, ~15,97 s; fotogramas de distintos momentos | Resultado de movimiento: anillo continuo, tarjetas con perspectiva, caras cercanas más visibles y traseras atenuadas |

**Disponibilidad:** los cuatro originales están en la **Biblioteca de archivos del usuario**, no en este repositorio. Si el asistente tiene acceso a Files/Biblioteca, buscar los **nombres exactos**; si necesita volver a inspeccionar píxel a píxel y no puede recuperar un original, pedir al usuario **solo ese archivo**, sin exigir un nuevo paquete entero. El informe ya recoge observaciones verificadas y evita bloquear el trabajo por falta de originales. Nunca afirmar que se miró un archivo que el chat nuevo no haya abierto.

## HAR: datos objetivos y límites

- Captura del editor público `https://animos.app/editor` con **24 entradas HTTP**, de las cuales **20** pertenecen a `animos.app`. Las demás proceden de Google Fonts y Cloudflare Insights. `24 solicitudes` NO significa `24 animaciones`.
- Presets registrados en un módulo JavaScript del sitio: **64 pares distintos ID/nombre** (índice completo más abajo). Este listado es de la captura de octubre de 2026, **no un catálogo actualizado en vivo**, **no** una lista de funciones completadas en NagWeb.
- Recursos técnicos principales observados por ruta pública: `/assets/index-DfuJopl2.js`, `/assets/EditorPage-QMGwiHDc.js`, `/assets/logo-animos-dark-BUj1PpkT.js`, `/assets/defaultMedia-B_MWAEft.js`, `/assets/index-BxvBFEjv.css`; 10 imágenes de muestra `/assets/sample-01-...` a `/assets/sample-10-...`. Las cadenas hashes pueden cambiar. Este inventario **no** replica código ni archivos de Animos.
- El HAR sí almacenaba cuerpos de recursos cargados, incluidos scripts minificados de terceros. **No se publica el HAR ni se copia código** en este repositorio. Al examinar cualquier HAR revisar cookies, autorizaciones, URL con parámetros y otros datos sensibles antes de compartirlo.
- Los identificadores confirman que los presets `showcase-stream`, `iso-orbit`, `iso-focus`, `scatter-dial`, `card-tunnel`, `grid-reveal` y `pop-grid` aparecían en la captura, pero **la fidelidad funcional de NagWeb debe evaluarse caso por caso**, no por similitud de nombres.

## Observaciones originales de los videos: Showcase Stream

1. El editor muestra galería lateral de animaciones, lienzo/previsualización central, inspector derecho y una zona inferior de controles de reproducción/keyframes. Se puede personalizar antes de exportar o usar la composición.
2. Showcase Stream dispone tarjetas distribuidas en un **anillo tridimensional inclinado**: aparecen rotación continua, variación de orientación con el recorrido, efecto de perspectiva y atenuación de tarjetas lejanas. Hay fondo oscuro y variante degradada.
3. La grabación larga **muestra interacción con los controles**, no solo un render. A los ~13 s se ven una sección de fondo con alternativas `Colour / Gradient / Image` y presets, seguida de controles de Padding, Corner radius, Ring tilt, Ring opening, Ring size, Card size, Back fade, Perspective y Card ratio. Los valores observados **en ese instante** incluyen padding 0 %, radio 3 %, inclinación 5°, apertura 55 %, tamaño de anillo 80 %, tamaño de tarjeta 21 %, atenuación posterior 70 %, perspectiva 18 %, ratio 16:9.
4. Hacia los ~33 s de la misma grabación se ven otros **valores de edición transitorios**: padding 0 %, radio 10 %, inclinación 31°, apertura 63 %, tamaño 79 %, tarjeta 22 %, atenuación 85 %, perspectiva 2 %, ratio 16:9. **No confundir estos valores de prueba con los defaults del preset**, documentados en el contexto técnico.
5. El video breve del editor recorre el anillo en previsualización con paneles visibles, mientras el WebM muestra únicamente el resultado audiovisual, sin panel de edición. Son evidencias complementarias de interfaz y de animación.
6. La captura solo documenta **Showcase Stream**. No usarla para declarar verificados Grid Dive, Pop Parade u otras animaciones cuyo comportamiento original no aparece en estos videos.

## Catálogo del HAR: 64 presets identificados, no implementaciones certificadas

| # | ID en la referencia | Nombre de Animos |
|---:|---|---|
| 1 | `stack-slide` | Stack Slide |
| 2 | `carousel-flow` | Carousel Flow |
| 3 | `diagonal-carousel` | Diagonal Carousel |
| 4 | `grid-reveal` | Grid Reveal |
| 5 | `zoom-parallax` | Zoom Parallax |
| 6 | `split-reveal` | Split Reveal |
| 7 | `cascade-drop` | Cascade Drop |
| 8 | `focus-shift` | Focus Shift |
| 9 | `ticker-loop` | Ticker Loop |
| 10 | `ticker-tilt` | Ticker Tilt |
| 11 | `pop-grid` | Pop Grid |
| 12 | `center-stage` | Center Stage |
| 13 | `diagonal-wipe` | Diagonal Wipe |
| 14 | `stripe-reveal` | Stripe Reveal |
| 15 | `mosaic-wipe` | Mosaic Wipe |
| 16 | `hero-reel` | Hero Reel |
| 17 | `flip-grid` | Flip Grid |
| 18 | `orbit-carousel` | Orbit Carousel |
| 19 | `column-drift` | Column Drift |
| 20 | `spotlight-zoom` | Spotlight Zoom |
| 21 | `showcase-stream` | Showcase Stream |
| 22 | `spiral-stream` | Spiral Stream |
| 23 | `film-strip` | Film Strip |
| 24 | `card-totem` | Card Totem |
| 25 | `deck-peel` | Deck Peel |
| 26 | `poster-burst` | Poster Burst |
| 27 | `photo-orbit` | Photo Orbit |
| 28 | `wheel-carousel` | Wheel Carousel |
| 29 | `wheel-spin` | Wheel Spin |
| 30 | `wheel-spin-bottom` | Wheel Spin Bottom |
| 31 | `cover-flow` | Cover Flow |
| 32 | `cover-flow-vertical` | Cover Flow Vertical |
| 33 | `cover-ring` | Cover Ring |
| 34 | `cover-ring-vertical` | Cover Ring Vertical |
| 35 | `image-trail` | Image Trail |
| 36 | `position-dance` | Position Dance |
| 37 | `cascade-deck` | Cascade Deck |
| 38 | `orbit-showcase` | Orbit Showcase |
| 39 | `orbit-bloom` | Orbit Bloom |
| 40 | `focus-orbit` | Focus Orbit |
| 41 | `focus-slider` | Focus Slider |
| 42 | `sphere-wall` | Sphere Wall |
| 43 | `sphere-cascade` | Sphere Cascade |
| 44 | `totem-wall` | Totem Wall |
| 45 | `parallax-totem` | Parallax Totem |
| 46 | `vortex-spin` | Vortex Spin |
| 47 | `sphere-globe` | Card Globe |
| 48 | `orbit-globe` | Orbit Globe |
| 49 | `card-tunnel` | Card Tunnel |
| 50 | `card-toss` | Card Toss |
| 51 | `mosaic-marquee` | Mosaic Marquee |
| 52 | `iso-cascade` | Iso Cascade |
| 53 | `iso-focus` | Iso Focus |
| 54 | `iso-orbit` | Iso Orbit |
| 55 | `grid-zoom-strip` | Grid Zoom Strip |
| 56 | `depth-stack-scroll` | Depth Stack Scroll |
| 57 | `spread-rows` | Spread Rows |
| 58 | `spread-columns` | Spread Columns |
| 59 | `sweep-ring` | Sweep Ring |
| 60 | `triple-scene` | Triple Scene |
| 61 | `collage-reel` | Collage Reel |
| 62 | `feed-scroll` | Feed Scroll |
| 63 | `fan-shuffle` | Fan Shuffle |
| 64 | `scatter-dial` | Scatter Dial |

## Método obligatorio para siguientes chats: commits, pruebas y referencias

1. **GitHub commits**: consultar `https://api.github.com/repos/decrackpichon-gif/NagWeb/commits?sha=internal-motion-lab&per_page=15` o [historial web](https://github.com/decrackpichon-gif/NagWeb/commits/internal-motion-lab/). Se verificó que el listado cronológico **sí está accesible** por la integración GitHub. No afirmar que falta sin intentar la consulta de commits de esta rama.
2. **GitHub Actions**: consultar `https://api.github.com/repos/decrackpichon-gif/NagWeb/actions/runs?branch=internal-motion-lab&per_page=10`, y para el último run `https://api.github.com/repos/decrackpichon-gif/NagWeb/actions/runs/RUN_ID/jobs?per_page=100`. Si sigue corriendo, decirlo: no inventar `success`, no volver a ejecutar todas las pruebas. [Acceso visual a ejecuciones](https://github.com/decrackpichon-gif/NagWeb/actions?query=branch%3Ainternal-motion-lab).
3. **Estado comprobado en esta revisión:** al inicio del 14/10/2026, HEAD `dbe698e61a8c68ba8d24bff878d26359fad5c05b`, commit de corrección de lienzos/slots vacíos. Última ejecución completa conocida `38502294631` **success** (commit `f34d840`). La ejecución `38512783725` del HEAD tenía **45 de 55 jobs terminados exitosamente, 10 en curso, sin fallos a esa hora**. Consultar su estado actualizado, no tratar este punto como resultado definitivo.
4. **Originales:** los cuatro archivos están en la Biblioteca personal, no en GitHub. Se inspeccionaron para producir **este informe verificable**, pero los próximos chats deberán consultar los originales cuando la tarea exija fidelidad visual nueva. Pedir un original específico solo si falla el acceso.
5. **Prioridad de producto:** fidelidad comprobable a Animos primero, luego controles propios, finalmente diseños originales. Evitar reimplementar templates existentes: el estado actual del código decide.
6. **Sin Vercel:** `vercel.json` tiene `git.deploymentEnabled: false`; no cambiarlo ni publicar por commits de documentación o tests. No merges ni cambios en otros frentes.

### Regla de actualización

Este informe es un registro de fuentes **observadas en una fecha**, no el lugar para acumular cada nueva corrección. Actualizar la ficha de continuidad cuando aparezcan nuevos enlaces originales o decisiones importantes; el estado actual se verifica en GitHub cada vez.

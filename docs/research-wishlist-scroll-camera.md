# Research wishlist · Scroll Camera / DOM + WebGL

Este documento reúne referencias externas que pueden aportar ideas concretas al desarrollo de la cámara de escena de NagWeb.

## Prioridad alta

### 1. DOM + WebGL sincronizados por cámara o viewport
Buscar repositorios, demos y artículos con términos como:

- three.js DOM WebGL synchronization
- three.js CSS3DRenderer WebGLRenderer combined
- DOM element follows Three.js camera
- Three.js object follows DOM element
- DOM overlay WebGL camera projection
- getBoundingClientRect Three.js projection
- WebGL DOM mixed scene camera
- scroll driven Three.js camera DOM overlay

Objetivo: comparar nuestro puente NAGWEB_3D_ANCHOR con soluciones que mantienen DOM y WebGL en un mismo recorrido visual.

Referencias oficiales útiles:
- https://threejs.org/docs/pages/CSS3DRenderer.html
- https://drei.docs.pmnd.rs/misc/html
- https://drei.docs.pmnd.rs/portals/view

### 2. Cámara narrativa por scroll
Buscar:

- Three.js camera scroll keyframes
- Three.js scroll driven camera path
- spline camera path scroll Three.js
- GSAP ScrollTrigger Three.js camera
- scroll scrub camera Three.js
- camera rig scroll storytelling
- camera path editor WebGL

Objetivo: estudiar cómo resuelven recorridos, easing, pausas, interpolación, curvas, look-at y edición visual.

### 3. Edición visual de cámara 3D
Buscar:

- Three.js camera path editor
- Three.js camera keyframe editor
- WebGL camera timeline editor
- camera gizmo Three.js editor
- Theatre.js Three.js camera sequence

Referencia:
- https://www.theatrejs.com/docs/latest/getting-started/with-three-js

Objetivo: ideas para una futura evolución del mapa X/Z + X/Y hacia una edición espacial más intuitiva.

## Prioridad media

### 4. Ocultamiento y profundidad real entre HTML y WebGL
Buscar:

- HTML WebGL occlusion
- Three.js DOM occlusion
- CSS3D WebGL occlusion
- drei Html occlude
- depth buffer DOM WebGL

Objetivo: entender qué hacer si más adelante queremos que un objeto WebGL pueda pasar visualmente por delante o detrás de contenido HTML.

### 5. Vistas WebGL que siguen elementos DOM
Buscar:

- WebGL view follows DOM rect
- Three.js scissor DOM element
- React Three Fiber View DOM tracking
- multiple WebGL views one canvas

Referencia:
- https://drei.docs.pmnd.rs/portals/view

Objetivo: evaluar si algunos objetos 3D de NagWeb podrían compartir un canvas y seguir regiones DOM sin crear un renderer por elemento.

### 6. Movimiento de cámara suave sin perder scrub exacto
Buscar:

- damped camera scroll scrub
- camera smoothing scroll Three.js
- critically damped camera interpolation
- spring camera scroll deterministic
- scroll velocity camera damping

Objetivo: encontrar suavizado que se sienta orgánico pero conserve una relación determinista con el porcentaje del Director.

## Qué material sirve más

En orden de utilidad:

1. Demo que haga exactamente un comportamiento que queramos copiar.
2. Repositorio con código ejecutable de esa demo.
3. CodePen / StackBlitz / CodeSandbox.
4. Artículo técnico con implementación.
5. Video donde se vea claramente el comportamiento.
6. HAR de una demo pública, cuando el comportamiento depende de código cargado dinámicamente.

Si mandás un HAR, usar preferentemente una ventana incógnita y una página pública. Antes de compartirlo, revisar que no contenga cookies, tokens, Authorization headers, datos personales ni sesiones autenticadas.

## Qué anotar al mandar una referencia

No hace falta analizar el código. Alcanzan comentarios de este estilo:

- “Quiero exactamente cómo se mueve la cámara acá.”
- “Me interesa cómo mezcla HTML con objetos 3D.”
- “Quiero poder editar el recorrido así.”
- “Me interesa cómo el objeto pasa delante/detrás del texto.”
- “Quiero este tipo de suavidad pero controlado por nuestro Director de Scroll.”

Ese criterio visual suele ser más útil que intentar adivinar qué técnica usa internamente.

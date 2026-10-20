# NAGWEB 03 | Cámara 3D · Propuesta UX de storytelling espacial

> 12/10/2026. **Propuesta para evaluación, no implementación aprobada.** Rama exclusiva `feat/scroll-camera-v1`. Código y commits siguen siendo fuente de verdad.

## Origen del problema
Feedback de la primera grabación del usuario: `Grabación de pantalla 2026-10-12 125329.mp4` (archivo privado, **no subir al repositorio**), duración aprox. 3:03. Captura el editor de «Estudio Cardinal» con textos «Trabajos / Lo último» y una imagen de camión. El usuario probó la cámara y sus campos numéricos.

Problemas observados/declarados:
1. En «Mapa del recorrido» no se ven referencias de objetos útiles o son difíciles de encontrar. Se necesita situar **cámara y objetos en el mismo espacio**.
2. No es descubrible cómo colocar **texto, imagen y GLB a distintas profundidades** y cómo hacer atravesar esos planos con la cámara al hacer scroll.
3. Campos de números del inspector con **fondo blanco y texto gris/blanco casi ilegible** (confirmado visualmente alrededor del segundo 95).
4. Panel de cámara con controles extensos y mezclados; cuesta encontrar las operaciones centrales.
5. Objetivo aspiracional: experiencias cinematográficas de alta calidad, con objetos 3D, DOM integrado, oclusión y profundidad verificable. No copiar interfaces propietarias ni atribuir a una librería los efectos de una página sin evidencia.

## Estado real aprovechable (revisar HEAD antes de implementar)
- Director determinista `0→1`, keyframes, cámara X/Y/Z, orientación manual y lookAt, mapa superior/frontal/lateral, curvas y suavizados por tramo.
- `js/nagweb-scroll-camera.js`: `C.elementPanel` ya permite `sdCameraDepth` / «Profundidad fija (px)» a elementos DOM elegibles. **No inventar un segundo campo sin resolver compatibilidad**.
- `mapObjectPlan` / `mapObjectVisible`: existe «Mostrar objetos de la escena» y un inspector, pero sólo para `layout === 'free'`, filtrado y con hasta 16 entradas; la guía no sustituye una vista editable de composición.
- Los modelos `shape3d` usan `offZ` y campos base de giro/escala. Necesitan UI espacial coherente con los planos DOM, sin alterar el contrato del renderizador ni sus keyframes.
- `js/nagweb-scroll-director-v16.js`: `paneSceneNew` expone Director dentro de las propiedades de escena, con Cámara 3D anidada. No crear otro reloj o importación de motor con scroll paralelo.
- Suite espacial, WebGL y Chromium con modelo GLB: [integración aprobada](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38195782867). Esa prueba no valida por sí sola la ergonomía con proyectos complejos.

## Propuesta de interfaz
**Entrar a «Editar espacio 3D» desde la escena**, sin necesidad de recorrer acordeones. Modo alternable junto a «Resultado». Se trataría de otra vista de la misma escena, no una app separada.

Distribución:
- Izquierda: **Contenido de escena**, árbol de nombres reales y tipos (texto, imagen, modelo 3D, contenedor), visible/oculto, profundidad, selección sincronizada. Acciones «Agregar al espacio» y «Centrar selección».
- Centro: **Viewport** visual amplio. Alternar «Resultado» / «Editar espacio»; vistas «Perspectiva», «Superior X/Z», «Frontal X/Y» y «Lateral Z/Y»; frustum y recorrido visibles en edición, nunca exportados. Manipulador universal mover X/Y/Z, girar, tamaño, con unidades coherentes y manejo local/global cuando corresponda.
- Derecha: inspector contextual **Objeto** o **Cámara**. Primero controles esenciales, «Avanzado» plegado. «Posición X/Y/Z», «Giro», «Tamaño», «Profundidad respecto de la cámara» y «Ajustar al encuadre». Entrada de números con colores accesibles.
- Abajo: **Una línea narrativa** del Director (0–100 %), con waypoints de cámara y bandas de objetos (entrada/recorrido/salida). Al seleccionar waypoint: posición/rotación/lookAt/easing/pausa, y longitud de scroll de ese tramo. Cualquier cambio visual crea un keyframe únicamente mediante edición intencional, no por pasar el mouse.
- **Mapa del recorrido** ampliable o desacoplable con etiquetas de objetos siempre legibles, tipos con colores, posiciones y profundidad. Mostrar **todos** los objetos elegibles de la escena, incluyendo planos HTML y modelos, sin truncarlos silenciosamente a 16. Aclarar limitaciones de geometría/huella.

**Separar dos acciones:** «Mover el objeto» cambia la profundidad/pose persistente del objeto; «Mover la cámara» cambia sus waypoints. Son operaciones relacionadas, pero no intercambiables. Evitar controles numéricos duplicados.

## Historia de referencia y criterio de aceptación
Caso: **Texto A → foto → texto B**, planos a distancias Z diferentes, cámara avanza según scroll. Al acercarse a cada plano, su tamaño aparente crece por perspectiva; al pasar el plano y quedar detrás del observador sale del encuadre/recorte de forma coherente. Foto y textos posteriores permanecen en el fondo hasta su acercamiento. No animar artificialmente `scale` para simular una cámara que avanza si el modelo de perspectiva ya lo resuelve.

Una opción de inicio «**Viaje a través de capas**» puede crear tres elementos de prueba y un recorrido editable, con las mismas primitivas existentes. Es un ejemplo optativo de uso, no un motor nuevo.

Aceptación funcional:
- Mover A/B/foto en Z arrastrando o desde inspector; el mapa y la vista previa se actualizan juntos.
- Mover waypoint de cámara y scrub a 0/25/50/75/100% reproduce la MISMA pose determinista en vista previa y exportación.
- Escalar hasta salir del encuadre por perspectiva y recortar correctamente cuando la cámara atraviesa el plano, sin saltos, inversión ni artefactos.
- Conserva estructura DOM real para enlaces, texto seleccionable, accesibilidad y SEO en modo compatible.
- Undo/Redo, selección y exportación coherentes; compatibilidad con escenas guardadas y respuesta móvil; reduced-motion con resultado accesible.
- Textos del inspector y placeholders cumplen contraste suficiente en tema oscuro y claro.

## Oclusión y calidad visual: niveles de implementación
1. **Profundidad espacial y orden en 2.5D**: usar plano/cámara/frustum común y validar clips cerca/detrás de cámara. Prioridad para el caso narrado por el usuario.
2. **Oclusión simple HTML/3D**: proyectar DOM en el espacio y ocultarlo cuando geometría WebGL lo tapa, sin pretender que CSS z-index sea suficiente; evaluar raycasting y límites de ocultamiento de elemento completo.
3. **Oclusión parcial real**: máscaras/depth geometry/representación proxy de DOM en escena WebGL para intersecciones parciales, composición correcta y regresión de dispositivos. Esto es técnicamente distinto del nivel 1 y debe medirse en rendimiento.
4. **Acabado opcional**: bloom/refraction/partículas/sombras/cámara suave y presets exportables; no sacrificar tiempos de carga, legibilidad, input ni accesibilidad. No asumir que todas las demos de Apple sean mallas WebGL: algunas secuencias usan frames/video.

La implementación se puede inspirar en [TransformControls oficial](https://threejs.org/docs/pages/TransformControls.html), [drei Html / occlude](https://drei.docs.pmnd.rs/misc/html) y [CSS3DRenderer](https://threejs.org/docs/pages/CSS3DRenderer.html); **evaluar técnica, licencia, costos y compatibilidad antes de incorporar dependencias**.

## Referencias visuales aportadas por el usuario (no son bibliotecas para copiar)
- Apple AirPods Pro: https://www.apple.com/airpods-pro/ (producto/escala/scroll; verificar si cada efecto específico usa WebGL, canvas o secuencias).
- Moooi, A Life Extraordinary: https://www.moooi.com/en/a-life-extraordinary (inmersión, recorrido y composición).
- Chartogne-Taillet: https://chartogne-taillet.com/fr (mapa cinematográfico, dirección de arte e interacción; ficha oficial de producción https://immersive-g.com/projects/chartogne-taillet-1).
- Lusion: https://lusion.co/ (acabado, transiciones, efectos y experiencia; recursos específicos por investigar, no prometer «copiarlos todos»).
- Darkroom Engineering Backrooms: https://darkroom.engineering/backrooms (interacciones de interfaz y scroll).
- The Goonies / Joseph Berry (Webflow): referencia verbal del usuario, **URL concreta y autoría por verificar**.
- Capturas Wappalyzer del 12/10/2026: React/GSAP/Flickity en Moooi; Vue/GSAP/Howler en Chartogne; Astro/Three.js en Lusion; Next.js/GSAP/Lenis/Tempus en Darkroom. **Una detección de stack no identifica el código causante de una animación**.

## Siguiente entrega de desarrollo propuesta (pendiente de «Avanza»)
**Un avance cohesivo en NAGWEB 03**: reparar contraste numérico y descubribilidad; mostrar todos los objetos en un mapa espacial utilizable; unificar inspector y manipulación directa de profundidad Z para HTML/imágenes/GLB; añadir una escena demostración de «viaje entre capas» y tests de cámara/DOM/WebGL bajo scroll. Luego evaluar la oclusión parcial real con pruebas y costo medido, no como simple parámetro cosmético.

**Regla:** no tocar `main`, otros NAGWEB, Vercel ni introducir otro controlador del scroll. Antes de aplicar el diseño, contrastarlo con lo que el usuario prefiera tras leer la propuesta.

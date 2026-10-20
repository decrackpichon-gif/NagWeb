# Cámara 3D 2.0 · arquitectura, contrato y límites

Base: `92a0572` (CAMARA_BASE). Rescatado de CAMARA_MEJORAS `b89bc70`: oclusión parcial por GPU, mapa ancho
y centrado CSS. No se aplicó su diff completo.

## 1. Qué hay de nuevo

| Pieza | Archivo | Qué hace |
|---|---|---|
| Matemática de la vista | `js/nagweb-spatial-view.js` | Cámara de trabajo (perspectiva + 3 ortogonales + "desde la cámara"), proyección, rayos, ejes y planos. Sin reloj, sin proyecto. |
| Espacio 3D grande | `js/nagweb-spatial-workspace.js` | Pantalla de trabajo: lista de contenido, lienzo, inspector y línea de tiempo. Dibuja en Canvas2D (no necesita THREE). |
| Puente con el editor | `C.workspaceHost` en `js/nagweb-scroll-camera.js` | Única vía por la que el espacio lee/escribe el proyecto. |
| Oclusión parcial | `js/nagweb-spatial-renderer.js` | HTML delante/detrás de un GLB, píxel a píxel; los huecos muestran lo de atrás. |
| Mapa ancho | `js/nagweb-scroll-camera.js` | El mapa 2D del panel se puede expandir. |

Botón de entrada: **◈ Abrir Espacio 3D · pantalla grande** en el panel de Cámara de la escena.
El mapa 2D del panel sigue disponible.

## 2. Convención de ejes (una sola, en todos lados)

Autoría A = (x, y, z): **x derecha, y ABAJO (CSS), z ADELANTE** (hacia donde avanza la cámara).
Una capa HTML con `sdCameraDepth` positivo está **más cerca del ojo**. Corregido en esta versión:
la base tenía el signo de Z de las capas invertido entre mapa y escena; se midió por píxeles.

| Vista | Derecha de la pantalla | Arriba de la pantalla |
|---|---|---|
| Superior | +X | +Z (adelante) |
| Frente | +X | arriba real (y negativa de autoría) |
| Costado | +Z (adelante) | arriba real |
| Perspectiva | libre (órbita) | arriba real |

Cámara narrativa: `rotateX` positivo mira hacia abajo, `rotateY` positivo gira a la izquierda,
`rotate` es el giro lateral. Mundo Three = (x, −y, −z).

## 3. Contrato del Director de Scroll

* **Una sola fuente de progreso**: el Director (`NAGWEB_SCROLL_DIRECTOR`; en el exportado
  `window.__NAG_SCROLL_DIRECTOR[idDeEscena].set(0..1)`). No hay Lenis, ScrollTrigger ni otro reloj
  que mande sobre la cámara.
* **La vista de trabajo NO es la cámara narrativa.** Orbitar, panear, hacer zoom, encuadrar y cambiar
  de vista no guardan, no agregan pasos de Deshacer y no tocan ningún encuadre (test:
  `tests/camera-workspace.browser.cjs`).
* El control de momento del espacio llama al Director; no tiene reloj propio.
* Mismo porcentaje ⇒ misma pose en editor y exportado (medido: 0 px de diferencia en texto, foto y
  ancla 3D en 0/25/50/75/100 %, `tools/capture-moments.cjs`).
* Mover **objeto** y mover **cámara** son acciones distintas: flechas/planos del objeto vs. ◆ de la
  cámara. Un gesto = un solo Deshacer; Escape cancela sin guardar; Shift = precisión (en planos,
  bloquea el eje).

## 4. Composición 3D + HTML y contrato de oclusión

* Cada plano HTML opaco entra en un pase de profundidad de GPU; el GLB se compara píxel a píxel.
  Donde el HTML está detrás, se recorta con `clip-path`; donde queda un hueco del modelo, se ve lo de atrás.
* **Alfa / transparencia**: sólo ocluyen las superficies opacas (y las de recorte *alphaTest* /
  glTF MASK, que conservan sus huecos). Las superficies con mezcla (BLEND), opacidad < 1, mapa alfa
  sin recorte, shaders propios, wireframe, desplazamiento o planos de corte **no ocluyen**: el HTML
  queda delante.
* **Modelos con esqueleto / morph targets**: no ocluyen (no se dibujan en el pase de profundidad).
  Se ven bien; sólo no tapan HTML.
* **HTML que no ocluye**: con transparencia, máscara, filtro, modo de mezcla, transformaciones o
  recortes de ancestros. Se prefiere "HTML adelante" a dibujar algo inexacto.
* **Falla abierta**: si la oclusión parcial no está disponible, se avisa en consola y el HTML queda
  delante. Se puede desactivar con `{inverseOcclusion:false}` en las opciones del renderizador.
* **Límites medidos por diseño**: profundidad hasta 1024 px, máscara hasta 256 px. El borde del corte se ve
  levemente escalonado (se ve en las capturas); es el costo de recortar sin rasterizar el HTML.
* **Unidad del Z de objetos 3D**: `offZ` se mide en 1/12 de la **altura del escenario**; el Z de las
  capas HTML se mide en px. Por eso una escena que mezcla ambos cambia levemente de profundidad relativa si
  se la mira con otra altura. La escena de aceptación está calculada para 1030 px de alto (editor a 1440×900)
  y el exportado se verifica con ese mismo tamaño.

## 5. Persistencia y esquema

Sin cambios de esquema: la Cámara 2.0 usa los mismos campos (`sdCameraFrames`, `sdCameraDepth`,
`shape3d`, `assets.models`). El ejemplo "Crear ejemplo completo" ahora crea la foto como **imagen real del
proyecto** (`type:'image'` + `assets.images`); antes creaba un tipo `img` que NagWeb no dibujaba. Los
proyectos viejos no necesitan migración.

## 6. Rendimiento

Ver `evidencia/rendimiento.json` (medido con `tools/measure-performance.cjs`). Se informa el
navegador y el renderizador reales. En este entorno **no hay GPU**: las cifras sirven para comparar
variantes entre sí (con/sin oclusión parcial), no son cifras de la GTX 1050 ni de iPhone/iPad. Eso queda
**pendiente de medir en tu equipo** (instrucciones en `AUDITORIA_DEVOLUCION.md`).

## 7. Limitaciones conocidas

* La oclusión parcial recorta con polígonos: el borde es escalonado, no suavizado.
* Modelos con esqueleto no ocluyen.
* Mezclar Z de objetos 3D (1/12 de la altura) y Z de capas HTML (px) depende del alto del escenario.
* El Espacio 3D dibuja líneas y cajas (alambre), no el modelo con materiales; el modelo real se ve en la
  vista previa.
* No se probó en iPhone/iPad ni en Windows/GTX 1050 reales.

## 8. Dependencias y licencias

Sin dependencias nuevas en el producto. Three r128 (MIT, ya usado), GSAP 3.12.5 (licencia GreenSock, ya
usado). `playwright` sólo para pruebas. El GLB de aceptación se genera con `tools/make-acceptance-glb.mjs`
(propio, sin recursos privados).

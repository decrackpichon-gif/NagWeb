# NAGWEB 02 | Motion Lab — entrega V1.0

**Estado: V1.0 funcional, con validación técnica automatizada aprobada.** Entrega en la rama exclusiva `internal-motion-lab`. No implica merge a `main` ni despliegue en Vercel.

## Versión comprobada

- **Código validado:** [`7fe46a03`](https://github.com/decrackpichon-gif/NagWeb/commit/7fe46a033943b5979927d692f490b7de5f4ca72b).
- **GitHub Actions:** [ejecución 38773569183](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38773569183), **55 de 55 jobs exitosos**, sin fallos, correspondiente exactamente al commit anterior.
- Los commits siguientes etiquetados `[skip ci]`, si solo modifican documentación, no cambian el código validado. Revisar HEAD de la rama antes de aceptar desarrollos posteriores.

## Funciones incluidas y alcance cerrado

El recorrido principal de Motion Lab 1.0 incluye:
1. Abrir el catálogo desde el botón **Motion Lab** de la barra superior del editor NagWeb (o desde **Motion Lab · escenas animadas** junto a las escenas).
2. Elegir una composición, **previsualizarla y personalizarla antes de insertarla** (contenido, imágenes, texto y parámetros habilitados para ese preset).
3. Elegir **Loop continuo** o **Secuencia por scroll** según la plantilla, sin depender exclusivamente del Director de Scroll.
4. Insertar mediante **Insertar en esta escena** o **Como escena nueva**, y volver a abrir una composición insertada con **Editar en Motion Lab**.
5. Guardar una variante mediante **Guardar en Biblioteca**, conservar sus elementos editables y recuperarla.
6. Conservar composiciones tras guardar/reabrir el proyecto y generar el **HTML exportado** con las animaciones activas.

El runtime, el modelo geométrico y el editor comparten el sistema actual de NagWeb. Los casos importantes de recorte de imagen, cambios de orden, selección, loops y exportación están cubiertos por la batería automatizada. En particular, Showcase Stream conserva la identidad de la plantilla en composiciones nuevas y heredadas, y su recorte se comprueba sobre el lienzo compartido de profundidad.

**No se afirma reproducción visual idéntica de los 64 originales de Animos.** Los controles originales se contrastan únicamente cuando hay referencia verificable (HAR, videos o fixtures). La cobertura de GitHub Actions demuestra los flujos automatizados, no sustituye una evaluación estética personal en Windows o iPhone.

## Cómo abrir esta V1.0 desde GitHub Desktop (Windows)

1. Abrí **GitHub Desktop** y seleccioná el repositorio **NagWeb**.
2. En **Current Branch** elegí `internal-motion-lab`. Usá **Fetch origin** y **Pull origin** si se ofrece. No cambies a `main` para esta prueba.
3. En el menú **Repository** elegí **Open in Visual Studio Code**.
4. Abrí el archivo `index.html` del directorio raíz con la extensión **Live Server** de VS Code (**Open with Live Server**). Si no la tenés, instalá esa extensión desde Extensions. No necesitás Python ni el comando `py`.
5. En el navegador, pulsá **Motion Lab** en la barra superior.

Motion Lab está integrado en el editor web. No hay un ejecutable de Windows ni una página independiente de Motion Lab que sea necesario instalar.

## Aceptación manual breve (sin tareas de desarrollo nuevas)

1. Abrí **Showcase Stream**. Confirmá que ves las imágenes animadas, sin rectángulo negro ni pantalla vacía.
2. Elegí una imagen, reemplazala por un archivo tuyo, modificá el encuadre y comprobá que la previsualización siga visible.
3. Elegí otro preset, por ejemplo **Carousel Flow**. Cambiá un control y probá **Loop continuo** y **Secuencia por scroll**.
4. Insertá la animación con **Insertar en esta escena**. Volvé a seleccionarla y pulsá **Editar en Motion Lab**. Comprobá que conserve los cambios.
5. Guardá una composición en la **Biblioteca**, cerrá y volvé a abrir Motion Lab, y recuperala.
6. Guardá el proyecto y usá la **exportación HTML** del editor. Comprobá que las animaciones se vean y se muevan en la página exportada.

**Aceptación:** si estos seis recorridos funcionan, dar por aceptada la V1.0. Si falla alguno, informar preset, paso y resultado observable para resolver solo ese bloqueador. No ampliar alcance durante la aceptación.

## Queda para V1.1+

Animaciones originales nuevas, controles no imprescindibles, variantes de diseño y ajustes estéticos finos, optimizaciones sin bloqueo funcional y equivalencia visual de presets que no cuenten con referencia original suficiente. Estas posibilidades **no impiden el cierre de V1.0**.

## Límites y protección de la entrega

- Entrega en `internal-motion-lab`, **sin merge ni despliegue a Vercel**.
- El proyecto no declara verificación física en todos los dispositivos; la batería automatizada se ejecutó en el entorno de GitHub Actions.
- Se conserva el código y los archivos de proyecto; no se eliminan funciones previas para conseguir el cierre.
- La política superior de **V1.0 primero** está en `AGENTS.md`, la ficha `NAGWEB_02_Motion_Lab_CONTEXTO.md` y el documento universal de `main`.

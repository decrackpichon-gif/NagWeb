# NAGWEB 05 | Biblioteca de recursos · Entrega candidata V1.0

**Estado a 16/10/2026: V1.0 técnicamente aprobada, lista para aceptación manual y entrega.** La CI integral está verde en Windows y Linux. No confundir esto con haber observado personalmente la ejecución en la computadora del usuario.

- **Frente:** NAGWEB 05 | Biblioteca de recursos, único frente tratado aquí.
- **Repositorio:** https://github.com/decrackpichon-gif/NagWeb
- **Rama exclusiva:** `feat/resource-etl-v1`. No usar `main` ni otras ramas para probar esta entrega.
- **Commit de código validado:** `dfcd35edf072b6f4f6362374db0c94691137aec9`, https://github.com/decrackpichon-gif/NagWeb/commit/dfcd35edf072b6f4f6362374db0c94691137aec9
- **Pruebas verificadas (los cuatro trabajos `success`):** https://github.com/decrackpichon-gif/NagWeb/actions/runs/38777181423 . Contiene informes y capturas de Chromium Linux y Windows, más Self test y Windows smoke.
- **Última publicación comprobada del índice derivado:** https://github.com/decrackpichon-gif/NagWeb/actions/runs/38749871198 (`success`).
- **Separación:** `resource-vault-data` almacena los snapshots de catálogo y no debe fusionarse con la rama de código. El uso de la Biblioteca puede descargar del Vault al abrir un recurso por primera vez.

## Cómo abrir el editor integrado en Windows

1. En **GitHub Desktop**, seleccionar el repositorio `NagWeb` y cambiar a la rama **`feat/resource-etl-v1`**. Hacer **Fetch origin** / **Pull origin** hasta tener el último commit de esta rama, y elegir **Repository → Open in Command Prompt** (o abrir una terminal en la raíz de `NagWeb`).
2. Comprobar que está instalado **Node.js**: ejecutar `node --version`. Si no se reconoce, instalar Node.js desde https://nodejs.org/ . No se necesita Python.
3. Desde la **carpeta raíz de NagWeb**, ejecutar:

   ```powershell
   npx --yes http-server . -a 127.0.0.1 -p 8000 -c-1
   ```

   La primera ejecución de `npx` puede descargar el pequeño servidor desde npm. Mantener esa terminal abierta mientras se prueba. Si el puerto está ocupado, sustituir `8000` por `8001`.
4. Abrir **http://127.0.0.1:8000/** en Chrome o Edge. Elegir/crear una escena, y usar el botón **Biblioteca de recursos** para abrir la integración. No abrir `index.html` mediante `file://`: requiere HTTP para módulos, iframe y caché.

## Aceptación manual mínima (una sola pasada)

En una escena de prueba:
1. Buscar y **insertar un SVG** Lucide o Heroicons. Editar el color; abrir la personalización desde el botón o doble clic en el SVG. Solo hacer clic no debe cambiar tamaño ni crear pasos en Deshacer.
2. Insertar un componente HTML/CSS Uiverse o SpinKit **marcado como compatible**. Modificar una propiedad, guardar y comprobar que sigue siendo editable, sin scripts externos.
3. Seleccionar un título o imagen, aplicar Magic.css o CSSShake, cambiar un ajuste de animación, quitarlo y deshacer. Probar que el objeto original permanece.
4. **Recargar** el navegador y confirmar que los objetos y sus cambios siguen ahí. Cambiar a vista móvil y verificar que se puedan ver/seleccionar.
5. **Exportar el sitio** y abrir el HTML exportado. Confirmar que los SVG y los estilos/animaciones utilizados se incluyen y funcionan; verificar sin conexión si los recursos ya estaban descargados.

**Criterio de aprobación:** poder completar los cinco puntos sin pérdida de elementos o datos, errores graves, objetos no editables pese a figurar como compatibles, ni fallos de exportación. Si hay problema, reportar el paso exacto; corregir solo ese bloqueo. La validación automática ya ejercita rutas análogas en Windows y Linux.

## Qué incluye V1.0

- Catálogo con **6762 recursos** verificados, búsqueda, filtros, miniaturas, favoritos y metadatos de licencias.
- **6041 clasificados de uso nativo** según su adaptador, no 6041 componentes universalmente personalizables. **721 solo consulta/código**. El material con licencias o adaptadores no aptos no se inserta de forma insegura.
- Inserción, edición posterior y exportación de SVG Lucide/Heroicons; componentes HTML/CSS Uiverse y SpinKit compatibles aislados; Magic.css y CSSShake sobre elementos existentes (con historial, persistencia y exportación).
- Cacheo persistente verificado y uso offline **parcial** tras una primera carga. No prometer que todos los 6762 recursos funcionan sin red desde cero.
- Pruebas automáticas completas aprobadas con capturas e informes disponibles en GitHub Actions.

## Qué NO bloquea esta entrega

- Integrar todos los componentes React, Three.js, GLSL y Lottie como objetos editables: se posterga expresamente a V1.1+; hoy conservar exploración/código donde corresponda.
- Más fuentes, efectos, variantes, filtros, nuevas vistas, pulido cosmético y ampliaciones offline. Sin requisitos nuevos en la V1.0.

## Cómo cerrar V1.0 sin trabajo innecesario

Una vez confirmados los cinco puntos manuales, registrar «aceptación V1.0 OK» con la fecha y el commit **de código ya aprobado**, declarar la entrega y mantener la rama sin merge o despliegue por defecto. Si el usuario solicita una etiqueta de release, usar nombre exclusivo del frente para no afectar otros productos.

**Cambios prohibidos sin autorización:** merge a `main`, deploy en Vercel, tocar ramas de los otros cuatro proyectos y reescribir `resource-vault-data`.

# Rivera · Banco de referencias de diseño

Galería estática de referencias para el equipo de identidad de marca ciudad de Rivera, Uruguay.

## Proyecto y continuidad

- Repositorio: `decrackpichon-gif/NagWeb`.
- Rama exclusiva: `rivera/banco-referencias`.
- Carpeta exclusiva: `rivera-referencias/`.
- Proyecto Vercel: `rivera-banco-referencias`.
- Equipo Vercel: `nahue2` / `team_ZQck5VSbV0p7W876FbxKGSMI`.
- ID del proyecto: `prj_Ujsz8qfGHIZiVdmyJYeytcSfi80P`.
- Root Directory: `rivera-referencias`.
- Output Directory: `public`.
- Framework: Other / sin framework, sin instalación ni build.

Este banco es independiente de los cinco frentes de NagWeb. No modificar `main`, las ramas de los editores ni los otros proyectos de Vercel. No requiere servicios externos, credenciales en el frontend ni pagos de API.

## Contenido publicado el 20/10/2026

47 referencias profesionales y 19 trabajos con enlace Behance, incluidos los nueve casos originales. Vistas previas optimizadas y almacenadas junto al sitio, con atribución y enlaces a las fuentes en cada ficha. Se descartaron fichas que no permitían mostrar aplicaciones útiles.

Dos categorías de moodboard: editorial y modular / fluido y conectado. Once recursos gráficos, cuatro atributos de Rivera, búsqueda, filtro de fuentes, orden por estudio y nombre, fichas con galería ampliable y favoritos guardados localmente en el navegador.

Las asociaciones con Rivera son análisis propio. Las obras son de sus autores. Una referencia histórica no implica que la identidad siga vigente. No presentar las imágenes como assets originales o licenciados para la marca Rivera.

## Actualizar manteniendo la misma URL

1. Leer el HEAD actual de esta rama, este README y los archivos de `public/`.
2. Ampliar `public/data.js` y añadir imágenes a `public/assets/`. Cada ficha contiene id estable, título, estudio, fuente, descripción, qué mirar, propuesta para Rivera, etiquetas, atributos, moodboards e imágenes con URL de origen.
3. Validar las imágenes reales, IDs, enlaces y flujo de búsqueda → filtro → ficha → galería. Comprobar favoritos después de recargar si se cambia su código.
4. Guardar solamente los cambios de `rivera-referencias/` en esta rama.
5. Cuando el usuario lo pida, desplegar el commit exacto en producción en el mismo proyecto de Vercel. Usar su dominio de producción; no entregar como URL permanente un deployment con hash.

La configuración `git.deploymentEnabled: false` evita despliegues automáticos e innecesarios. Las actualizaciones se publican explícitamente en el mismo proyecto cuando el usuario las solicita. No crear un proyecto o URL nuevos para cada ampliación.

## Uso local

`public/index.html` se puede abrir directamente porque los datos están en un archivo JavaScript local. Para una vista equivalente a producción, servir la carpeta `public/` con un servidor estático. No hay dependencias que instalar.

Los favoritos pertenecen al navegador y dispositivo; no son una selección compartida del equipo. «Copiar enlace» conserva filtros y búsquedas en la URL. Las fichas admiten enlaces directos con el parámetro `ref`.

## Corrección de acceso a todas las referencias · 20/10/2026

Se eliminó la paginación que mostraba sólo 18 tarjetas. El catálogo completo se presenta al entrar; las imágenes siguen cargándose de forma diferida. Se agregó «Referencias de este chat» con los nueve casos de la primera selección: Kew, Garden Museum, Natural History Museum, Buff, Pen Store, Mind, Stride, Porto y MIT Media Lab. La navegación principal limpia filtros previos para evitar que «Explorar todo» mantenga resultados ocultos. Conservar todos los casos del chat al ampliar el banco.

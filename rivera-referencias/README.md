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

## Catálogo y clasificación · 20/10/2026

98 referencias profesionales, 215 vistas previas locales y 45 trabajos con enlace Behance. Esta actualización suma 18 casos y conserva los 80 anteriores con sus IDs y favoritos.

Cada trabajo tiene una o más categorías en tres ejes:

- Según el moodboard: Editorial y modular / Fluido y conectado.
- Recurso gráfico: Ilustración naturalista, Formas orgánicas, Líneas y recorridos, Enlaces y encuentros, Geometría modular, Tramas y patrones, Expansión y ondas, Tipografía, Fotografía, Collage y Texturas.
- Atributos de Rivera: Natural, En Auge, Transfronteriza e Interconectada.

Las tarjetas muestran el moodboard y todos sus atributos; las fichas muestran la clasificación completa y las notas Qué mirar / Para Rivera. Se pueden combinar filtros, buscar, ordenar por estudio y guardar favoritos localmente.

La navegación está pensada para el equipo de diseño. No volver a crear secciones basadas en el chat o la fecha de incorporación. Los antiguos enlaces `?view=chat` y `?view=new` abren el catálogo completo. No eliminar sus proyectos. Escribir siempre Rivera con mayúscula inicial en los rótulos de marca.

Las asociaciones con Rivera son análisis propio. Las obras conservan sus autorías y fuentes. Las referencias históricas y los conceptos profesionales se identifican cuando corresponde.

## Actualizar manteniendo la misma URL

1. Leer el HEAD actual de la rama exclusiva y este README.
2. Ampliar public/data.js y public/assets/ sin borrar los casos previos. Cada ficha debe incluir id estable, título, estudio, fuente real, descripción, qué mirar, propuesta para Rivera, moodboards, recursos, atributos e imágenes con su procedencia exacta.
3. Verificar IDs, clasificación e imágenes. Si se modifica la interfaz, comprobar un recorrido de filtros y una ficha. No repetir pruebas ya resueltas sin un cambio que lo justifique.
4. Guardar solamente los cambios de rivera-referencias/ en rivera/banco-referencias.
5. Desplegar el commit exacto en el mismo proyecto Vercel cuando el usuario pida publicar. Conservar https://rivera-banco-referencias.vercel.app/.

La configuración git.deploymentEnabled:false evita despliegues automáticos. No crear otro proyecto o URL para las ampliaciones.

## Uso local

Servir public/ como carpeta estática. Los datos se cargan desde un JavaScript local y las imágenes están en public/assets/. No hay dependencias que instalar.

Los favoritos pertenecen al navegador y dispositivo. Copiar enlace conserva filtros y búsqueda; el parámetro ref abre una ficha directamente.

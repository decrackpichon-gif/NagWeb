# NAGWEB 01 | Referencias originales recuperadas y alcance comprobado

> **Inventario documental del 14/10/2026.** Este documento complementa a [la ficha de continuidad](NAGWEB_01_Editor_Principal_CONTEXTO.md) y a [la documentación técnica](../storytelling-engine-v2.md). **No** reemplaza el HEAD, los commits ni las pruebas de `feat/storytelling-engine-v2`. No es un inventario exhaustivo de todos los enlaces de chats históricos.

## Referencias con procedencia identificable

| Material / enlace | Procedencia comprobada | Uso para NAGWEB 01 | Precaución |
|---|---|---|---|
| [NagWeb, repositorio](https://github.com/decrackpichon-gif/NagWeb) | Dirección del repositorio aportada por el usuario, conservada en la ficha del proyecto y en documentos históricos | Fuente real del editor, modelos, recursos, historial y pruebas | No usar `main` como HEAD del Editor principal |
| [Rama `feat/storytelling-engine-v2`](https://github.com/decrackpichon-gif/NagWeb/tree/feat/storytelling-engine-v2) | Rama original de Storytelling Engine, verificada por GitHub | Continuidad del código del Editor principal | No realizar merges entre frentes |
| [Animos, editor original](https://animos.app/editor) | URL que el usuario aportó en la fase histórica previa a la separación de los cinco frentes | Referencia transversal de UX de edición/previsualización, keyframes y movimiento; ayuda a entender las decisiones iniciales | La investigación y réplica funcional de presets pertenece ahora a **NAGWEB 02 | Motion Lab**; no mezclar desarrollos ni afirmar fidelidad visual no comprobada |
| [Vista previa histórica del Editor](https://nag-5oliq781j-nahue2.vercel.app) | URL emitida históricamente por un asistente, **no acreditada como enlace de referencia aportado por el usuario** | Comparación histórica, si todavía funciona | No representa necesariamente el código actual |
| [Vista previa histórica de la rama Storytelling](https://nagweb-git-feat-storytelling-engine-v2-nahue2.vercel.app) | Dirección histórica de despliegue, registrada en el inventario de recuperación | Comparación histórica, si todavía funciona | Vercel no se despliega de nuevo para revisar documentación |

## Archivos de referencia original que sí pudieron localizarse

Los siguientes originales **existen en la Biblioteca del usuario**. Se identificaron por su nombre exacto, no se subieron al repositorio público. El archivo **Scrollcraft 1.3 HTML fue recuperado y examinado para esta revisión**; contiene el prototipo integrado y diversas URLs de servicios/embed. Esas direcciones dentro del HTML son **dependencias/servicios del producto**, no evidencia de que el usuario enviara cada una como referencia externa de diseño.

| Archivo de Biblioteca | Evidencia y uso | Estado |
|---|---|---|
| `Scrollcraft_1.1_creativos_extra.html` | Prototipo anterior del catálogo creativo, conservado en Biblioteca | Localizado por nombre; no afirmar inspección visual nueva |
| `Scrollcraft_1.2_catalogo_creativos_baul.html` | Prototipo histórico con recursos creativos | Localizado por nombre; no afirmar inspección visual nueva |
| `Scrollcraft_1.3_interactivos_agrupados.html` | Prototipo de Creativos/Interactivos con integraciones; **no** es el código actual de la rama | Archivo recuperado e inspeccionado como fuente histórica |
| `Scrollcraft_1.3_interactivos_agrupados.zip`, `Scrollcraft — taller de sitios con scroll en 3D 1.0.zip`, `Web Scrollcraft — taller de sitios con scroll en 3D.zip` | Versiones históricas citadas en la ficha de contexto | Referencias de recuperación, **no** se verificaron sus bytes en esta revisión |
| `INVENTARIO_REFERENCIAS_NAGWEB.md` y `NAGWEB_01_Editor_principal.md` | Documentos auxiliares de recuperación, elaborados posteriormente | Archivos abiertos; se comprobó que documentan GitHub, las vistas previas y el límite de exhaustividad |
| `Markdown pegado(1).md` | Reglas y antecedentes de continuidad del Editor principal | Archivo histórico recuperado; no contiene URLs literales adicionales para atribuir al usuario |

**Si una tarea necesita identificar un comportamiento exacto de Scrollcraft 1.1/1.2/1.3**, buscar el nombre literal en Files/Biblioteca y examinar ese archivo específico. No rehacer el proyecto copiando el HTML antiguo.

## Fuente de verdad del desarrollo (actualizable, no histórica)

- [Commits cronológicos](https://github.com/decrackpichon-gif/NagWeb/commits/feat/storytelling-engine-v2): consulta GitHub REST `/repos/decrackpichon-gif/NagWeb/commits?sha=feat/storytelling-engine-v2&per_page=20`.
- [GitHub Actions del Editor](https://github.com/decrackpichon-gif/NagWeb/actions?query=branch%3Afeat%2Fstorytelling-engine-v2): consultar en cada avance el run del **SHA actual**; no ejecutar nuevamente suites ya aprobadas si solo se busca contexto.
- [Modelo de Storytelling](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/js/nagweb-story-model.js), [Editor del Storytelling](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/js/nagweb-story-editor.js), [Comportamientos](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/js/nagweb-behaviors-v2.js) y [documento técnico](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/docs/storytelling-engine-v2.md): evidencias de la implementación; no reemplazarlas por el prototipo archivado.
- **Comprobación al preparar este registro**: HEAD funcional `9b8b5af62484fb6c4c1c13ec04dcd3e420abae5d`, commit `fix(editor): pass image context to scroll chapters and restore stable smoke order`; GitHub Actions run `38619027215` concluyó `success`. Esta información es una **fotografía**; el HEAD puede avanzar por trabajo concurrente.
- [Protección Vercel](../../vercel.json): `git.deploymentEnabled: false`. No realizar despliegues salvo pedido explícito del usuario.

## Información pendiente: cómo tratarla sin bloquear ni inventar

1. **No se recuperaron todas las URLs literales** de conversaciones antiguas del Editor principal. No afirmar un inventario exhaustivo ni completar direcciones de memoria. Esto no pone en duda las funciones actuales respaldadas por código y CI.
2. Una URL externa nueva aportada por el usuario debe archivarse con **dirección literal, procedencia, fecha y propósito**. Distinguir «usuario», «fuente encontrada en código», «prototipo histórico» y «enlace generado por asistente».
3. **No emprender investigaciones retrospectivas repetitivas** antes de cada «Avanza». Leer la ficha, el HEAD y el documento técnico; consultar un original solo si la funcionalidad en curso lo requiere.
4. Cuando la fuente faltante sea imprescindible, **indicar exactamente cuál** y solicitar únicamente esa URL o archivo, sin pedir toda la historia de conversaciones.
5. Mantener NAGWEB 01 exclusivo. Motion Lab, Cámara 3D, Interaction Studio y Biblioteca de recursos tienen sus propios contextos y ramas. Conservar Director de Scroll como propietario del progreso donde aplique, sin reconstruir componentes ya implementados.
